from typing import List, Optional
from pydantic import BaseModel, Field


# ------------------------------------------------------------------------------
# Event Schemas
# ------------------------------------------------------------------------------

class EventBase(BaseModel):
    event_code: Optional[str] = Field(None, json_schema_extra={"example": "EVT-APTIFY-2026"})
    slug: Optional[str] = Field(None, json_schema_extra={"example": "aptify-2026"})
    title: str = Field(..., min_length=2, json_schema_extra={"example": "Aptify 2.0: AI Symposium"})
    short_description: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = Field(default="WORKSHOP", json_schema_extra={"example": "WORKSHOP"})
    status: Optional[str] = Field(default="DRAFT")
    visibility: Optional[str] = Field(default="PUBLIC")
    venue: Optional[str] = Field(default="Auditorium, Oriental College of Technology, Bhopal")
    cover_media_id: Optional[str] = None
    start_at: Optional[str] = None
    end_at: Optional[str] = None
    registration_open_at: Optional[str] = None
    registration_close_at: Optional[str] = None
    capacity: Optional[int] = Field(default=None, ge=0)


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    event_code: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    visibility: Optional[str] = None
    venue: Optional[str] = None
    cover_media_id: Optional[str] = None
    start_at: Optional[str] = None
    end_at: Optional[str] = None
    registration_open_at: Optional[str] = None
    registration_close_at: Optional[str] = None
    capacity: Optional[int] = Field(default=None, ge=0)


class EventTransitionRequest(BaseModel):
    to_status: str = Field(..., json_schema_extra={"example": "PLANNING"})
    reason: Optional[str] = Field(None, json_schema_extra={"example": "Planning milestone completed"})


class EventResponse(EventBase):
    id: str
    status: str
    visibility: str
    published_at: Optional[str] = None
    created_by: Optional[str] = None
    created_at: str
    updated_at: str


# ------------------------------------------------------------------------------
# Registration / Participation Schemas
# ------------------------------------------------------------------------------

class ParticipationCreate(BaseModel):
    full_name: str = Field(..., min_length=2, json_schema_extra={"example": "Rohit Verma"})
    enrollment_number: str = Field(..., min_length=5, json_schema_extra={"example": "0126AL221045"})
    email: str = Field(..., json_schema_extra={"example": "rohit.verma@example.com"})
    phone: Optional[str] = None
    department: Optional[str] = "AIML"
    course: Optional[str] = "B.Tech"
    batch: Optional[str] = "2022-2026"
    semester: Optional[str] = "VI"
    team_name: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = Field(default="MANUAL", json_schema_extra={"example": "MANUAL"})


class ParticipationUpdate(BaseModel):
    registration_status: Optional[str] = Field(None, json_schema_extra={"example": "CONFIRMED"})
    event_role: Optional[str] = None
    team_name: Optional[str] = None
    result: Optional[str] = None
    notes: Optional[str] = None


class ParticipationResponse(BaseModel):
    id: str
    event_id: str
    student_id: str
    student_name: str
    enrollment_number: str
    email: str
    registration_source: str
    registration_status: str
    event_role: Optional[str] = None
    team_name: Optional[str] = None
    result: Optional[str] = None
    registered_at: str
    created_at: str
    updated_at: str


# ------------------------------------------------------------------------------
# Event Analytics Schema
# ------------------------------------------------------------------------------

class EventAnalyticsResponse(BaseModel):
    event_id: str
    event_title: str
    total_registrations: int
    confirmed_count: int
    waitlisted_count: int
    cancelled_count: int
    attended_count: int
    capacity: Optional[int]
    capacity_percentage: Optional[float]
