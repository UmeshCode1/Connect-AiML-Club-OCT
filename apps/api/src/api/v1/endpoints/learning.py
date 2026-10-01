"""
AIML CLUB OCT — CONNECT
Learning Resources Endpoints (/v1/learning)

Specification Reference:
- 01_PRODUCT_REQUIREMENTS.md (Section 21)
- 04_RBAC_PERMISSIONS.md (Learning.*)
- 05_API_SPECIFICATION.md (Section 21)
- 11_SECURITY_PRIVACY.md (URL Sanitization, Granular RBAC)
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status

from apps.api.src.core.security import (
    AuthenticatedUser,
    check_permission_match,
    get_optional_current_user,
    require_permission,
)
from apps.api.src.schemas.envelope import ApiResponse, ApiResponseMeta
from apps.api.src.schemas.knowledge import (
    LearningResourceCreate,
    LearningResourceResponse,
    LearningResourceUpdate,
)
from apps.api.src.services.learning_service import learning_service

router = APIRouter(prefix="/learning", tags=["Learning Resources"])


@router.get("", response_model=ApiResponse[List[LearningResourceResponse]])
def list_resources(
    resource_type: Optional[str] = None,
    difficulty_level: Optional[str] = None,
    event_id: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    user: Optional[AuthenticatedUser] = Depends(get_optional_current_user),
) -> ApiResponse[List[LearningResourceResponse]]:
    """
    Public catalog of open educational learning resources (Notebooks, Slides, Datasets).
    Filtered by resource format, difficulty tier, or event association.
    """
    is_admin = False
    if user and (user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("learning.*", user.permissions)):
        is_admin = True

    resources, total = learning_service.list_resources(
        resource_type=resource_type,
        difficulty_level=difficulty_level,
        event_id=event_id,
        search=search,
        is_admin=is_admin,
        page=page,
        page_size=page_size,
    )

    has_next = (page * page_size) < total
    return ApiResponse(
        data=resources,
        meta=ApiResponseMeta(
            page=page,
            page_size=page_size,
            total=total,
            has_next=has_next,
        ),
    )


@router.post("", response_model=ApiResponse[LearningResourceResponse], status_code=status.HTTP_201_CREATED)
def create_resource(
    payload: LearningResourceCreate,
    user: AuthenticatedUser = Depends(require_permission("learning.create")),
) -> ApiResponse[LearningResourceResponse]:
    """
    Registers a new workshop notebook, tutorial, or dataset link.
    Staff only (SUPER_ADMIN, CLUB_ADMIN, CONTENT_MANAGER).
    """
    res = learning_service.create_resource(payload, current_user=user)
    return ApiResponse(data=res)


@router.get("/{slug}", response_model=ApiResponse[LearningResourceResponse])
def get_resource_by_slug(
    slug: str,
    user: Optional[AuthenticatedUser] = Depends(get_optional_current_user),
) -> ApiResponse[LearningResourceResponse]:
    """
    Retrieves educational resource details and launch links by slug.
    """
    is_admin = False
    if user and (user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("learning.*", user.permissions)):
        is_admin = True

    res = learning_service.get_resource_by_slug(slug, is_admin=is_admin)
    return ApiResponse(data=res)


@router.patch("/{id}", response_model=ApiResponse[LearningResourceResponse])
def update_resource(
    id: str,
    payload: LearningResourceUpdate,
    user: AuthenticatedUser = Depends(require_permission("learning.update")),
) -> ApiResponse[LearningResourceResponse]:
    """
    Updates learning resource title, type, difficulty tier, or external URL.
    Staff only.
    """
    res = learning_service.update_resource(id, payload, current_user=user)
    return ApiResponse(data=res)


@router.delete("/{id}", response_model=ApiResponse[Dict[str, Any]])
def delete_resource(
    id: str,
    user: AuthenticatedUser = Depends(require_permission("learning.delete")),
) -> ApiResponse[Dict[str, Any]]:
    """
    Deletes a learning resource from the catalog. Staff only.
    """
    res = learning_service.delete_resource(id, current_user=user)
    return ApiResponse(data=res)
