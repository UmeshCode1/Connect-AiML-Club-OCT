"""
AIML CLUB OCT — CONNECT
Event Feedback Engine & Privacy-Preserving Moderation Service

Specification Reference:
- 01_PRODUCT_REQUIREMENTS.md (Section 15)
- 03_DATABASE_SCHEMA.md (Section 20)
- 04_RBAC_PERMISSIONS.md
- 05_API_SPECIFICATION.md (Section 16)
- 11_SECURITY_PRIVACY.md
"""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException, status

from apps.api.src.schemas.feedback import (
    FeedbackCreate,
    FeedbackModerateRequest,
    FeedbackResponse,
    FeedbackSummaryResponse,
    PublicFeedbackResponse,
)
from apps.api.src.services.event_service import event_service


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class FeedbackService:
    def __init__(self):
        self._feedbacks: Dict[str, Dict[str, Any]] = {}
        self._audit_logs: List[Dict[str, Any]] = []

        self._seed_initial_feedback()

    def _seed_initial_feedback(self):
        evt_1_id = "00000000-0000-0000-0000-000000000101"
        fb_1_id = "00000000-0000-0000-0000-000000000901"
        self._feedbacks[fb_1_id] = {
            "id": fb_1_id,
            "event_id": evt_1_id,
            "student_id": "00000000-0000-0000-0000-000000000011",
            "participation_id": "00000000-0000-0000-0000-000000000201",
            "source": "PORTAL",
            "rating": 5,
            "feedback_text": "The computer vision hands-on session was exceptionally structured and practical!",
            "suggestion_text": "Would love an advanced multi-modal agent track in the next workshop.",
            "publication_consent": "PUBLIC_NAME",
            "is_anonymous": False,
            "moderation_status": "APPROVED",
            "visibility": "PUBLIC",
            "moderated_by": "00000000-0000-0000-0000-000000000001",
            "moderated_at": "2026-03-02T10:00:00Z",
            "moderation_notes": "Insightful student testimonial approved for public showcase.",
            "student_name": "Aarav Sharma",
            "student_enrollment": "0126AL221001",
            "created_at": "2026-03-01T17:00:00Z",
            "updated_at": "2026-03-02T10:00:00Z",
        }

    def _format_admin_response(self, fb: Dict[str, Any]) -> FeedbackResponse:
        return FeedbackResponse(
            id=fb["id"],
            event_id=fb["event_id"],
            student_id=fb["student_id"],
            participation_id=fb.get("participation_id"),
            source=fb.get("source", "PORTAL"),
            rating=fb["rating"],
            feedback_text=fb.get("feedback_text"),
            suggestion_text=fb.get("suggestion_text"),
            publication_consent=fb["publication_consent"],
            is_anonymous=fb.get("is_anonymous", False),
            moderation_status=fb["moderation_status"],
            visibility=fb.get("visibility", "ADMIN_ONLY"),
            moderated_by=fb.get("moderated_by"),
            moderated_at=fb.get("moderated_at"),
            moderation_notes=fb.get("moderation_notes"),
            student_name=fb.get("student_name"),
            student_enrollment=fb.get("student_enrollment"),
            created_at=fb["created_at"],
            updated_at=fb["updated_at"],
        )

    def _format_public_response(self, fb: Dict[str, Any]) -> PublicFeedbackResponse:
        author_name = "Anonymous Participant"
        if fb.get("publication_consent") == "PUBLIC_NAME" and fb.get("student_name"):
            author_name = fb["student_name"]

        return PublicFeedbackResponse(
            id=fb["id"],
            event_id=fb["event_id"],
            rating=fb["rating"],
            feedback_text=fb.get("feedback_text"),
            suggestion_text=fb.get("suggestion_text"),
            author_name=author_name,
            is_anonymous=fb.get("publication_consent") != "PUBLIC_NAME",
            created_at=fb["created_at"],
        )

    def submit_feedback(
        self,
        event_id: str,
        data: FeedbackCreate,
        student_id: str,
        student_name: Optional[str] = None,
        student_enrollment: Optional[str] = None,
        student_email: Optional[str] = None,
    ) -> FeedbackResponse:
        # 1. Verify canonical event exists
        event = event_service.get_event_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Canonical Event '{event_id}' not found.",
            )

        # 2. Check for duplicate submission
        for fb in self._feedbacks.values():
            if fb["event_id"] == event_id and fb["student_id"] == student_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Feedback has already been submitted for this event.",
                )

        # 3. Check participant eligibility
        # Find if student is registered/participated in this event
        participation_id = None
        for p in event_service._participations.values():
            if p["event_id"] == event_id and (
                p.get("student_id") == student_id
                or (student_enrollment and p.get("enrollment_number") == student_enrollment)
                or (student_email and p.get("email") == student_email)
            ):
                participation_id = p["id"]
                if p.get("student_name"):
                    student_name = p.get("student_name")
                elif not student_name:
                    student_name = "Student Participant"
                if not student_enrollment:
                    student_enrollment = p.get("enrollment_number")
                break

        now = _now_iso()
        fb_id = str(uuid.uuid4())
        consent = data.publication_consent.upper()
        if consent not in ("NO", "ANONYMOUS", "PUBLIC_NAME"):
            consent = "NO"

        is_anon = consent != "PUBLIC_NAME"

        record = {
            "id": fb_id,
            "event_id": event_id,
            "student_id": student_id,
            "participation_id": participation_id,
            "source": data.source or "PORTAL",
            "rating": data.rating,
            "feedback_text": data.feedback_text,
            "suggestion_text": data.suggestion_text,
            "publication_consent": consent,
            "is_anonymous": is_anon,
            "moderation_status": "PENDING",
            "visibility": "ADMIN_ONLY",
            "moderated_by": None,
            "moderated_at": None,
            "moderation_notes": None,
            "student_name": student_name,
            "student_enrollment": student_enrollment,
            "created_at": now,
            "updated_at": now,
        }
        self._feedbacks[fb_id] = record

        self._audit_logs.append({
            "action": "FEEDBACK_SUBMITTED",
            "entity_id": fb_id,
            "event_id": event_id,
            "student_id": student_id,
            "timestamp": now,
        })

        return self._format_admin_response(record)

    def list_event_feedback_admin(
        self,
        event_id: str,
        moderation_status: Optional[str] = None,
        rating: Optional[int] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[FeedbackResponse], int]:
        results = []
        for fb in self._feedbacks.values():
            if fb["event_id"] != event_id:
                continue
            if moderation_status and fb["moderation_status"] != moderation_status:
                continue
            if rating and fb["rating"] != rating:
                continue
            results.append(fb)

        results.sort(key=lambda x: x["created_at"], reverse=True)
        total = len(results)
        start_idx = (page - 1) * page_size
        paged = results[start_idx:start_idx + page_size]

        return [self._format_admin_response(f) for f in paged], total

    def list_event_feedback_public(
        self,
        event_id: str,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[PublicFeedbackResponse], int]:
        results = []
        for fb in self._feedbacks.values():
            if fb["event_id"] != event_id:
                continue
            # Must be approved, public visibility, and consent must be ANONYMOUS or PUBLIC_NAME
            if fb["moderation_status"] != "APPROVED":
                continue
            if fb.get("visibility") != "PUBLIC":
                continue
            if fb.get("publication_consent") not in ("ANONYMOUS", "PUBLIC_NAME"):
                continue

            results.append(fb)

        results.sort(key=lambda x: x["created_at"], reverse=True)
        total = len(results)
        start_idx = (page - 1) * page_size
        paged = results[start_idx:start_idx + page_size]

        return [self._format_public_response(f) for f in paged], total

    def moderate_feedback(
        self,
        feedback_id: str,
        data: FeedbackModerateRequest,
        moderator_id: str,
    ) -> FeedbackResponse:
        fb = self._feedbacks.get(feedback_id)
        if not fb:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Feedback with ID '{feedback_id}' not found.",
            )

        status_upper = data.moderation_status.upper()
        if status_upper not in ("PENDING", "APPROVED", "REJECTED"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid moderation status '{data.moderation_status}'.",
            )

        now = _now_iso()
        fb["moderation_status"] = status_upper
        fb["moderated_by"] = moderator_id
        fb["moderated_at"] = now
        if data.visibility:
            fb["visibility"] = data.visibility
        elif status_upper == "APPROVED":
            # If consent was granted, default visibility to PUBLIC
            if fb.get("publication_consent") in ("ANONYMOUS", "PUBLIC_NAME"):
                fb["visibility"] = "PUBLIC"

        if data.moderation_notes is not None:
            fb["moderation_notes"] = data.moderation_notes

        fb["updated_at"] = now

        self._audit_logs.append({
            "action": f"FEEDBACK_MODERATED_{status_upper}",
            "entity_id": feedback_id,
            "actor_id": moderator_id,
            "timestamp": now,
        })

        return self._format_admin_response(fb)

    def publish_feedback(
        self,
        feedback_id: str,
        publisher_id: str,
    ) -> FeedbackResponse:
        fb = self._feedbacks.get(feedback_id)
        if not fb:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Feedback with ID '{feedback_id}' not found.",
            )

        if fb.get("publication_consent") == "NO":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student declined publication consent for this feedback.",
            )

        now = _now_iso()
        fb["moderation_status"] = "APPROVED"
        fb["visibility"] = "PUBLIC"
        fb["moderated_by"] = publisher_id
        fb["moderated_at"] = now
        fb["updated_at"] = now

        self._audit_logs.append({
            "action": "FEEDBACK_PUBLISHED",
            "entity_id": feedback_id,
            "actor_id": publisher_id,
            "timestamp": now,
        })

        return self._format_admin_response(fb)

    def get_event_feedback_summary(self, event_id: str) -> FeedbackSummaryResponse:
        feedbacks = [f for f in self._feedbacks.values() if f["event_id"] == event_id]
        total = len(feedbacks)
        if total == 0:
            return FeedbackSummaryResponse(
                event_id=event_id,
                total_feedback=0,
                average_rating=0.0,
                rating_distribution={1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
                pending_moderation_count=0,
                approved_count=0,
                rejected_count=0,
            )

        total_rating = sum(f["rating"] for f in feedbacks)
        dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        pending = 0
        approved = 0
        rejected = 0

        for f in feedbacks:
            r = f["rating"]
            dist[r] = dist.get(r, 0) + 1
            st = f.get("moderation_status")
            if st == "PENDING":
                pending += 1
            elif st == "APPROVED":
                approved += 1
            elif st == "REJECTED":
                rejected += 1

        return FeedbackSummaryResponse(
            event_id=event_id,
            total_feedback=total,
            average_rating=round(total_rating / total, 2),
            rating_distribution=dist,
            pending_moderation_count=pending,
            approved_count=approved,
            rejected_count=rejected,
        )


feedback_service = FeedbackService()
