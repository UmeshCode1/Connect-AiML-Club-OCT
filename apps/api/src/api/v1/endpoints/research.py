"""
AIML CLUB OCT — CONNECT
Research Endpoints (/v1/research)

Specification Reference:
- 01_PRODUCT_REQUIREMENTS.md (Section 20)
- 04_RBAC_PERMISSIONS.md (Research.*)
- 05_API_SPECIFICATION.md (Section 20)
- 11_SECURITY_PRIVACY.md (URL Sanitization, Granular RBAC)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from apps.api.src.core.security import (
    AuthenticatedUser,
    check_permission_match,
    get_current_user,
    get_optional_current_user,
    require_permission,
)
from apps.api.src.schemas.envelope import ApiResponse, ApiResponseMeta
from apps.api.src.schemas.knowledge import (
    ResearchItemCreate,
    ResearchItemResponse,
    ResearchItemUpdate,
)
from apps.api.src.services.research_service import research_service

router = APIRouter(prefix="/research", tags=["Research"])


@router.get("", response_model=ApiResponse[List[ResearchItemResponse]])
def list_research(
    category: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    event_id: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    user: Optional[AuthenticatedUser] = Depends(get_optional_current_user),
) -> ApiResponse[List[ResearchItemResponse]]:
    """
    Public listing returns only published research items.
    Authenticated staff can view all items including drafts.
    Authors can view their own draft items.
    """
    is_admin = False
    if user:
        if user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("research.view", user.permissions) or check_permission_match("research.*", user.permissions):
            is_admin = True

    items, total = research_service.list_research(
        category=category,
        status_filter=status_filter,
        event_id=event_id,
        search=search,
        is_admin=is_admin,
        current_user=user,
        page=page,
        page_size=page_size,
    )

    has_next = (page * page_size) < total
    return ApiResponse(
        data=items,
        meta=ApiResponseMeta(
            page=page,
            page_size=page_size,
            total=total,
            has_next=has_next,
        ),
    )


@router.post("", response_model=ApiResponse[ResearchItemResponse], status_code=status.HTTP_201_CREATED)
def create_research(
    payload: ResearchItemCreate,
    user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[ResearchItemResponse]:
    """
    Registers a new student pre-print, paper, or research dataset.
    Non-staff submissions start in DRAFT status awaiting editorial review.
    """
    item = research_service.create_research(payload, current_user=user)
    return ApiResponse(data=item)


@router.get("/{slug}", response_model=ApiResponse[ResearchItemResponse])
def get_research_by_slug(
    slug: str,
    user: Optional[AuthenticatedUser] = Depends(get_optional_current_user),
) -> ApiResponse[ResearchItemResponse]:
    """
    Retrieves full research paper abstract, methodology, and artifact links by slug.
    Public requests return 404 for draft/unpublished papers.
    """
    is_admin = False
    if user:
        if user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("research.view", user.permissions) or check_permission_match("research.*", user.permissions):
            is_admin = True

    item = research_service.get_research_by_slug(slug, is_admin=is_admin, current_user=user)
    return ApiResponse(data=item)


@router.patch("/{id}", response_model=ApiResponse[ResearchItemResponse])
def update_research(
    id: str,
    payload: ResearchItemUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[ResearchItemResponse]:
    """
    Updates research details. Authors may only edit draft papers.
    Content managers and administrators can edit any paper.
    """
    item = research_service.update_research(id, payload, current_user=user)
    return ApiResponse(data=item)


@router.delete("/{id}", response_model=ApiResponse[ResearchItemResponse])
def archive_research(
    id: str,
    user: AuthenticatedUser = Depends(require_permission("research.delete")),
) -> ApiResponse[ResearchItemResponse]:
    """
    Archives a research item. Staff only.
    """
    item = research_service.archive_research(id, current_user=user)
    return ApiResponse(data=item)


@router.post("/{id}/publish", response_model=ApiResponse[ResearchItemResponse])
def publish_research(
    id: str,
    user: AuthenticatedUser = Depends(require_permission("research.publish")),
) -> ApiResponse[ResearchItemResponse]:
    """
    Publishes a research item to the open academic catalog. Staff only.
    """
    item = research_service.publish_research(id, current_user=user)
    return ApiResponse(data=item)
