from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from apps.api.src.core.security import (
    AuthenticatedUser,
    check_permission_match,
    get_current_user,
    get_optional_current_user,
    require_permission,
)
from apps.api.src.schemas.chronicle import (
    ChronicleCreate,
    ChronicleResponse,
    ChronicleUpdate,
)
from apps.api.src.schemas.envelope import ApiResponse, ApiResponseMeta
from apps.api.src.services.chronicle_service import chronicle_service

router = APIRouter(prefix="/chronicle", tags=["Chronicle"])


@router.get("", response_model=ApiResponse[List[ChronicleResponse]])
def list_chronicles(
    status_filter: Optional[str] = Query(None, alias="status"),
    edition_type: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    user: Optional[AuthenticatedUser] = Depends(get_optional_current_user),
) -> ApiResponse[List[ChronicleResponse]]:
    """
    Public listing returns only published entries.
    Authenticated editorial staff (CONTENT_MANAGER, CLUB_ADMIN, SUPER_ADMIN) can inspect drafts and reviews.
    """
    is_admin = False
    if user:
        if user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("chronicle.view", user.permissions) or check_permission_match("chronicle.*", user.permissions):
            is_admin = True

    entries, total = chronicle_service.list_entries(
        status_filter=status_filter,
        edition_type=edition_type,
        search=search,
        is_admin=is_admin,
        page=page,
        page_size=page_size,
    )

    has_next = (page * page_size) < total
    return ApiResponse(
        data=entries,
        meta=ApiResponseMeta(
            page=page,
            page_size=page_size,
            total=total,
            has_next=has_next,
        ),
    )


@router.post("", response_model=ApiResponse[ChronicleResponse], status_code=status.HTTP_201_CREATED)
def create_chronicle(
    payload: ChronicleCreate,
    user: AuthenticatedUser = Depends(require_permission("chronicle.create")),
) -> ApiResponse[ChronicleResponse]:
    """
    Creates a new Chronicle entry in DRAFT state.
    Requires 'chronicle.create' permission (CONTENT_MANAGER, CLUB_ADMIN, SUPER_ADMIN).
    """
    entry = chronicle_service.create_entry(payload, author_id=user.account_id)
    return ApiResponse(data=entry)


@router.get("/{slug}", response_model=ApiResponse[ChronicleResponse])
def get_chronicle_by_slug(
    slug: str,
    user: Optional[AuthenticatedUser] = Depends(get_optional_current_user),
) -> ApiResponse[ChronicleResponse]:
    """
    Retrieves a single Chronicle publication by its URL slug.
    Public requests return 404 for unpublished/draft items to prevent data leakage.
    """
    is_admin = False
    if user:
        if user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("chronicle.view", user.permissions) or check_permission_match("chronicle.*", user.permissions):
            is_admin = True

    entry = chronicle_service.get_by_slug(slug, is_admin=is_admin)
    return ApiResponse(data=entry)


@router.patch("/{id}", response_model=ApiResponse[ChronicleResponse])
def update_chronicle(
    id: str,
    payload: ChronicleUpdate,
    user: AuthenticatedUser = Depends(require_permission("chronicle.update")),
) -> ApiResponse[ChronicleResponse]:
    """
    Updates Chronicle content, metadata, or linked events.
    Requires 'chronicle.update' permission.
    """
    entry = chronicle_service.update_entry(id, payload, user_id=user.account_id)
    return ApiResponse(data=entry)


@router.post("/{id}/submit-review", response_model=ApiResponse[ChronicleResponse])
def submit_chronicle_for_review(
    id: str,
    user: AuthenticatedUser = Depends(require_permission("chronicle.update")),
) -> ApiResponse[ChronicleResponse]:
    """
    Submits a draft Chronicle entry for editorial review.
    """
    entry = chronicle_service.submit_for_review(id, user_id=user.account_id)
    return ApiResponse(data=entry)


@router.post("/{id}/approve", response_model=ApiResponse[ChronicleResponse])
def approve_chronicle(
    id: str,
    user: AuthenticatedUser = Depends(require_permission("chronicle.approve")),
) -> ApiResponse[ChronicleResponse]:
    """
    Approves a Chronicle entry in REVIEW state.
    Requires 'chronicle.approve' permission.
    """
    entry = chronicle_service.approve(id, reviewer_id=user.account_id)
    return ApiResponse(data=entry)


@router.post("/{id}/publish", response_model=ApiResponse[ChronicleResponse])
def publish_chronicle(
    id: str,
    user: AuthenticatedUser = Depends(require_permission("chronicle.publish")),
) -> ApiResponse[ChronicleResponse]:
    """
    Publishes a Chronicle entry, making it visible to public readers.
    Requires 'chronicle.publish' permission.
    """
    entry = chronicle_service.publish(id, publisher_id=user.account_id)
    return ApiResponse(data=entry)
