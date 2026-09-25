from fastapi import APIRouter, Depends
from apps.api.src.core.security import get_current_user, AuthenticatedUser
from apps.api.src.schemas.envelope import ApiResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me", response_model=ApiResponse[AuthenticatedUser])
def get_current_user_profile(user: AuthenticatedUser = Depends(get_current_user)) -> ApiResponse[AuthenticatedUser]:
    """
    Returns profile and granted RBAC permissions for the authenticated identity.
    """
    return ApiResponse(data=user)
