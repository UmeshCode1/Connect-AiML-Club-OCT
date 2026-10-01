"""
AIML CLUB OCT — CONNECT
Projects Endpoints (/v1/projects)

Specification Reference:
- 01_PRODUCT_REQUIREMENTS.md (Section 19)
- 04_RBAC_PERMISSIONS.md (Projects.*)
- 05_API_SPECIFICATION.md (Section 19)
- 11_SECURITY_PRIVACY.md (URL Sanitization, Granular RBAC)
"""

from typing import Any, Dict, List, Optional
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
    ProjectCreate,
    ProjectMemberCreate,
    ProjectMemberResponse,
    ProjectResponse,
    ProjectUpdate,
)
from apps.api.src.services.project_service import project_service

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=ApiResponse[List[ProjectResponse]])
def list_projects(
    status_filter: Optional[str] = Query(None, alias="status"),
    tag: Optional[str] = None,
    event_id: Optional[str] = None,
    featured: Optional[bool] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    user: Optional[AuthenticatedUser] = Depends(get_optional_current_user),
) -> ApiResponse[List[ProjectResponse]]:
    """
    Public listing returns only published and publicly visible projects.
    Authenticated staff (SUPER_ADMIN, CLUB_ADMIN, CONTENT_MANAGER) can view all projects.
    Students can view projects they are registered as members of.
    """
    is_admin = False
    if user:
        if user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("projects.view", user.permissions) or check_permission_match("projects.*", user.permissions):
            is_admin = True

    projects, total = project_service.list_projects(
        status_filter=status_filter,
        tag=tag,
        event_id=event_id,
        is_featured=featured,
        search=search,
        is_admin=is_admin,
        current_user=user,
        page=page,
        page_size=page_size,
    )

    has_next = (page * page_size) < total
    return ApiResponse(
        data=projects,
        meta=ApiResponseMeta(
            page=page,
            page_size=page_size,
            total=total,
            has_next=has_next,
        ),
    )


@router.post("", response_model=ApiResponse[ProjectResponse], status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[ProjectResponse]:
    """
    Submits a new student or institutional project proposal.
    Requires authentication. The creating student is automatically designated as LEAD.
    """
    project = project_service.create_project(payload, current_user=user)
    return ApiResponse(data=project)


@router.get("/{slug}", response_model=ApiResponse[ProjectResponse])
def get_project_by_slug(
    slug: str,
    user: Optional[AuthenticatedUser] = Depends(get_optional_current_user),
) -> ApiResponse[ProjectResponse]:
    """
    Retrieves project details by unique URL slug.
    Public requests return 404 for unpublished/internal projects.
    """
    is_admin = False
    if user:
        if user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("projects.view", user.permissions) or check_permission_match("projects.*", user.permissions):
            is_admin = True

    project = project_service.get_project_by_slug(slug, is_admin=is_admin, current_user=user)
    return ApiResponse(data=project)


@router.patch("/{id}", response_model=ApiResponse[ProjectResponse])
def update_project(
    id: str,
    payload: ProjectUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[ProjectResponse]:
    """
    Updates project details. Restricted to project LEAD or club staff.
    """
    project = project_service.update_project(id, payload, current_user=user)
    return ApiResponse(data=project)


@router.delete("/{id}", response_model=ApiResponse[ProjectResponse])
def archive_project(
    id: str,
    user: AuthenticatedUser = Depends(require_permission("projects.delete")),
) -> ApiResponse[ProjectResponse]:
    """
    Archives a project (soft delete). Preserves historical integrity.
    Staff only (SUPER_ADMIN, CLUB_ADMIN, CONTENT_MANAGER).
    """
    project = project_service.archive_project(id, current_user=user)
    return ApiResponse(data=project)


@router.post("/{id}/publish", response_model=ApiResponse[ProjectResponse])
def publish_project(
    id: str,
    user: AuthenticatedUser = Depends(require_permission("projects.publish")),
) -> ApiResponse[ProjectResponse]:
    """
    Publishes a project proposal to the public showcase directory.
    Staff only (SUPER_ADMIN, CLUB_ADMIN, CONTENT_MANAGER).
    """
    project = project_service.publish_project(id, current_user=user)
    return ApiResponse(data=project)


# ------------------------------------------------------------------------------
# Project Members Endpoints
# ------------------------------------------------------------------------------

@router.get("/{id}/members", response_model=ApiResponse[List[ProjectMemberResponse]])
def list_project_members(
    id: str,
    user: Optional[AuthenticatedUser] = Depends(get_optional_current_user),
) -> ApiResponse[List[ProjectMemberResponse]]:
    """
    Lists contributors and mentors assigned to a project.
    """
    is_admin = False
    if user and (user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("projects.*", user.permissions)):
        is_admin = True

    members = project_service.list_project_members(id, is_admin=is_admin, current_user=user)
    return ApiResponse(data=members)


@router.post("/{id}/members", response_model=ApiResponse[ProjectMemberResponse], status_code=status.HTTP_201_CREATED)
def add_project_member(
    id: str,
    payload: ProjectMemberCreate,
    user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[ProjectMemberResponse]:
    """
    Adds a student contributor or mentor to a project.
    Restricted to project LEAD or staff.
    """
    member = project_service.add_project_member(id, payload, current_user=user)
    return ApiResponse(data=member)


@router.delete("/{id}/members/{student_id}", response_model=ApiResponse[Dict[str, Any]])
def remove_project_member(
    id: str,
    student_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[Dict[str, Any]]:
    """
    Removes a contributor from a project.
    Restricted to project LEAD or staff.
    """
    res = project_service.remove_project_member(id, student_id, current_user=user)
    return ApiResponse(data=res)
