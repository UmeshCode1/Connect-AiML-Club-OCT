from fastapi import APIRouter, Depends
from apps.api.src.core.security import get_current_user, check_permission_match, AuthenticatedUser
from apps.api.src.core.errors import PermissionDeniedException
from apps.api.src.schemas.envelope import ApiResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me", response_model=ApiResponse[AuthenticatedUser])
def get_current_user_profile(user: AuthenticatedUser = Depends(get_current_user)) -> ApiResponse[AuthenticatedUser]:
    """
    Returns profile and granted RBAC permissions for the authenticated identity.
    """
    return ApiResponse(data=user)


@router.get("/check-permission", response_model=ApiResponse[dict])
def check_permission(
    action: str,
    user: AuthenticatedUser = Depends(get_current_user)
) -> ApiResponse[dict]:
    """
    Evaluates whether the authenticated identity holds a specific action permission.
    Strictly verifies role hierarchy and wildcard grants.
    """
    granted = user.role == "SUPER_ADMIN" or check_permission_match(action, user.permissions)
    if not granted:
        raise PermissionDeniedException(f"Permission denied for action: '{action}'")
    return ApiResponse(data={"action": action, "granted": True, "role": user.role})
