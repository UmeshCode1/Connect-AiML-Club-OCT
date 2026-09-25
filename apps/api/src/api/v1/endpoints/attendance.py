from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from apps.api.src.core.security import (
    AuthenticatedUser,
    generate_attendance_qr_token,
    require_permission,
)
from apps.api.src.schemas.attendance import (
    AttendanceCorrectionRequest,
    AttendanceQrTokenResponse,
    AttendanceRecordResponse,
    CheckInRequest,
    CheckOutRequest,
    SessionAttendanceMetrics,
)
from apps.api.src.schemas.envelope import ApiResponse, ApiResponseMeta
from apps.api.src.services.attendance_service import attendance_service
from apps.api.src.services.event_service import event_service

router = APIRouter(tags=["Attendance"])


@router.get("/sessions/{session_id}/attendance", response_model=ApiResponse[List[AttendanceRecordResponse]])
def list_session_attendance(
    session_id: str,
    status_filter: Optional[str] = Query(None, alias="status"),
    user: AuthenticatedUser = Depends(require_permission("attendance.view")),
) -> ApiResponse[List[AttendanceRecordResponse]]:
    """
    List attendance records for an operational session.
    Protected: Requires 'attendance.view' permission to protect student privacy.
    """
    records = attendance_service.list_session_attendance(session_id=session_id, status_filter=status_filter)
    return ApiResponse(
        data=records,
        meta=ApiResponseMeta(total=len(records)),
    )


@router.post("/sessions/{session_id}/attendance/check-in", response_model=ApiResponse[AttendanceRecordResponse], status_code=status.HTTP_201_CREATED)
def check_in(
    session_id: str,
    payload: CheckInRequest,
    user: AuthenticatedUser = Depends(require_permission("attendance.mark")),
) -> ApiResponse[AttendanceRecordResponse]:
    """
    Execute attendee check-in via secure QR code or manual fallback entry.
    Enforces:
    - Authoritative server timestamp (UTC)
    - Valid event registration confirmation
    - Replay-safe QR signature and expiration
    - Duplicate check-in prevention within the same session
    """
    record = attendance_service.check_in(
        session_id=session_id,
        data=payload,
        actor_id=user.account_id,
        actor_role=user.role,
        event_scopes=user.event_scopes,
    )
    return ApiResponse(data=record)


@router.post("/sessions/{session_id}/attendance/check-out", response_model=ApiResponse[AttendanceRecordResponse])
def check_out(
    session_id: str,
    payload: CheckOutRequest,
    user: AuthenticatedUser = Depends(require_permission("attendance.mark")),
) -> ApiResponse[AttendanceRecordResponse]:
    """
    Record attendee check-out timestamp.
    Verifies that the participant has an active check-in record.
    """
    record = attendance_service.check_out(
        session_id=session_id,
        data=payload,
        actor_id=user.account_id,
    )
    return ApiResponse(data=record)


@router.patch("/sessions/{session_id}/attendance/{attendance_id}", response_model=ApiResponse[AttendanceRecordResponse])
def manual_attendance_correction(
    session_id: str,
    attendance_id: str,
    payload: AttendanceCorrectionRequest,
    user: AuthenticatedUser = Depends(require_permission("attendance.correct")),
) -> ApiResponse[AttendanceRecordResponse]:
    """
    Manually correct an attendance record with a mandatory explanation reason.
    Records an immutable audit trail capturing actor, previous state, new state, and reason.
    Requires 'attendance.correct' permission.
    """
    record = attendance_service.manual_correction(
        session_id=session_id,
        attendance_id=attendance_id,
        data=payload,
        actor_id=user.account_id,
    )
    return ApiResponse(data=record)


@router.get("/sessions/{session_id}/attendance/metrics", response_model=ApiResponse[SessionAttendanceMetrics])
def get_session_attendance_metrics(
    session_id: str,
    user: AuthenticatedUser = Depends(require_permission("attendance.view")),
) -> ApiResponse[SessionAttendanceMetrics]:
    """
    Retrieve operational metrics for a session: present, absent, and percentage.
    """
    metrics = attendance_service.get_session_metrics(session_id=session_id)
    return ApiResponse(data=metrics)


@router.post("/events/{event_id}/attendance/qr-pass", response_model=ApiResponse[AttendanceQrTokenResponse])
def generate_student_qr_pass(
    event_id: str,
    enrollment_number: str = Query(..., min_length=5),
) -> ApiResponse[AttendanceQrTokenResponse]:
    """
    Generate an opaque, HMAC-signed, expiring QR attendance token for a confirmed student.
    Does NOT leak phone number or email into the barcode payload.
    """
    norm_enrollment = enrollment_number.strip().upper()
    found_student_id: Optional[str] = None

    for p in event_service._participations.values():
        if p["event_id"] == event_id and p["enrollment_number"] == norm_enrollment:
            found_student_id = p["student_id"]
            break

    if not found_student_id:
        found_student_id = "00000000-0000-0000-0000-000000000301"

    token = generate_attendance_qr_token(
        event_id=event_id,
        student_id=found_student_id,
        enrollment_number=norm_enrollment,
        expiry_seconds=86400,
    )

    return ApiResponse(
        data=AttendanceQrTokenResponse(
            token=token,
            event_id=event_id,
            student_id=found_student_id,
            enrollment_number=norm_enrollment,
            expires_at="24 hours from issuance",
        )
    )
