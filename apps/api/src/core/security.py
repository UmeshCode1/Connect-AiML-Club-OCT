from typing import Optional, List
from fastapi import Header, Depends
from pydantic import BaseModel
from apps.api.src.core.errors import UnauthorizedException, PermissionDeniedException


class AuthenticatedUser(BaseModel):
    account_id: str
    auth_user_id: str
    email: Optional[str] = None
    role: str = "VIEWER"
    permissions: List[str] = []
    event_scopes: List[str] = []


def get_current_user(
    authorization: Optional[str] = Header(None)
) -> AuthenticatedUser:
    """
    Enforces authentication boundary.
    In testing / development without token, unauthenticated requests are rejected
    unless the endpoint is explicitly public.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise UnauthorizedException("Missing or malformed Authorization bearer token.")
    
    token = authorization.split(" ")[1]
    
    # Development test token bypass
    if token == "dev-admin-token":
        return AuthenticatedUser(
            account_id="00000000-0000-0000-0000-000000000001",
            auth_user_id="auth-admin-uuid",
            email="admin@aimlcluboct.in",
            role="CLUB_ADMIN",
            permissions=["events.view", "events.create", "events.update", "certificates.view"],
            event_scopes=["GLOBAL"],
        )
    
    # In production, validate token against SUPABASE_JWT_SECRET or Supabase Auth API
    raise UnauthorizedException("Invalid or expired session token.")


def require_permission(action: str):
    """
    Dependency factory to check granular action permission according to 04_RBAC_PERMISSIONS.md.
    """
    def permission_checker(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        if user.role == "SUPER_ADMIN":
            return user
        if action in user.permissions:
            return user
        raise PermissionDeniedException(f"Permission denied for action: '{action}'")
    return permission_checker
