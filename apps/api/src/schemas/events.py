from typing import Optional
from pydantic import BaseModel, Field


class EventBase(BaseModel):
    event_code: str = Field(..., json_schema_extra={"example": "EVT-APTIFY-2026"})
    slug: str = Field(..., json_schema_extra={"example": "aptify-2026"})
    title: str = Field(..., json_schema_extra={"example": "Aptify 2.0: AI Symposium"})
    short_description: Optional[str] = None
    event_type: Optional[str] = "SYMPOSIUM"
    status: str = Field(default="DRAFT")
    visibility: str = Field(default="PUBLIC")
    venue: Optional[str] = "Oriental College of Technology, Bhopal"
    capacity: Optional[int] = None


class EventResponse(EventBase):
    id: str
    created_at: str
    updated_at: str
