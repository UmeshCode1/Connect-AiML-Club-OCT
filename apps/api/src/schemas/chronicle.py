from typing import List, Optional
from pydantic import BaseModel, Field


class EventChronicleItemResponse(BaseModel):
    id: str
    chronicle_id: str
    event_id: str
    display_order: int = 0
    event_title: Optional[str] = None
    event_slug: Optional[str] = None
    event_type: Optional[str] = None
    start_at: Optional[str] = None
    venue: Optional[str] = None


class ChronicleBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    slug: Optional[str] = Field(None, max_length=150)
    edition_type: str = Field(
        default="COMMUNITY_UPDATE",
        json_schema_extra={"example": "MONTHLY_DIGEST"},
    )
    excerpt: Optional[str] = None
    content: str = Field(..., min_length=1)
    cover_media_id: Optional[str] = None
    visibility: str = Field(default="PUBLIC")
    scheduled_at: Optional[str] = None
    seo_title: Optional[str] = Field(None, max_length=255)
    seo_description: Optional[str] = Field(None, max_length=500)


class ChronicleCreate(ChronicleBase):
    linked_event_ids: Optional[List[str]] = Field(default_factory=list)


class ChronicleUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = Field(None, max_length=150)
    edition_type: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    cover_media_id: Optional[str] = None
    visibility: Optional[str] = None
    scheduled_at: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    linked_event_ids: Optional[List[str]] = None


class ChronicleResponse(ChronicleBase):
    id: str
    status: str
    published_at: Optional[str] = None
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    linked_events: List[EventChronicleItemResponse] = Field(default_factory=list)
    created_at: str
    updated_at: str
