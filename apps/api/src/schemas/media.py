from typing import Optional, List, Literal
from datetime import datetime
from pydantic import BaseModel, Field


MediaTypeLiteral = Literal["PHOTO", "VIDEO", "DOCUMENT", "POSTER", "CERTIFICATE", "OTHER"]
VisibilityLiteral = Literal["PUBLIC", "EVENT_MEMBERS", "TEAM_ONLY", "ADMIN_ONLY", "HIDDEN"]
ProcessingStatusLiteral = Literal["UPLOADED", "QUEUED", "PROCESSING", "PROCESSED", "FAILED"]


# ------------------------------------------------------------------------------
# 1. Media Assets
# ------------------------------------------------------------------------------

class MediaAssetCreate(BaseModel):
    event_id: str
    media_type: MediaTypeLiteral = "PHOTO"
    title: Optional[str] = None
    original_filename: str
    mime_type: str
    file_size: int = Field(gt=0, description="File size in bytes")
    checksum: Optional[str] = None
    google_drive_file_id: str
    google_drive_folder_id: Optional[str] = None
    visibility: VisibilityLiteral = "EVENT_MEMBERS"
    width: Optional[int] = None
    height: Optional[int] = None
    duration_seconds: Optional[float] = None


class MediaAssetResponse(BaseModel):
    id: str
    event_id: Optional[str] = None
    media_type: str
    title: Optional[str] = None
    original_filename: Optional[str] = None
    mime_type: Optional[str] = None
    file_size: Optional[int] = None
    checksum: Optional[str] = None
    google_drive_file_id: Optional[str] = None
    google_drive_folder_id: Optional[str] = None
    visibility: str
    processing_status: str
    width: Optional[int] = None
    height: Optional[int] = None
    duration_seconds: Optional[float] = None
    uploaded_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class MediaProcessingJobResponse(BaseModel):
    id: str
    media_asset_id: str
    job_type: str
    status: str
    attempts: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime


# ------------------------------------------------------------------------------
# 2. Biometric Consent & Enrollment (Privacy-Preserving)
# ------------------------------------------------------------------------------

class FaceEnrollmentCreate(BaseModel):
    consent_version: str = Field(default="v1.0", min_length=1)
    confirm_opt_in: bool = Field(description="Must explicitly acknowledge biometric opt-in terms")


class FaceEnrollmentResponse(BaseModel):
    id: str
    student_id: str
    consent_version: str
    consented_at: datetime
    withdrawn_at: Optional[datetime] = None
    status: str
    model_version: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ------------------------------------------------------------------------------
# 3. Event-Scoped Face Discovery Search
# ------------------------------------------------------------------------------

class FaceSearchRequest(BaseModel):
    event_id: str


class FaceSearchMatchItem(BaseModel):
    media_asset_id: str
    title: Optional[str] = None
    original_filename: Optional[str] = None
    google_drive_file_id: Optional[str] = None
    confidence_tier: Literal["HIGH", "MEDIUM", "LOW"]
    similarity_score: float
    created_at: datetime


class FaceSearchResponse(BaseModel):
    event_id: str
    student_id: str
    total_matches: int
    matches: List[FaceSearchMatchItem]


# ------------------------------------------------------------------------------
# 4. "Not Me" Dispute Reporting & Audit
# ------------------------------------------------------------------------------

class FaceReportCreate(BaseModel):
    report_type: Literal["NOT_ME", "WRONG_PERSON", "UNCONSENTED_INDEX", "POOR_CROP"] = "NOT_ME"
    description: Optional[str] = None


class FaceReportResponse(BaseModel):
    id: str
    student_id: str
    media_asset_id: str
    media_face_id: Optional[str] = None
    report_type: str
    description: Optional[str] = None
    status: str
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    created_at: datetime


class FaceReportResolve(BaseModel):
    status: Literal["RESOLVED_DISPUTED", "DISMISSED"]
    resolution_notes: str = Field(min_length=3, description="Audit justification for report resolution")
