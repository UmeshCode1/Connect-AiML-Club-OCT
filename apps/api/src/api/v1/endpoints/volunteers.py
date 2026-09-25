from typing import List
from fastapi import APIRouter, Depends, status

from apps.api.src.core.security import AuthenticatedUser, require_permission
from apps.api.src.schemas.attendance import VolunteerAssignRequest, VolunteerResponse
from apps.api.src.schemas.envelope import ApiResponse, ApiResponseMeta
from apps.api.src.services.attendance_service import attendance_service

router = APIRouter(tags=["Volunteers"])


@router.get("/events/{event_id}/volunteers", response_model=ApiResponse[List[VolunteerResponse]])
def list_event_volunteers(
    event_id: str,
    user: AuthenticatedUser = Depends(require_permission("volunteers.view")),
) -> ApiResponse[List[VolunteerResponse]]:
    """
    List volunteers assigned to an event and their operational roles.
    Requires 'volunteers.view' permission.
    """
    volunteers = attendance_service.list_volunteers(event_id=event_id)
    return ApiResponse(
        data=volunteers,
        meta=ApiResponseMeta(total=len(volunteers)),
    )


@router.post("/events/{event_id}/volunteers", response_model=ApiResponse[VolunteerResponse], status_code=status.HTTP_201_CREATED)
def assign_volunteer(
    event_id: str,
    payload: VolunteerAssignRequest,
    user: AuthenticatedUser = Depends(require_permission("volunteers.assign")),
) -> ApiResponse[VolunteerResponse]:
    """
    Assign an event volunteer to a specific operational responsibility (e.g. ATTENDANCE).
    Requires 'volunteers.assign' permission.
    """
    assigned = attendance_service.assign_volunteer(event_id=event_id, data=payload, actor_id=user.account_id)
    return ApiResponse(data=assigned)


@router.delete("/events/{event_id}/volunteers/{assignment_id}", response_model=ApiResponse[VolunteerResponse])
def remove_volunteer_assignment(
    event_id: str,
    assignment_id: str,
    user: AuthenticatedUser = Depends(require_permission("volunteers.assign")),
) -> ApiResponse[VolunteerResponse]:
    """
    Remove or cancel a volunteer's operational assignment.
    Requires 'volunteers.assign' permission.
    """
    removed = attendance_service.remove_volunteer(event_id=event_id, assignment_id=assignment_id, actor_id=user.account_id)
    return ApiResponse(data=removed)
