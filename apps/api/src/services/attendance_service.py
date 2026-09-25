"""
AIML CLUB OCT — CONNECT
Attendance, Session & Volunteer Operations Service

Specification Reference:
- 01_PRODUCT_REQUIREMENTS.md (Section 6, 7)
- 03_DATABASE_SCHEMA.md (Section 9, 10)
- 04_RBAC_PERMISSIONS.md
- 05_API_SPECIFICATION.md (Section 7)
- 11_SECURITY_PRIVACY.md
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException, status

from apps.api.src.core.security import verify_attendance_qr_token
from apps.api.src.schemas.attendance import (
    AttendanceCorrectionRequest,
    AttendanceRecordResponse,
    CheckInRequest,
    CheckOutRequest,
    SessionAttendanceMetrics,
    SessionCreate,
    SessionResponse,
    SessionUpdate,
    VolunteerAssignRequest,
    VolunteerResponse,
)
from apps.api.src.services.event_service import event_service


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class AttendanceService:
    def __init__(self):
        # In-memory transactional stores for sessions, attendance, and volunteers
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._attendance_records: Dict[str, Dict[str, Any]] = {}
        self._volunteers: Dict[str, Dict[str, Any]] = {}
        self._audit_logs: List[Dict[str, Any]] = []

        # Seed initial session for Aptify 2.0
        self._seed_initial_sessions()

    def _seed_initial_sessions(self):
        evt_1_id = "00000000-0000-0000-0000-000000000101"
        ses_1_id = "00000000-0000-0000-0000-000000000501"
        self._sessions[ses_1_id] = {
            "id": ses_1_id,
            "event_id": evt_1_id,
            "session_code": "SES-APT-01",
            "title": "Opening Keynote & AI Architectures",
            "description": "Foundational keynote on modern AI architectures and practical engineering workflows.",
            "venue": "Auditorium, Oriental College of Technology, Bhopal",
            "start_at": "2026-10-15T09:30:00Z",
            "end_at": "2026-10-15T12:00:00Z",
            "capacity": 250,
            "status": "SCHEDULED",
            "created_at": "2026-09-25T00:00:00Z",
            "updated_at": "2026-09-25T00:00:00Z",
        }

        # Seed initial volunteer for Aptify 2.0
        vol_1_id = "00000000-0000-0000-0000-000000000601"
        self._volunteers[vol_1_id] = {
            "id": vol_1_id,
            "event_id": evt_1_id,
            "session_id": ses_1_id,
            "student_id": "00000000-0000-0000-0000-000000000302",
            "student_name": "Rohan Deshmukh",
            "enrollment_number": "0126AL221050",
            "role": "ATTENDANCE",
            "status": "ASSIGNED",
            "assigned_by": "00000000-0000-0000-0000-000000000001",
            "created_at": "2026-09-25T00:00:00Z",
        }

    # --------------------------------------------------------------------------
    # Audit Logging
    # --------------------------------------------------------------------------
    def _record_audit(self, action: str, entity_type: str, entity_id: str, actor_id: str, details: Dict[str, Any]):
        self._audit_logs.append({
            "id": str(uuid.uuid4()),
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "actor_id": actor_id,
            "details": details,
            "timestamp": _now_iso(),
        })

    # --------------------------------------------------------------------------
    # 1. Session Operations
    # --------------------------------------------------------------------------
    def create_session(self, event_id: str, data: SessionCreate, actor_id: str) -> SessionResponse:
        # Validate event existence
        if event_id not in event_service._events:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event '{event_id}' not found.",
            )

        # Validate start < end
        if data.start_at >= data.end_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session start time must be strictly before end time.",
            )

        session_id = str(uuid.uuid4())
        session_code = data.session_code or f"SES-{session_id[:6].upper()}"
        now = _now_iso()

        new_session = {
            "id": session_id,
            "event_id": event_id,
            "session_code": session_code,
            "title": data.title.strip(),
            "description": data.description,
            "venue": data.venue,
            "start_at": data.start_at,
            "end_at": data.end_at,
            "capacity": data.capacity,
            "status": data.status or "SCHEDULED",
            "created_at": now,
            "updated_at": now,
        }

        self._sessions[session_id] = new_session
        self._record_audit(
            action="SESSION_CREATED",
            entity_type="EVENT_SESSION",
            entity_id=session_id,
            actor_id=actor_id,
            details={"title": data.title, "event_id": event_id},
        )
        return SessionResponse(**new_session)

    def list_sessions(self, event_id: str) -> List[SessionResponse]:
        sessions = [s for s in self._sessions.values() if s["event_id"] == event_id]
        sessions.sort(key=lambda s: s["start_at"])
        return [SessionResponse(**s) for s in sessions]

    def get_session(self, session_id: str) -> SessionResponse:
        if session_id not in self._sessions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session '{session_id}' not found.",
            )
        return SessionResponse(**self._sessions[session_id])

    def update_session(self, session_id: str, data: SessionUpdate, actor_id: str) -> SessionResponse:
        if session_id not in self._sessions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session '{session_id}' not found.",
            )

        s = self._sessions[session_id]
        start_at = data.start_at or s["start_at"]
        end_at = data.end_at or s["end_at"]
        if start_at >= end_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session start time must be strictly before end time.",
            )

        update_fields = data.model_dump(exclude_unset=True)
        for k, v in update_fields.items():
            s[k] = v

        s["updated_at"] = _now_iso()
        self._sessions[session_id] = s
        self._record_audit(
            action="SESSION_UPDATED",
            entity_type="EVENT_SESSION",
            entity_id=session_id,
            actor_id=actor_id,
            details=update_fields,
        )
        return SessionResponse(**s)

    def delete_session(self, session_id: str, actor_id: str) -> SessionResponse:
        if session_id not in self._sessions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session '{session_id}' not found.",
            )
        s = self._sessions[session_id]
        s["status"] = "CANCELLED"
        s["updated_at"] = _now_iso()
        self._record_audit(
            action="SESSION_CANCELLED",
            entity_type="EVENT_SESSION",
            entity_id=session_id,
            actor_id=actor_id,
            details={"session_id": session_id},
        )
        return SessionResponse(**s)

    # --------------------------------------------------------------------------
    # 2. QR & Manual Attendance Check-In / Check-Out
    # --------------------------------------------------------------------------
    def check_in(
        self,
        session_id: str,
        data: CheckInRequest,
        actor_id: str,
        actor_role: str,
        event_scopes: List[str],
    ) -> AttendanceRecordResponse:
        if session_id not in self._sessions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session '{session_id}' not found.",
            )

        session = self._sessions[session_id]
        event_id = session["event_id"]

        # Volunteer scope check: must be assigned to this event
        if actor_role == "VOLUNTEER" and "GLOBAL" not in event_scopes and event_id not in event_scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Volunteer is not assigned to manage attendance for this event.",
            )

        student_id: Optional[str] = None
        enrollment_num: Optional[str] = None

        # 1. Resolve student identity securely
        if data.qr_token:
            try:
                qr_payload = verify_attendance_qr_token(data.qr_token)
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid attendance QR code: {str(e)}",
                )

            # QR token event binding validation
            if qr_payload.get("event_id") != event_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This QR pass was issued for a different event.",
                )

            student_id = qr_payload["student_id"]
            enrollment_num = qr_payload["enrollment"]
        else:
            # Fallback manual entry
            enrollment_num = (data.enrollment_number or "").strip().upper()
            student_id = data.student_id

        if not student_id and not enrollment_num:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Must provide a valid QR pass or student enrollment number.",
            )

        # 2. Verify student has CONFIRMED registration for the parent event
        participation: Optional[Dict[str, Any]] = None
        for p in event_service._participations.values():
            if p["event_id"] == event_id:
                if (student_id and p["student_id"] == student_id) or (
                    enrollment_num and p["enrollment_number"] == enrollment_num
                ):
                    participation = p
                    break

        if not participation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Participant with enrollment '{enrollment_num}' is not registered for this event.",
            )

        if participation["registration_status"] != "CONFIRMED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Participant status is '{participation['registration_status']}'. Only CONFIRMED participants can check in.",
            )

        resolved_student_id = participation["student_id"]
        resolved_student_name = participation["student_name"]
        resolved_enrollment = participation["enrollment_number"]

        # 3. Duplicate check-in verification within this session
        for rec in self._attendance_records.values():
            if rec["session_id"] == session_id and rec["student_id"] == resolved_student_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Participant '{resolved_student_name}' ({resolved_enrollment}) is already checked in for this session.",
                )

        # 4. Authoritative server-side timestamp
        now = _now_iso()
        attendance_id = str(uuid.uuid4())

        new_record = {
            "id": attendance_id,
            "event_id": event_id,
            "session_id": session_id,
            "student_id": resolved_student_id,
            "student_name": resolved_student_name,
            "enrollment_number": resolved_enrollment,
            "check_in_at": now,
            "check_out_at": None,
            "status": "PRESENT",
            "source": data.source or "QR",
            "recorded_by": actor_id,
            "corrected_by": None,
            "correction_reason": None,
            "created_at": now,
            "updated_at": now,
        }

        self._attendance_records[attendance_id] = new_record
        self._record_audit(
            action="ATTENDANCE_CHECK_IN",
            entity_type="ATTENDANCE_RECORD",
            entity_id=attendance_id,
            actor_id=actor_id,
            details={
                "session_id": session_id,
                "student_id": resolved_student_id,
                "enrollment": resolved_enrollment,
                "source": data.source or "QR",
            },
        )
        return AttendanceRecordResponse(**new_record)

    def check_out(
        self,
        session_id: str,
        data: CheckOutRequest,
        actor_id: str,
    ) -> AttendanceRecordResponse:
        if session_id not in self._sessions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session '{session_id}' not found.",
            )

        # Find attendance record
        target_rec: Optional[Dict[str, Any]] = None
        for rec in self._attendance_records.values():
            if rec["session_id"] == session_id:
                if data.attendance_id and rec["id"] == data.attendance_id:
                    target_rec = rec
                    break
                if data.student_id and rec["student_id"] == data.student_id:
                    target_rec = rec
                    break
                if data.enrollment_number and rec["enrollment_number"] == data.enrollment_number.strip().upper():
                    target_rec = rec
                    break

        if not target_rec:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot check out: Participant has no active check-in record for this session.",
            )

        now = _now_iso()
        target_rec["check_out_at"] = now
        target_rec["updated_at"] = now

        self._record_audit(
            action="ATTENDANCE_CHECK_OUT",
            entity_type="ATTENDANCE_RECORD",
            entity_id=target_rec["id"],
            actor_id=actor_id,
            details={"session_id": session_id, "student_id": target_rec["student_id"]},
        )
        return AttendanceRecordResponse(**target_rec)

    def manual_correction(
        self,
        session_id: str,
        attendance_id: str,
        data: AttendanceCorrectionRequest,
        actor_id: str,
    ) -> AttendanceRecordResponse:
        if attendance_id not in self._attendance_records:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Attendance record '{attendance_id}' not found.",
            )

        rec = self._attendance_records[attendance_id]
        if rec["session_id"] != session_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Attendance record does not belong to specified session.",
            )

        reason = data.reason.strip()
        if len(reason) < 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Manual correction requires an explanatory reason (minimum 4 characters).",
            )

        prev_status = rec["status"]
        now = _now_iso()

        rec["status"] = data.status
        rec["corrected_by"] = actor_id
        rec["correction_reason"] = reason
        rec["updated_at"] = now

        self._record_audit(
            action="ATTENDANCE_CORRECTION",
            entity_type="ATTENDANCE_RECORD",
            entity_id=attendance_id,
            actor_id=actor_id,
            details={
                "session_id": session_id,
                "previous_status": prev_status,
                "new_status": data.status,
                "reason": reason,
            },
        )
        return AttendanceRecordResponse(**rec)

    def list_session_attendance(self, session_id: str, status_filter: Optional[str] = None) -> List[AttendanceRecordResponse]:
        if session_id not in self._sessions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session '{session_id}' not found.",
            )

        records = [
            r for r in self._attendance_records.values()
            if r["session_id"] == session_id and (not status_filter or r["status"] == status_filter)
        ]
        records.sort(key=lambda r: r["check_in_at"], reverse=True)
        return [AttendanceRecordResponse(**r) for r in records]

    def get_session_metrics(self, session_id: str) -> SessionAttendanceMetrics:
        if session_id not in self._sessions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session '{session_id}' not found.",
            )

        session = self._sessions[session_id]
        event_id = session["event_id"]

        # Total registered for event
        total_registered = sum(
            1 for p in event_service._participations.values()
            if p["event_id"] == event_id and p["registration_status"] == "CONFIRMED"
        )

        present = sum(
            1 for r in self._attendance_records.values()
            if r["session_id"] == session_id and r["status"] in ("PRESENT", "LATE")
        )

        absent = max(0, total_registered - present)
        pct = round((present / total_registered * 100), 1) if total_registered > 0 else 0.0

        return SessionAttendanceMetrics(
            session_id=session_id,
            session_title=session["title"],
            total_registered=total_registered,
            total_present=present,
            total_absent=absent,
            attendance_percentage=pct,
        )

    # --------------------------------------------------------------------------
    # 3. Volunteer Operations
    # --------------------------------------------------------------------------
    def assign_volunteer(self, event_id: str, data: VolunteerAssignRequest, actor_id: str) -> VolunteerResponse:
        if event_id not in event_service._events:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event '{event_id}' not found.",
            )

        norm_enrollment = data.enrollment_number.strip().upper()

        # Prevent duplicate assignment of the same volunteer for this event
        for v in self._volunteers.values():
            if v["event_id"] == event_id and v["enrollment_number"] == norm_enrollment and v["status"] == "ASSIGNED":
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Volunteer '{norm_enrollment}' is already assigned to this event.",
                )

        assignment_id = str(uuid.uuid4())
        student_id = data.student_id or str(uuid.uuid4())
        now = _now_iso()

        new_volunteer = {
            "id": assignment_id,
            "event_id": event_id,
            "session_id": data.session_id,
            "student_id": student_id,
            "student_name": data.student_name or f"Volunteer ({norm_enrollment})",
            "enrollment_number": norm_enrollment,
            "role": data.role or "ATTENDANCE",
            "status": "ASSIGNED",
            "assigned_by": actor_id,
            "created_at": now,
        }

        self._volunteers[assignment_id] = new_volunteer
        self._record_audit(
            action="VOLUNTEER_ASSIGNED",
            entity_type="VOLUNTEER_ASSIGNMENT",
            entity_id=assignment_id,
            actor_id=actor_id,
            details={"event_id": event_id, "enrollment": norm_enrollment, "role": data.role},
        )
        return VolunteerResponse(**new_volunteer)

    def list_volunteers(self, event_id: str) -> List[VolunteerResponse]:
        vols = [v for v in self._volunteers.values() if v["event_id"] == event_id and v["status"] != "CANCELLED"]
        return [VolunteerResponse(**v) for v in vols]

    def remove_volunteer(self, event_id: str, assignment_id: str, actor_id: str) -> VolunteerResponse:
        if assignment_id not in self._volunteers:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Volunteer assignment '{assignment_id}' not found.",
            )
        v = self._volunteers[assignment_id]
        if v["event_id"] != event_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Volunteer assignment does not belong to specified event.",
            )
        v["status"] = "CANCELLED"
        self._record_audit(
            action="VOLUNTEER_REMOVED",
            entity_type="VOLUNTEER_ASSIGNMENT",
            entity_id=assignment_id,
            actor_id=actor_id,
            details={"assignment_id": assignment_id},
        )
        return VolunteerResponse(**v)


# Singleton attendance service instance
attendance_service = AttendanceService()
