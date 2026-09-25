from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from apps.api.src.core.security import (
    AuthenticatedUser,
    check_permission_match,
    get_optional_current_user,
    require_permission,
)
from apps.api.src.schemas.envelope import ApiResponse, ApiResponseMeta
from apps.api.src.schemas.events import (
    EventAnalyticsResponse,
    EventCreate,
    EventResponse,
    EventTransitionRequest,
    EventUpdate,
    ParticipationCreate,
    ParticipationResponse,
    ParticipationUpdate,
)
from apps.api.src.services.event_service import event_service

router = APIRouter(prefix="/events", tags=["Events"])


# ------------------------------------------------------------------------------
# Event Queries (Public & Admin Discovery)
# ------------------------------------------------------------------------------

@router.get("", response_model=ApiResponse[List[EventResponse]])
def list_events(
    status_filter: Optional[str] = Query(None, alias="status"),
    event_type: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    user: Optional[AuthenticatedUser] = Depends(get_optional_current_user),
) -> ApiResponse[List[EventResponse]]:
    """
    Public and Administrative event listing with database-level filtering, search, and pagination.
    Authenticated staff with 'events.view' can inspect all statuses (including DRAFT and ARCHIVED).
    """
    is_admin = False
    if user:
        if user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "EVENT_MANAGER") or check_permission_match("events.view", user.permissions):
            is_admin = True

    events, total = event_service.list_events(
        status=status_filter,
        event_type=event_type,
        search=search,
        is_admin=is_admin,
        page=page,
        page_size=page_size,
    )

    has_next = (page * page_size) < total
    return ApiResponse(
        data=events,
        meta=ApiResponseMeta(
            page=page,
            page_size=page_size,
            total=total,
            has_next=has_next,
        ),
    )


@router.post("", response_model=ApiResponse[EventResponse], status_code=status.HTTP_201_CREATED)
def create_event(
    payload: EventCreate,
    user: AuthenticatedUser = Depends(require_permission("events.create")),
) -> ApiResponse[EventResponse]:
    """
    Create a new event aggregate in DRAFT state.
    Requires 'events.create' permission.
    """
    created = event_service.create_event(data=payload, actor_id=user.account_id)
    return ApiResponse(data=created)


@router.get("/{id_or_slug}", response_model=ApiResponse[EventResponse])
def get_event(
    id_or_slug: str,
    user: Optional[AuthenticatedUser] = Depends(get_optional_current_user),
) -> ApiResponse[EventResponse]:
    """
    Get detailed event specification by UUID or human-readable slug.
    Publicly returns approved events; internal/draft events require 'events.view'.
    """
    is_admin = False
    if user:
        if user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "EVENT_MANAGER") or check_permission_match("events.view", user.permissions):
            is_admin = True

    evt = event_service.get_event(id_or_slug=id_or_slug, is_admin=is_admin)
    return ApiResponse(data=evt)


@router.patch("/{event_id}", response_model=ApiResponse[EventResponse])
def update_event(
    event_id: str,
    payload: EventUpdate,
    user: AuthenticatedUser = Depends(require_permission("events.update")),
) -> ApiResponse[EventResponse]:
    """
    Update event metadata, scheduling, or capacity.
    Requires 'events.update' permission.
    """
    updated = event_service.update_event(event_id=event_id, data=payload, actor_id=user.account_id)
    return ApiResponse(data=updated)


@router.delete("/{event_id}", response_model=ApiResponse[EventResponse])
def delete_or_archive_event(
    event_id: str,
    user: AuthenticatedUser = Depends(require_permission("events.delete")),
) -> ApiResponse[EventResponse]:
    """
    Safely archive an event with full audit trail.
    Requires 'events.delete' permission.
    """
    archived = event_service.archive_event(event_id=event_id, actor_id=user.account_id)
    return ApiResponse(data=archived)


# ------------------------------------------------------------------------------
# Lifecycle Transitions
# ------------------------------------------------------------------------------

@router.post("/{event_id}/transition", response_model=ApiResponse[EventResponse])
def transition_event_status(
    event_id: str,
    payload: EventTransitionRequest,
    user: AuthenticatedUser = Depends(require_permission("events.update")),
) -> ApiResponse[EventResponse]:
    """
    Execute a validated lifecycle state transition.
    Enforces canonical lifecycle state machine:
    DRAFT -> PLANNING -> REGISTRATION_OPEN -> REGISTRATION_CLOSED -> LIVE -> COMPLETED -> MEDIA_PROCESSING -> CERTIFICATES -> ARCHIVED
    """
    is_super = user.role == "SUPER_ADMIN"
    transitioned = event_service.transition_event(
        event_id=event_id,
        to_status=payload.to_status,
        actor_id=user.account_id,
        reason=payload.reason,
        is_super_admin=is_super,
    )
    return ApiResponse(data=transitioned)


