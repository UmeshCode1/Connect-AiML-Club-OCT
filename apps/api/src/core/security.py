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


def check_permission_match(required_action: str, granted_permissions: List[str]) -> bool:
    """
    Checks if required_action is granted.
    Supports:
    - Global wildcard: '*'
    - Module wildcard: 'module.*' (e.g. 'chronicle.*' covers 'chronicle.create')
    - Exact match: 'events.view'
    """
    if "*" in granted_permissions:
        return True
    if required_action in granted_permissions:
        return True
    
    parts = required_action.split(".")
    if len(parts) == 2:
        module = parts[0]
        if f"{module}.*" in granted_permissions:
            return True
            
    return False


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
    
    # Development test tokens for testing authorization tiers
    if token == "dev-admin-token":
        return AuthenticatedUser(
            account_id="00000000-0000-0000-0000-000000000001",
            auth_user_id="auth-admin-uuid",
            email="admin@aimlcluboct.in",
            role="CLUB_ADMIN",
            permissions=[
                "events.view",
                "events.create",
                "events.update",
                "events.delete",
                "events.publish",
                "events.*",
                "participants.view",
                "participants.create",
                "participants.update",
                "participants.delete",
                "participants.import",
                "participants.*",
                "attendance.*",
                "certificates.view",
                "certificates.generate",
                "certificates.issue",
                "certificates.*",
                "media.*",
                "chronicle.*",
                "journey.*",
                "projects.*"
            ],
            event_scopes=["GLOBAL"],
        )
    elif token == "dev-viewer-token":
        return AuthenticatedUser(
            account_id="00000000-0000-0000-0000-000000000002",
            auth_user_id="auth-viewer-uuid",
            email="viewer@aimlcluboct.in",
            role="VIEWER",
            permissions=["events.view"],
            event_scopes=["SELF"],
        )
    elif token == "dev-super-token":
        return AuthenticatedUser(
            account_id="00000000-0000-0000-0000-000000000000",
            auth_user_id="auth-super-uuid",
            email="superadmin@aimlcluboct.in",
            role="SUPER_ADMIN",
            permissions=["*"],
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
        if check_permission_match(action, user.permissions):
            return user
        raise PermissionDeniedException(f"Permission denied for action: '{action}'")
    return permission_checker


def get_optional_current_user(
    authorization: Optional[str] = Header(None)
) -> Optional[AuthenticatedUser]:
    """
    Optional authentication dependency for endpoints accessible to both public visitors and authenticated staff.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        return get_current_user(authorization=authorization)
    except Exception:
        return None

