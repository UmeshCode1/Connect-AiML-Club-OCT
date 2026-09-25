from typing import Dict, Optional
from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, json_schema_extra={"example": 5})
    feedback_text: Optional[str] = None
    suggestion_text: Optional[str] = None
    publication_consent: str = Field(
        default="NO",
        json_schema_extra={"example": "ANONYMOUS"},
    )
    source: Optional[str] = Field(default="PORTAL")


class FeedbackModerateRequest(BaseModel):
    moderation_status: str = Field(..., json_schema_extra={"example": "APPROVED"})
    visibility: Optional[str] = Field(None, json_schema_extra={"example": "PUBLIC"})
    moderation_notes: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: str
    event_id: str
    student_id: str
    participation_id: Optional[str] = None
    source: str
    rating: int
    feedback_text: Optional[str] = None
    suggestion_text: Optional[str] = None
    publication_consent: str
    is_anonymous: bool
    moderation_status: str
    visibility: str
    moderated_by: Optional[str] = None
    moderated_at: Optional[str] = None
    moderation_notes: Optional[str] = None
    created_at: str
    updated_at: str
    student_name: Optional[str] = None
    student_enrollment: Optional[str] = None


class PublicFeedbackResponse(BaseModel):
    id: str
    event_id: str
    rating: int
    feedback_text: Optional[str] = None
    suggestion_text: Optional[str] = None
    author_name: str
    is_anonymous: bool
    created_at: str


class FeedbackSummaryResponse(BaseModel):
    event_id: str
    total_feedback: int
    average_rating: float
    rating_distribution: Dict[int, int]
    pending_moderation_count: int
    approved_count: int
    rejected_count: int
