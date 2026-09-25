from pydantic import BaseModel, Field


class PublicCertificateVerification(BaseModel):
    valid: bool = Field(..., description="Whether the certificate is genuine and valid")
    certificate_id: str = Field(..., json_schema_extra={"example": "AIML26-APT-000184"})
    recipient_name: str = Field(..., json_schema_extra={"example": "Rahul Sharma"})
    event_title: str = Field(..., json_schema_extra={"example": "Aptify 2.0"})
    certificate_type: str = Field(..., json_schema_extra={"example": "Participation"})
    issued_at: str = Field(..., json_schema_extra={"example": "2026-03-15T10:00:00Z"})
    status: str = Field(default="VALID", json_schema_extra={"example": "VALID"})
