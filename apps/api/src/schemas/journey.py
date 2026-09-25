from typing import Optional
from pydantic import BaseModel, Field, field_validator


class JourneyMilestoneBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    slug: Optional[str] = Field(None, max_length=150)
    milestone_date: str = Field(..., json_schema_extra={"example": "2026-03-15"})
    milestone_type: str = Field(
        default="ACHIEVEMENT",
        json_schema_extra={"example": "FOUNDATION"},
    )
    description: str = Field(..., min_length=1)
    cover_media_id: Optional[str] = None
    linked_event_id: Optional[str] = None
    linked_project_id: Optional[str] = None
    external_link: Optional[str] = None
    visibility: str = Field(default="PUBLIC")
    display_order: int = Field(default=0)

    @field_validator("external_link")
    @classmethod
    def validate_external_link(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_clean = v.strip()
            if not v_clean:
                return None
            if not (v_clean.startswith("http://") or v_clean.startswith("https://")):
                raise ValueError("external_link must be an absolute HTTP or HTTPS URL")
            return v_clean
        return None


class JourneyMilestoneCreate(JourneyMilestoneBase):
    status: Optional[str] = Field(default="DRAFT")


class JourneyMilestoneUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = Field(None, max_length=150)
    milestone_date: Optional[str] = None
    milestone_type: Optional[str] = None
    description: Optional[str] = None
    cover_media_id: Optional[str] = None
    linked_event_id: Optional[str] = None
    linked_project_id: Optional[str] = None
    external_link: Optional[str] = None
    visibility: Optional[str] = None
    status: Optional[str] = None
    display_order: Optional[int] = None

    @field_validator("external_link")
    @classmethod
    def validate_external_link(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_clean = v.strip()
            if not v_clean:
                return None
            if not (v_clean.startswith("http://") or v_clean.startswith("https://")):
                raise ValueError("external_link must be an absolute HTTP or HTTPS URL")
            return v_clean
        return None


class JourneyMilestoneResponse(JourneyMilestoneBase):
    id: str
    status: str
    published_at: Optional[str] = None
    created_by: Optional[str] = None
    linked_event_title: Optional[str] = None
    linked_event_slug: Optional[str] = None
    created_at: str
    updated_at: str
