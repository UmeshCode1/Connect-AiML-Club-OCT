"""
AIML CLUB OCT — CONNECT
Integration Boundaries & Data Contracts

Specification Reference:
- 10_INTEGRATIONS.md
- 11_EXTERNAL_INTEGRATIONS.md
- 01_PRODUCT_REQUIREMENTS.md (Section 8)

Pipeline Flow:
Tally (Registration Form)
  -> Google Sheets (Spreadsheet Sync / Operational Review)
  -> Connect Sync Worker (Validation, Conflict Detection & Deduplication)
  -> PostgreSQL (event_participations & student_profiles)
"""

from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class TallyPayloadField(BaseModel):
    key: str
    label: str
    type: str
    value: Any


class TallyWebhookPayload(BaseModel):
    event_id: str
    event_type: str = "FORM_RESPONSE"
    form_id: str
    form_name: str
    created_at: str
    fields: List[TallyPayloadField]


class SheetRowRecord(BaseModel):
    row_number: int
    timestamp: str
    full_name: str
    enrollment_number: str
    email: str
    phone: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[str] = None
    team_name: Optional[str] = None
    raw_data: Dict[str, Any] = Field(default_factory=dict)


class RegistrationImportMapping(BaseModel):
    """
    Data contract for converting external ingestion (Tally / Google Sheets)
    into validated internal domain records before committing to PostgreSQL.
    """
    event_id: str
    student_id: Optional[str] = None
    full_name: str
    enrollment_number: str
    email: str
    phone: Optional[str] = None
    department: Optional[str] = None
    semester: Optional[str] = None
    team_name: Optional[str] = None
    registration_source: str  # 'TALLY' | 'GOOGLE_SHEETS' | 'CSV'
    source_record_id: Optional[str] = None


class ValidationResult(BaseModel):
    is_valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    normalized_record: Optional[RegistrationImportMapping] = None


def normalize_enrollment(enrollment: str) -> str:
    """Canonical enrollment number normalizer (uppercase, strip whitespace)."""
    return enrollment.strip().upper()


def validate_import_record(record: RegistrationImportMapping) -> ValidationResult:
    """
    Pre-commit validation contract:
    - Enrollment number must be standard format (e.g., 0126...)
    - Valid email structure
    - Full name minimum length
    """
    errors: List[str] = []
    warnings: List[str] = []

    clean_name = record.full_name.strip()
    if len(clean_name) < 2:
        errors.append("Full name must be at least 2 characters long.")

    clean_enrollment = normalize_enrollment(record.enrollment_number)
    if len(clean_enrollment) < 6:
        errors.append(f"Enrollment number '{clean_enrollment}' does not meet institutional length requirements.")

    clean_email = record.email.strip().lower()
    if "@" not in clean_email or "." not in clean_email:
        errors.append(f"Invalid email address: '{clean_email}'.")

    if not record.phone:
        warnings.append("Phone number missing; will omit SMS/WhatsApp direct notifications.")

    if errors:
        return ValidationResult(is_valid=False, errors=errors, warnings=warnings)

    record.full_name = clean_name
    record.enrollment_number = clean_enrollment
    record.email = clean_email
    return ValidationResult(is_valid=True, errors=[], warnings=warnings, normalized_record=record)
