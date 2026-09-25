from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from apps.api.src.core.security import get_current_user, AuthenticatedUser, require_permission
from apps.api.src.schemas.envelope import ApiResponse
from apps.api.src.schemas.media import (
    MediaAssetCreate,
    MediaAssetResponse,
    FaceEnrollmentCreate,
    FaceEnrollmentResponse,
    FaceSearchResponse,
    FaceReportCreate,
    FaceReportResponse,
    FaceReportResolve,
)
from apps.api.src.services.media_service import media_service

router = APIRouter(tags=["Media Intelligence & Biometric Privacy"])


# ------------------------------------------------------------------------------
# 1. Media Assets Ingestion & Listing
# ------------------------------------------------------------------------------

@router.post(
    "/events/{event_id}/media",
    response_model=ApiResponse[MediaAssetResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("media.upload"))],
)
def upload_media_asset(
    event_id: str,
    payload: MediaAssetCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Ingest a new media asset linked to an immutable Google Drive file ID.
    Validates MIME type, file size bounds, and filename safety.
    """
    payload.event_id = event_id
    asset = media_service.ingest_media_asset(payload, uploader_id=current_user.account_id)
    return ApiResponse(data=asset)


@router.get(
    "/events/{event_id}/media",
    response_model=ApiResponse[List[MediaAssetResponse]],
    dependencies=[Depends(require_permission("media.view"))],
)
def list_event_media(
    event_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    List non-hidden media assets for a specific event.
    """
    assets = media_service.list_event_media(event_id)
    return ApiResponse(data=assets)


@router.get(
    "/media/{media_id}",
    response_model=ApiResponse[MediaAssetResponse],
    dependencies=[Depends(require_permission("media.view"))],
)
def get_media_asset(
    media_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Retrieve metadata for a specific media asset.
    """
    asset = media_service.get_media_asset(media_id)
    return ApiResponse(data=asset)


# ------------------------------------------------------------------------------
# 2. Biometric Consent & Face Enrollment (Student Self-Service)
# ------------------------------------------------------------------------------

@router.get(
    "/me/face-enrollment",
    response_model=ApiResponse[Optional[FaceEnrollmentResponse]],
)
def get_my_face_enrollment(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Check the authenticated student's biometric opt-in enrollment status.
    """
    enrollment = media_service.get_student_enrollment(current_user.account_id)
    return ApiResponse(data=enrollment)


@router.post(
    "/me/face-enrollment",
    response_model=ApiResponse[FaceEnrollmentResponse],
    status_code=status.HTTP_201_CREATED,
)
def register_my_face_enrollment(
    payload: FaceEnrollmentCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Register explicit biometric opt-in consent and initialize student face enrollment.
    """
    enrollment = media_service.register_face_enrollment(current_user.account_id, payload)
    return ApiResponse(data=enrollment)


@router.delete(
    "/me/face-enrollment",
    response_model=ApiResponse[FaceEnrollmentResponse],
)
def withdraw_my_face_enrollment(
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Withdraw biometric consent, permanently delete stored embedding vectors,
    and disassociate pre-existing face matches.
    """
    enrollment = media_service.withdraw_face_enrollment(current_user.account_id)
    return ApiResponse(data=enrollment)


# ------------------------------------------------------------------------------
# 3. Event-Scoped Face Discovery Search
# ------------------------------------------------------------------------------

@router.post(
    "/events/{event_id}/media/search-faces",
    response_model=ApiResponse[FaceSearchResponse],
)
def search_event_faces_for_student(
    event_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Event-scoped discovery: finds media assets within event_id matching the authenticated
    student's enrolled face. Strictly enforces event participation and active consent.
    """
    response = media_service.search_event_faces(
        event_id=event_id,
        student_id=current_user.account_id,
        authorized_student_events=current_user.event_scopes,
    )
    return ApiResponse(data=response)


# ------------------------------------------------------------------------------
# 4. "Not Me" Dispute Reporting & Administration
# ------------------------------------------------------------------------------

@router.post(
    "/media/{media_id}/face-report",
    response_model=ApiResponse[FaceReportResponse],
    status_code=status.HTTP_201_CREATED,
)
def report_face_dispute(
    media_id: str,
    payload: FaceReportCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Submit a "Not Me" false match dispute on a detected face in a media asset.
    Immediately hides the match pending administrative review.
    """
    report = media_service.report_face_dispute(
        media_id=media_id,
        student_id=current_user.account_id,
        payload=payload,
    )
    return ApiResponse(data=report)


@router.get(
    "/admin/face-reports",
    response_model=ApiResponse[List[FaceReportResponse]],
    dependencies=[Depends(require_permission("media.process"))],
)
def list_face_reports(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Administrator endpoint to review open or historical face match dispute reports.
    """
    reports = media_service.list_face_reports(status=status_filter)
    return ApiResponse(data=reports)


@router.patch(
    "/admin/face-reports/{report_id}",
    response_model=ApiResponse[FaceReportResponse],
    dependencies=[Depends(require_permission("media.process"))],
)
def resolve_face_dispute(
    report_id: str,
    payload: FaceReportResolve,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """
    Resolve a face dispute report with audit notes.
    If status is RESOLVED_DISPUTED, unlinks the candidate face record.
    """
    report = media_service.resolve_face_dispute(
        report_id=report_id,
        admin_id=current_user.account_id,
        payload=payload,
    )
    return ApiResponse(data=report)
