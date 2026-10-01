"""
AIML CLUB OCT — CONNECT
Unified Authorization-Aware Search Endpoints (/v1/search)

Specification Reference:
- 01_PRODUCT_REQUIREMENTS.md (Section 22)
- 04_RBAC_PERMISSIONS.md (Granular RBAC boundaries)
- 05_API_SPECIFICATION.md (Section 22)
- 11_SECURITY_PRIVACY.md (Anti-Leakage, Private Data Isolation)
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query

from apps.api.src.core.security import (
    AuthenticatedUser,
    check_permission_match,
    get_optional_current_user,
)
from apps.api.src.schemas.envelope import ApiResponse, ApiResponseMeta
from apps.api.src.schemas.knowledge import SearchItemResponse
from apps.api.src.services.search_service import search_service

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=ApiResponse[List[SearchItemResponse]])
def global_search(
    q: str = Query(..., description="Search query string (minimum 2 characters)."),
    type: str = Query("all", description="Entity filter (all, events, projects, research, learning, chronicle, journey, team, certificates)."),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: Optional[AuthenticatedUser] = Depends(get_optional_current_user),
) -> ApiResponse[List[SearchItemResponse]]:
    """
    Unified authorization-aware search across all platform entities.
    Results are strictly bounded by caller authorization:
    - Public visitors: only publicly published resources.
    - Authenticated students: includes user's own projects, research drafts, and verified certificates.
    - Club staff: expanded administrative search across operational drafts and review queues.
    """
    is_admin = False
    if user:
        if user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("*", user.permissions):
            is_admin = True

    results, total = search_service.search(
        query=q,
        entity_type=type,
        is_admin=is_admin,
        current_user=user,
        page=page,
        page_size=page_size,
    )

    has_next = (page * page_size) < total
    return ApiResponse(
        data=results,
        meta=ApiResponseMeta(
            page=page,
            page_size=page_size,
            total=total,
            has_next=has_next,
        ),
    )
