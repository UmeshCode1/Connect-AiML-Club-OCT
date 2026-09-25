from typing import List, Optional, Union
from fastapi import APIRouter, Depends, Query, status

from apps.api.src.core.security import (
    AuthenticatedUser,
    check_permission_match,
    get_current_user,
    get_optional_current_user,
    require_permission,
)
from apps.api.src.schemas.envelope import ApiResponse, ApiResponseMeta
from apps.api.src.schemas.feedback import (
    FeedbackCreate,
    FeedbackModerateRequest,
    FeedbackResponse,
    FeedbackSummaryResponse,
    PublicFeedbackResponse,
)
from apps.api.src.services.feedback_service import feedback_service

router = APIRouter(tags=["Feedback"])


@router.post("/events/{event_id}/feedback", response_model=ApiResponse[FeedbackResponse], status_code=status.HTTP_201_CREATED)
def submit_feedback(
    event_id: str,
    payload: FeedbackCreate,
    user: AuthenticatedUser = Depends(get_current_user),
) -> ApiResponse[FeedbackResponse]:
    """
    Submits participant feedback for a canonical event.
    Enforces duplicate submission prevention and privacy consent flags.
    """
    feedback = feedback_service.submit_feedback(
        event_id=event_id,
        data=payload,
        student_id=user.account_id,
        student_name=user.email.split("@")[0] if user.email else "Student Participant",
    )
    return ApiResponse(data=feedback)


@router.get("/events/{event_id}/feedback", response_model=ApiResponse[Union[List[FeedbackResponse], List[PublicFeedbackResponse]]])
def list_event_feedback(
    event_id: str,
    moderation_status: Optional[str] = None,
    rating: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    user: Optional[AuthenticatedUser] = Depends(get_optional_current_user),
) -> ApiResponse[Union[List[FeedbackResponse], List[PublicFeedbackResponse]]]:
    """
    Retrieves feedback for an event.
    Public calls receive ONLY approved, privacy-sanitized feedback without student IDs, emails, or phone numbers.
    Staff with 'feedback.view' (EVENT_MANAGER, CONTENT_MANAGER, CLUB_ADMIN, SUPER_ADMIN) receive full operational records.
    """
    is_staff = False
    if user:
        if user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "EVENT_MANAGER", "CONTENT_MANAGER") or check_permission_match("feedback.view", user.permissions):
            is_staff = True

    if is_staff:
        records, total = feedback_service.list_event_feedback_admin(
            event_id=event_id,
            moderation_status=moderation_status,
            rating=rating,
            page=page,
            page_size=page_size,
        )
        has_next = (page * page_size) < total
        return ApiResponse(
            data=records,
            meta=ApiResponseMeta(
                page=page,
                page_size=page_size,
                total=total,
                has_next=has_next,
            ),
        )
    else:
        public_records, total = feedback_service.list_event_feedback_public(
            event_id=event_id,
            page=page,
            page_size=page_size,
        )
        has_next = (page * page_size) < total
        return ApiResponse(
            data=public_records,
            meta=ApiResponseMeta(
                page=page,
                page_size=page_size,
                total=total,
                has_next=has_next,
            ),
        )


@router.get("/events/{event_id}/feedback/summary", response_model=ApiResponse[FeedbackSummaryResponse])
def get_event_feedback_summary(
    event_id: str,
) -> ApiResponse[FeedbackSummaryResponse]:
    """
    Aggregates rating distributions and average rating metrics for an event.
    """
    summary = feedback_service.get_event_feedback_summary(event_id)
    return ApiResponse(data=summary)


@router.patch("/feedback/{feedback_id}", response_model=ApiResponse[FeedbackResponse])
def moderate_feedback(
    feedback_id: str,
    payload: FeedbackModerateRequest,
    user: AuthenticatedUser = Depends(require_permission("feedback.publish")),
) -> ApiResponse[FeedbackResponse]:
    """
    Moderates a participant feedback entry (APPROVE / REJECT / PENDING).
    Requires 'feedback.publish' permission (CONTENT_MANAGER, CLUB_ADMIN, SUPER_ADMIN).
    """
    record = feedback_service.moderate_feedback(
        feedback_id=feedback_id,
        data=payload,
        moderator_id=user.account_id,
    )
    return ApiResponse(data=record)


@router.post("/feedback/{feedback_id}/publish", response_model=ApiResponse[FeedbackResponse])
def publish_feedback(
    feedback_id: str,
    user: AuthenticatedUser = Depends(require_permission("feedback.publish")),
) -> ApiResponse[FeedbackResponse]:
    """
    Approves and publishes feedback for public event showcase.
    Requires student publication consent.
    """
    record = feedback_service.publish_feedback(
        feedback_id=feedback_id,
        publisher_id=user.account_id,
    )
    return ApiResponse(data=record)
