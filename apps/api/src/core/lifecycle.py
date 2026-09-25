"""
AIML CLUB OCT — CONNECT
Event Lifecycle State Machine

Specification Reference:
- 01_PRODUCT_REQUIREMENTS.md (Section 7)
- 07_DOMAIN_ARCHITECTURE.md (Section 3)

Canonical Event Lifecycle:
DRAFT -> PLANNING -> REGISTRATION_OPEN -> REGISTRATION_CLOSED -> LIVE -> COMPLETED -> MEDIA_PROCESSING -> CERTIFICATES -> ARCHIVED
"""

from typing import Dict, List, Set
from fastapi import HTTPException, status

EVENT_STATUSES: List[str] = [
    "DRAFT",
    "PLANNING",
    "REGISTRATION_OPEN",
    "REGISTRATION_CLOSED",
    "LIVE",
    "COMPLETED",
    "MEDIA_PROCESSING",
    "CERTIFICATES",
    "ARCHIVED",
]

# Strict finite state transitions mapping
ALLOWED_TRANSITIONS: Dict[str, Set[str]] = {
    "DRAFT": {"PLANNING", "ARCHIVED"},
    "PLANNING": {"REGISTRATION_OPEN", "DRAFT", "ARCHIVED"},
    "REGISTRATION_OPEN": {"REGISTRATION_CLOSED", "LIVE", "ARCHIVED"},
    "REGISTRATION_CLOSED": {"REGISTRATION_OPEN", "LIVE", "ARCHIVED"},
    "LIVE": {"COMPLETED", "ARCHIVED"},
    "COMPLETED": {"MEDIA_PROCESSING", "CERTIFICATES", "ARCHIVED"},
    "MEDIA_PROCESSING": {"CERTIFICATES", "COMPLETED", "ARCHIVED"},
    "CERTIFICATES": {"ARCHIVED", "COMPLETED"},
    "ARCHIVED": set(),  # Terminal state for regular operators
}

SUPER_ADMIN_REVERSIBLE_STATES: Set[str] = {"ARCHIVED"}


def validate_lifecycle_transition(
    current_status: str,
    target_status: str,
    is_super_admin: bool = False,
) -> bool:
    """
    Validates if transitioning from current_status to target_status is permitted.
    Raises HTTPException(400) with canonical error envelope on invalid transition.
    """
    if current_status not in ALLOWED_TRANSITIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown current event status: '{current_status}'.",
        )

    if target_status not in EVENT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown target event status: '{target_status}'. Must be one of {EVENT_STATUSES}",
        )

    if current_status == target_status:
        return True

    allowed = ALLOWED_TRANSITIONS[current_status]
    if target_status in allowed:
        return True

    # Super admin exception for recovering archived events back to draft
    if is_super_admin and current_status in SUPER_ADMIN_REVERSIBLE_STATES and target_status == "DRAFT":
        return True

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=(
            f"Invalid event lifecycle transition from '{current_status}' to '{target_status}'. "
            f"Allowed transitions from '{current_status}' are: {sorted(list(allowed)) or ['None (Terminal)']}"
        ),
    )
