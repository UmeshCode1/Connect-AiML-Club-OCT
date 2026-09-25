from typing import List
from fastapi import APIRouter, Depends, status

from apps.api.src.core.security import AuthenticatedUser, require_permission
from apps.api.src.schemas.attendance import SessionCreate, SessionResponse, SessionUpdate
from apps.api.src.schemas.envelope import ApiResponse, ApiResponseMeta
from apps.api.src.services.attendance_service import attendance_service

router = APIRouter(tags=["Sessions"])


@router.get("/events/{event_id}/sessions", response_model=ApiResponse[List[SessionResponse]])
def list_event_sessions(event_id: str) -> ApiResponse[List[SessionResponse]]:
    """
    Public and administrative listing of scheduled sessions for a specific event aggregate.
    """
    sessions = attendance_service.list_sessions(event_id=event_id)
    return ApiResponse(
        data=sessions,
        meta=ApiResponseMeta(total=len(sessions)),
    )


@router.post("/events/{event_id}/sessions", response_model=ApiResponse[SessionResponse], status_code=status.HTTP_201_CREATED)
def create_session(
    event_id: str,
    payload: SessionCreate,
    user: AuthenticatedUser = Depends(require_permission("events.update")),
) -> ApiResponse[SessionResponse]:
    """
    Schedule a new operational session under an existing event.
    Requires 'events.update' permission.
    """
    created = attendance_service.create_session(event_id=event_id, data=payload, actor_id=user.account_id)
    return ApiResponse(data=created)


@router.get("/sessions/{session_id}", response_model=ApiResponse[SessionResponse])
def get_session(session_id: str) -> ApiResponse[SessionResponse]:
    """
    Get detailed session timing, venue, and status information.
    """
    session = attendance_service.get_session(session_id=session_id)
    return ApiResponse(data=session)


@router.patch("/sessions/{session_id}", response_model=ApiResponse[SessionResponse])
def update_session(
    session_id: str,
    payload: SessionUpdate,
    user: AuthenticatedUser = Depends(require_permission("events.update")),
) -> ApiResponse[SessionResponse]:
    """
    Update session timing, venue, or status.
    Requires 'events.update' permission.
    """
    updated = attendance_service.update_session(session_id=session_id, data=payload, actor_id=user.account_id)
    return ApiResponse(data=updated)


@router.delete("/sessions/{session_id}", response_model=ApiResponse[SessionResponse])
def delete_session(
    session_id: str,
    user: AuthenticatedUser = Depends(require_permission("events.update")),
) -> ApiResponse[SessionResponse]:
    """
    Cancel an operational session.
    Requires 'events.update' permission.
    """
    deleted = attendance_service.delete_session(session_id=session_id, actor_id=user.account_id)
    return ApiResponse(data=deleted)
