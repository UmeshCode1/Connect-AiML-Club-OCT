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
from apps.api.src.schemas.journey import (
    JourneyMilestoneCreate,
    JourneyMilestoneResponse,
    JourneyMilestoneUpdate,
)
from apps.api.src.services.journey_service import journey_service

router = APIRouter(prefix="/journey", tags=["Journey"])


@router.get("", response_model=ApiResponse[List[JourneyMilestoneResponse]])
def list_journey_milestones(
    milestone_type: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    user: Optional[AuthenticatedUser] = Depends(get_optional_current_user),
) -> ApiResponse[List[JourneyMilestoneResponse]]:
    """
    Returns institutional timeline milestones in chronological sequence.
    Public calls receive only published milestones; editorial staff inspect all.
    """
    is_admin = False
    if user:
        if user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("journey.view", user.permissions) or check_permission_match("journey.*", user.permissions):
            is_admin = True

    milestones, total = journey_service.list_milestones(
        milestone_type=milestone_type,
        search=search,
        is_admin=is_admin,
        page=page,
        page_size=page_size,
    )

    has_next = (page * page_size) < total
    return ApiResponse(
        data=milestones,
        meta=ApiResponseMeta(
            page=page,
            page_size=page_size,
            total=total,
            has_next=has_next,
        ),
    )


@router.post("", response_model=ApiResponse[JourneyMilestoneResponse], status_code=status.HTTP_201_CREATED)
def create_journey_milestone(
    payload: JourneyMilestoneCreate,
    user: AuthenticatedUser = Depends(require_permission("journey.create")),
) -> ApiResponse[JourneyMilestoneResponse]:
    """
    Creates a new institutional milestone.
    References canonical events or media assets without duplication.
    """
    milestone = journey_service.create_milestone(payload, user_id=user.account_id)
    return ApiResponse(data=milestone)


@router.get("/{slug}", response_model=ApiResponse[JourneyMilestoneResponse])
def get_journey_milestone_by_slug(
    slug: str,
    user: Optional[AuthenticatedUser] = Depends(get_optional_current_user),
) -> ApiResponse[JourneyMilestoneResponse]:
    """
    Retrieves a milestone by its slug.
    Unpublished milestones return 404 for public callers.
    """
    is_admin = False
    if user:
        if user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("journey.view", user.permissions) or check_permission_match("journey.*", user.permissions):
            is_admin = True

    milestone = journey_service.get_by_slug(slug, is_admin=is_admin)
    return ApiResponse(data=milestone)


@router.patch("/{id}", response_model=ApiResponse[JourneyMilestoneResponse])
def update_journey_milestone(
    id: str,
    payload: JourneyMilestoneUpdate,
    user: AuthenticatedUser = Depends(require_permission("journey.update")),
) -> ApiResponse[JourneyMilestoneResponse]:
    """
    Updates milestone properties, linked canonical entities, or display order.
    """
    milestone = journey_service.update_milestone(id, payload, user_id=user.account_id)
    return ApiResponse(data=milestone)


@router.post("/{id}/publish", response_model=ApiResponse[JourneyMilestoneResponse])
def publish_journey_milestone(
    id: str,
    user: AuthenticatedUser = Depends(require_permission("journey.publish")),
) -> ApiResponse[JourneyMilestoneResponse]:
    """
    Publishes a milestone to the public institutional timeline.
    """
    milestone = journey_service.publish_milestone(id, user_id=user.account_id)
    return ApiResponse(data=milestone)
