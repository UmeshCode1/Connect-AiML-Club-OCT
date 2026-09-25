from typing import List, Optional
from pydantic import BaseModel, Field


# ------------------------------------------------------------------------------
# Session Schemas
# ------------------------------------------------------------------------------

class SessionBase(BaseModel):
    session_code: Optional[str] = Field(None, json_schema_extra={"example": "SES-APT-01"})
    title: str = Field(..., min_length=2, json_schema_extra={"example": "Keynote: Practical Machine Learning"})
    description: Optional[str] = None
    venue: Optional[str] = Field(default="Main Auditorium, OCT Bhopal")
    start_at: str = Field(..., json_schema_extra={"example": "2026-10-15T10:00:00Z"})
    end_at: str = Field(..., json_schema_extra={"example": "2026-10-15T12:00:00Z"})
    capacity: Optional[int] = Field(default=None, ge=0)
    status: Optional[str] = Field(default="SCHEDULED", json_schema_extra={"example": "SCHEDULED"})


class SessionCreate(SessionBase):
    pass


class SessionUpdate(BaseModel):
    session_code: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    venue: Optional[str] = None
    start_at: Optional[str] = None
    end_at: Optional[str] = None
    capacity: Optional[int] = Field(default=None, ge=0)
    status: Optional[str] = None


class SessionResponse(SessionBase):
    id: str
    event_id: str
    status: str
    created_at: str
    updated_at: str


# ------------------------------------------------------------------------------
# Attendance Schemas
# ------------------------------------------------------------------------------

class CheckInRequest(BaseModel):
    qr_token: Optional[str] = Field(None, json_schema_extra={"example": "eyJldmVudF9pZCI..."})
    student_id: Optional[str] = None
    enrollment_number: Optional[str] = None
    source: Optional[str] = Field(default="QR", json_schema_extra={"example": "QR"})


class CheckOutRequest(BaseModel):
    attendance_id: Optional[str] = None
    student_id: Optional[str] = None
    enrollment_number: Optional[str] = None


class AttendanceManualCreate(BaseModel):
    student_id: Optional[str] = None
    enrollment_number: str = Field(..., min_length=5, json_schema_extra={"example": "0126AL221001"})
    status: Optional[str] = Field(default="PRESENT", json_schema_extra={"example": "PRESENT"})
    reason: str = Field(..., min_length=4, json_schema_extra={"example": "Manual check-in by event volunteer"})


class AttendanceCorrectionRequest(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "PRESENT"})
    reason: str = Field(..., min_length=4, json_schema_extra={"example": "Correcting mistaken absence"})


class AttendanceRecordResponse(BaseModel):
    id: str
    event_id: str
    session_id: str
    student_id: str
    student_name: str
    enrollment_number: str
    check_in_at: str
    check_out_at: Optional[str] = None
    status: str
    source: str
    recorded_by: Optional[str] = None
    corrected_by: Optional[str] = None
    correction_reason: Optional[str] = None
    created_at: str
    updated_at: str


class SessionAttendanceMetrics(BaseModel):
    session_id: str
    session_title: str
    total_registered: int
    total_present: int
    total_absent: int
    attendance_percentage: float


class AttendanceQrTokenResponse(BaseModel):
    token: str
    event_id: str
    student_id: str
    enrollment_number: str
    expires_at: str


# ------------------------------------------------------------------------------
# Volunteer Assignment Schemas
# ------------------------------------------------------------------------------

class VolunteerAssignRequest(BaseModel):
    student_id: Optional[str] = None
    enrollment_number: str = Field(..., min_length=5, json_schema_extra={"example": "0126AL221050"})
    student_name: Optional[str] = Field(None, json_schema_extra={"example": "Vikas Tiwari"})
    session_id: Optional[str] = None
    role: str = Field(default="ATTENDANCE", json_schema_extra={"example": "ATTENDANCE"})


class VolunteerResponse(BaseModel):
    id: str
    event_id: str
    session_id: Optional[str] = None
    student_id: str
    student_name: str
    enrollment_number: str
    role: str
    status: str
    assigned_by: Optional[str] = None
    created_at: str