@router.post("/{event_id}/publish", response_model=ApiResponse[EventResponse])
def publish_event(
    event_id: str,
    user: AuthenticatedUser = Depends(require_permission("events.publish")),
) -> ApiResponse[EventResponse]:
    """
    Publish an event into REGISTRATION_OPEN or LIVE state.
    Requires 'events.publish' permission.
    """
    published = event_service.transition_event(
        event_id=event_id,
        to_status="REGISTRATION_OPEN",
        actor_id=user.account_id,
        reason="Published by authorized event administrator",
    )
    return ApiResponse(data=published)


@router.post("/{event_id}/archive", response_model=ApiResponse[EventResponse])
def archive_event(
    event_id: str,
    user: AuthenticatedUser = Depends(require_permission("events.delete")),
) -> ApiResponse[EventResponse]:
    """
    Transition event into terminal ARCHIVED state.
    Requires 'events.delete' permission.
    """
    archived = event_service.archive_event(event_id=event_id, actor_id=user.account_id)
    return ApiResponse(data=archived)


# ------------------------------------------------------------------------------
# Registration & Participation
# ------------------------------------------------------------------------------

@router.post("/{event_id}/participants", response_model=ApiResponse[ParticipationResponse], status_code=status.HTTP_201_CREATED)
def register_participant(
    event_id: str,
    payload: ParticipationCreate,
) -> ApiResponse[ParticipationResponse]:
    """
    Register a student for an event.
    Enforces:
    - Event must be in 'REGISTRATION_OPEN' status
    - Registration deadline not exceeded
    - Duplicate registration prevention (enrollment number & email)
    - Capacity thresholds (auto-waitlists when capacity is exceeded)
    """
    participant = event_service.register_participant(event_id=event_id, data=payload)
    return ApiResponse(data=participant)


@router.get("/{event_id}/participants", response_model=ApiResponse[List[ParticipationResponse]])
def list_participants(
    event_id: str,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
    user: AuthenticatedUser = Depends(require_permission("participants.view")),
) -> ApiResponse[List[ParticipationResponse]]:
    """
    List registered participants for an event.
    Protected by RBAC: Requires 'participants.view' permission to safeguard student data.
    """
    participants = event_service.list_participants(event_id=event_id, status=status_filter, search=search)
    return ApiResponse(
        data=participants,
        meta=ApiResponseMeta(
            total=len(participants),
        ),
    )


@router.patch("/{event_id}/participants/{participation_id}", response_model=ApiResponse[ParticipationResponse])
def update_participant(
    event_id: str,
    participation_id: str,
    payload: ParticipationUpdate,
    user: AuthenticatedUser = Depends(require_permission("participants.update")),
) -> ApiResponse[ParticipationResponse]:
    """
    Update registration status, team, or notes.
    Requires 'participants.update' permission.
    """
    updated = event_service.update_participant(
        event_id=event_id,
        participation_id=participation_id,
        data=payload,
        actor_id=user.account_id,
    )
    return ApiResponse(data=updated)


@router.delete("/{event_id}/participants/{participation_id}", response_model=ApiResponse[ParticipationResponse])
def cancel_participant_registration(
    event_id: str,
    participation_id: str,
    user: AuthenticatedUser = Depends(require_permission("participants.update")),
) -> ApiResponse[ParticipationResponse]:
    """
    Cancel an existing participant registration.
    Requires 'participants.update' permission.
    """
    cancelled = event_service.cancel_participant(
        event_id=event_id,
        participation_id=participation_id,
        actor_id=user.account_id,
    )
    return ApiResponse(data=cancelled)


# ------------------------------------------------------------------------------
# Event Analytics
# ------------------------------------------------------------------------------

@router.get("/{event_id}/analytics", response_model=ApiResponse[EventAnalyticsResponse])
def get_event_analytics(
    event_id: str,
    user: AuthenticatedUser = Depends(require_permission("events.view")),
) -> ApiResponse[EventAnalyticsResponse]:
    """
    Retrieve operational metrics, registration breakdown, and capacity percentage.
    Requires 'events.view' permission.
    """
    analytics = event_service.get_event_analytics(event_id=event_id)
    return ApiResponse(data=analytics)
