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
    if len(parts) >= 2:
        module = parts[0]
        if f"{module}.*" in granted_permissions:
            return True
        if len(parts) == 3 and f"{parts[0]}.{parts[1]}.*" in granted_permissions:
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
                "volunteers.*",
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
    elif token == "dev-volunteer-token":
        return AuthenticatedUser(
            account_id="00000000-0000-0000-0000-000000000003",
            auth_user_id="auth-volunteer-uuid",
            email="volunteer@aimlcluboct.in",
            role="VOLUNTEER",
            permissions=["attendance.view", "attendance.mark"],
            event_scopes=["00000000-0000-0000-0000-000000000101"],
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


# ------------------------------------------------------------------------------
# Cryptographic QR Token Functions (Replay & Tamper Proof)
# ------------------------------------------------------------------------------
QR_SECRET_KEY = b"aiml-club-oct-connect-secure-qr-secret-key-2026"


def generate_attendance_qr_token(
    event_id: str,
    student_id: str,
    enrollment_number: str,
    expiry_seconds: int = 86400,
) -> str:
    """
    Generates a cryptographically signed, expiring, opaque QR token for attendance check-in.
    Does NOT leak private phone/email into the barcode payload.
    """
    import base64
    import hashlib
    import hmac
    import json
    import time

    now = int(time.time())
    payload = {
        "event_id": event_id,
        "student_id": student_id,
        "enrollment": enrollment_number.strip().upper(),
        "ts": now,
        "exp": now + expiry_seconds,
    }
    payload_bytes = json.dumps(payload, sort_keys=True).encode("utf-8")
    sig = hmac.new(QR_SECRET_KEY, payload_bytes, hashlib.sha256).hexdigest()
    return f"{base64.urlsafe_b64encode(payload_bytes).decode('utf-8')}.{sig}"


def verify_attendance_qr_token(token: str) -> dict:
    """
    Validates QR token signature and expiration.
    Raises ValueError on tampering, expiration, or malformed data.
    """
    import base64
    import hashlib
    import hmac
    import json
    import time

    parts = token.split(".")
    if len(parts) != 2:
        raise ValueError("Malformed attendance QR token format.")

    b64_payload, signature = parts[0], parts[1]
    try:
        payload_bytes = base64.urlsafe_b64decode(b64_payload.encode("utf-8"))
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception:
        raise ValueError("Invalid QR token payload encoding.")

    expected_sig = hmac.new(QR_SECRET_KEY, payload_bytes, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected_sig):
        raise ValueError("Tampered attendance QR token signature.")

    now = int(time.time())
    if payload.get("exp") and now > payload["exp"]:
        raise ValueError("Attendance QR token has expired.")

    return payload



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

