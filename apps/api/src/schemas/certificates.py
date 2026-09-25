from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from pydantic import BaseModel, Field

CertificateTypeLiteral = Literal[
    "PARTICIPATION",
    "COMPLETION",
    "WINNER",
    "RUNNER_UP",
    "VOLUNTEER",
    "SPEAKER",
    "ORGANIZER",
    "CUSTOM",
]

CertificateStatusLiteral = Literal[
    "DRAFT",
    "PENDING_APPROVAL",
    "APPROVED",
    "GENERATED",
    "ISSUED",
    "VALID",
    "REVOKED",
    "REPLACED",
]

BatchStatusLiteral = Literal[
    "DRAFT",
    "GENERATING",
    "GENERATED",
    "PENDING_APPROVAL",
    "APPROVED",
    "ISSUED",
    "FAILED",
]


# ------------------------------------------------------------------------------
# 1. Template Management & Versioning
# ------------------------------------------------------------------------------

class CertificateFieldPlacementSchema(BaseModel):
    field_name: str
    x: float
    y: float
    width: Optional[float] = None
    height: Optional[float] = None
    font_size: Optional[int] = 16
    font_weight: Optional[str] = "normal"
    font_family: Optional[str] = "Inter"
    color: Optional[str] = "#111820"
    text_align: Optional[Literal["left", "center", "right"]] = "center"


class CertificateTemplateConfigSchema(BaseModel):
    fields: List[CertificateFieldPlacementSchema] = Field(default_factory=list)
    dimensions: Optional[Dict[str, int]] = Field(default_factory=lambda: {"width": 1920, "height": 1080})
    qr_placement: Optional[Dict[str, float]] = Field(default_factory=lambda: {"x": 1650, "y": 850, "size": 140})


class CertificateTemplateCreate(BaseModel):
    name: str = Field(min_length=3, max_length=150)
    certificate_type: CertificateTypeLiteral = "PARTICIPATION"
    google_drive_file_id: Optional[str] = None
    configuration: CertificateTemplateConfigSchema = Field(default_factory=CertificateTemplateConfigSchema)


class CertificateTemplateVersionCreate(BaseModel):
    configuration: CertificateTemplateConfigSchema
    google_drive_file_id: Optional[str] = None
    changelog: Optional[str] = None


class CertificateTemplateVersionResponse(BaseModel):
    id: str
    template_id: str
    version_number: int
    configuration: CertificateTemplateConfigSchema
    google_drive_file_id: Optional[str] = None
    changelog: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime


class CertificateTemplateResponse(BaseModel):
    id: str
    name: str
    certificate_type: str
    google_drive_file_id: Optional[str] = None
    configuration: CertificateTemplateConfigSchema
    version: int
    status: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ------------------------------------------------------------------------------
# 2. Eligibility & Batches
# ------------------------------------------------------------------------------

class CertificateRecipientEligibilityResponse(BaseModel):
    student_id: str
    full_name: str
    enrollment_number: str
    email: Optional[str] = None
    attended_sessions: int
    total_sessions: int
    is_eligible: bool
    ineligibility_reason: Optional[str] = None
    existing_certificate_id: Optional[str] = None


class CertificateBatchCreate(BaseModel):
    event_id: str
    template_id: str
    template_version_id: Optional[str] = None
    certificate_type: CertificateTypeLiteral = "PARTICIPATION"
    min_attendance_sessions: int = Field(default=1, ge=0)
    target_roles: Optional[List[str]] = Field(default_factory=list)


class CertificateBatchResponse(BaseModel):
    id: str
    event_id: str
    template_id: str
    template_version_id: Optional[str] = None
    certificate_type: str
    status: BatchStatusLiteral
    total_eligible: int
    total_generated: int
    total_failed: int
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    issued_at: Optional[datetime] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ------------------------------------------------------------------------------
# 3. Certificates & Lifecycle
# ------------------------------------------------------------------------------

class CertificateResponse(BaseModel):
    id: str
    certificate_id: str
    student_id: str
    event_id: Optional[str] = None
    batch_id: Optional[str] = None
    certificate_type: str
    template_id: Optional[str] = None
    template_version_id: Optional[str] = None
    google_drive_file_id: Optional[str] = None
    status: CertificateStatusLiteral
    issued_at: Optional[datetime] = None
    issued_by: Optional[str] = None
    replaced_by: Optional[str] = None
    revoked_at: Optional[datetime] = None
    revoke_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CertificateRevokeRequest(BaseModel):
    reason: str = Field(min_length=5, description="Administrative justification for certificate revocation")


class CertificateReplaceRequest(BaseModel):
    reason: str = Field(min_length=5, description="Administrative justification for certificate replacement")
    new_template_version_id: Optional[str] = None


# ------------------------------------------------------------------------------
# 4. Public Verification Contract (Never leaks phone, email, attendance, or internal UUIDs)
# ------------------------------------------------------------------------------

class PublicCertificateVerification(BaseModel):
    valid: bool
    certificate_id: str
    recipient_name: str
    event_title: str
    event: Optional[str] = None
    event_date: Optional[str] = None
    certificate_type: str
    issued_at: str
    status: str
    verification_url: Optional[str] = None
    revoked_at: Optional[str] = None
    revoke_reason: Optional[str] = None
    replaced_by_certificate_id: Optional[str] = None
