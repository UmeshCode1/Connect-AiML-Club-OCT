from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from apps.api.src.core.security import get_current_user, AuthenticatedUser, require_permission
from apps.api.src.schemas.envelope import ApiResponse
from apps.api.src.schemas.certificates import (
    CertificateTemplateCreate,
    CertificateTemplateVersionCreate,
    CertificateTemplateResponse,
    CertificateTemplateVersionResponse,
    CertificateBatchCreate,
    CertificateBatchResponse,
    CertificateRecipientEligibilityResponse,
    CertificateResponse,
    CertificateRevokeRequest,
    CertificateReplaceRequest,
    PublicCertificateVerification,
)
from apps.api.src.services.certificate_service import certificate_service

router = APIRouter(tags=["Certificates & Credentials"])


# ------------------------------------------------------------------------------
# 1. Public Verification (Public Surface - Strict Privacy Bounds)
# ------------------------------------------------------------------------------

@router.get(
    "/public/certificates/verify/{certificate_id}",
    response_model=ApiResponse[PublicCertificateVerification],
)
def verify_certificate(certificate_id: str) -> ApiResponse[PublicCertificateVerification]:
    """
    Public Certificate Verification Endpoint.
    Never exposes private student data (phone, email, attendance, or internal UUIDs).
    """
    data = certificate_service.verify_certificate(certificate_id)
    return ApiResponse(data=data)


# ------------------------------------------------------------------------------
# 2. Student Portfolio (Self-Service)
# ------------------------------------------------------------------------------

@router.get(
    "/me/certificates",
    response_model=ApiResponse[List[CertificateResponse]],
)
def get_my_certificates(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[List[CertificateResponse]]:
    """
    Retrieve the authenticated student's issued certificates.
    """
    certs = certificate_service.get_student_certificates(current_user.account_id)
    return ApiResponse(data=certs)


# ------------------------------------------------------------------------------
# 3. Eligibility & Batch Generation
# ------------------------------------------------------------------------------

@router.get(
    "/events/{event_id}/certificates/eligible",
    response_model=ApiResponse[List[CertificateRecipientEligibilityResponse]],
    dependencies=[Depends(require_permission("certificates.view"))],
)
def get_eligible_recipients(
    event_id: str,
    certificate_type: str = Query("PARTICIPATION", description="Certificate category"),
    min_sessions: int = Query(1, description="Minimum sessions attended required"),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[List[CertificateRecipientEligibilityResponse]]:
    """
    Calculates eligible event participants based on attendance records and registration status.
    Does not duplicate attendance data; references existing Phase 3 records.
    """
    recipients = certificate_service.calculate_eligible_recipients(
        event_id=event_id,
        certificate_type=certificate_type,
        min_attendance_sessions=min_sessions,
    )
    return ApiResponse(data=recipients)


@router.post(
    "/events/{event_id}/certificates/batches",
    response_model=ApiResponse[CertificateBatchResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("certificates.generate"))],
)
def create_certificate_batch(
    event_id: str,
    payload: CertificateBatchCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[CertificateBatchResponse]:
    """
    Initializes a new bulk certificate generation batch for an event.
    """
    payload.event_id = event_id
    batch = certificate_service.create_batch(payload, creator_id=current_user.account_id)
    return ApiResponse(data=batch)


@router.post(
    "/certificate-batches/{batch_id}/generate",
    response_model=ApiResponse[CertificateBatchResponse],
    dependencies=[Depends(require_permission("certificates.generate"))],
)
def generate_certificate_batch(
    batch_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[CertificateBatchResponse]:
    """
    Executes asynchronous/worker batch generation. Renders dynamic field coordinates,
    embeds QR verification URLs, and creates GENERATED certificate records.
    """
    batch = certificate_service.generate_batch(batch_id, operator_id=current_user.account_id)
    return ApiResponse(data=batch)


@router.post(
    "/certificate-batches/{batch_id}/approve",
    response_model=ApiResponse[CertificateBatchResponse],
    dependencies=[Depends(require_permission("certificates.approve"))],
)
def approve_certificate_batch(
    batch_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[CertificateBatchResponse]:
    """
    Approves a generated batch of certificates. Required before public issuance.
    """
    batch = certificate_service.approve_batch(batch_id, approver_id=current_user.account_id)
    return ApiResponse(data=batch)


@router.post(
    "/certificate-batches/{batch_id}/issue",
    response_model=ApiResponse[CertificateBatchResponse],
    dependencies=[Depends(require_permission("certificates.issue"))],
)
def issue_certificate_batch(
    batch_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[CertificateBatchResponse]:
    """
    Issues an approved certificate batch. Makes certificates officially valid and publicly verifiable.
    """
    batch = certificate_service.issue_batch(batch_id, issuer_id=current_user.account_id)
    return ApiResponse(data=batch)


# ------------------------------------------------------------------------------
# 4. Revocation & Replacement
# ------------------------------------------------------------------------------

@router.post(
    "/certificates/{certificate_id}/revoke",
    response_model=ApiResponse[CertificateResponse],
    dependencies=[Depends(require_permission("certificates.revoke"))],
)
def revoke_certificate(
    certificate_id: str,
    payload: CertificateRevokeRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[CertificateResponse]:
    """
    Revokes an issued certificate. Public verification will show REVOKED status with reason.
    Historical record is preserved.
    """
    cert = certificate_service.revoke_certificate(
        certificate_id=certificate_id,
        reason=payload.reason,
        revoker_id=current_user.account_id,
    )
    return ApiResponse(data=cert)


@router.post(
    "/certificates/{certificate_id}/replace",
    response_model=ApiResponse[CertificateResponse],
    dependencies=[Depends(require_permission("certificates.replace"))],
)
def replace_certificate(
    certificate_id: str,
    payload: CertificateReplaceRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[CertificateResponse]:
    """
    Replaces an issued certificate. Generates a new certificate and marks the old one REPLACED.
    """
    new_cert = certificate_service.replace_certificate(
        certificate_id=certificate_id,
        reason=payload.reason,
        operator_id=current_user.account_id,
    )
    return ApiResponse(data=new_cert)


# ------------------------------------------------------------------------------
# 5. Template Management & Versioning
# ------------------------------------------------------------------------------

@router.get(
    "/certificate-templates",
    response_model=ApiResponse[List[CertificateTemplateResponse]],
    dependencies=[Depends(require_permission("certificates.view"))],
)
def list_certificate_templates(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[List[CertificateTemplateResponse]]:
    """
    Lists certificate design templates.
    """
    templates = certificate_service.list_templates()
    return ApiResponse(data=templates)


@router.post(
    "/certificate-templates",
    response_model=ApiResponse[CertificateTemplateResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("certificates.template.manage"))],
)
def create_certificate_template(
    payload: CertificateTemplateCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[CertificateTemplateResponse]:
    """
    Creates a new certificate template record.
    """
    tmpl = certificate_service.create_template(payload, creator_id=current_user.account_id)
    return ApiResponse(data=tmpl)


@router.post(
    "/certificate-templates/{template_id}/versions",
    response_model=ApiResponse[CertificateTemplateVersionResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("certificates.template.manage"))],
)
def create_template_version(
    template_id: str,
    payload: CertificateTemplateVersionCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[CertificateTemplateVersionResponse]:
    """
    Saves an immutable version of the certificate layout configuration and background asset.
    """
    version = certificate_service.create_template_version(
        template_id=template_id,
        payload=payload,
        creator_id=current_user.account_id,
    )
    return ApiResponse(data=version)
