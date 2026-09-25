"""
AIML CLUB OCT — CONNECT
Event Domain Service & Business Logic Layer

Specification Reference:
- 01_PRODUCT_REQUIREMENTS.md (Section 7, 8)
- 02_SYSTEM_ARCHITECTURE.md
- 03_DATABASE_SCHEMA.md
- 04_RBAC_PERMISSIONS.md
- 05_API_SPECIFICATION.md
"""

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException, status

from apps.api.src.core.lifecycle import validate_lifecycle_transition
from apps.api.src.schemas.events import (
    EventAnalyticsResponse,
    EventCreate,
    EventResponse,
    EventUpdate,
    ParticipationCreate,
    ParticipationResponse,
    ParticipationUpdate,
)


def _slugify(text: str) -> str:
    """Generates URL-safe lowercase slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[-\s]+", "-", text)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class EventService:
    def __init__(self):
        # In-memory transactional repositories
        self._events: Dict[str, Dict[str, Any]] = {}
        self._participations: Dict[str, Dict[str, Any]] = {}
        self._audit_logs: List[Dict[str, Any]] = []

        # Seed initial canonical sample events
        self._seed_initial_events()

    def _seed_initial_events(self):
        evt_1_id = "00000000-0000-0000-0000-000000000101"
        self._events[evt_1_id] = {
            "id": evt_1_id,
            "event_code": "EVT-APTIFY-2026",
            "slug": "aptify-2026",
            "title": "Aptify 2.0: AI Symposium",
            "short_description": "Flagship AI symposium and workshop at Oriental College of Technology.",
            "description": "Comprehensive student symposium featuring AI keynote speakers, workshops, and hackathons.",
            "event_type": "SYMPOSIUM",
            "status": "REGISTRATION_OPEN",
            "visibility": "PUBLIC",
            "venue": "Auditorium, Oriental College of Technology, Bhopal",
            "cover_media_id": None,
            "start_at": "2026-10-15T09:30:00Z",
            "end_at": "2026-10-15T17:00:00Z",
            "registration_open_at": "2026-09-01T00:00:00Z",
            "registration_close_at": "2026-10-14T23:59:59Z",
            "capacity": 250,
            "published_at": "2026-09-01T00:00:00Z",
            "created_by": "00000000-0000-0000-0000-000000000001",
            "created_at": "2026-09-01T00:00:00Z",
            "updated_at": "2026-09-25T00:00:00Z",
        }

        # Seed initial registration
        part_1_id = "00000000-0000-0000-0000-000000000201"
        self._participations[part_1_id] = {
            "id": part_1_id,
            "event_id": evt_1_id,
            "student_id": "00000000-0000-0000-0000-000000000301",
            "student_name": "Aman Sharma",
            "enrollment_number": "0126AL221001",
            "email": "aman.sharma@example.com",
            "phone": "9876543210",
            "department": "AIML",
            "course": "B.Tech",
            "batch": "2022-2026",
            "semester": "VI",
            "registration_source": "MANUAL",
            "source_record_id": None,
            "registration_status": "CONFIRMED",
            "event_role": "PARTICIPANT",
            "team_name": "NeuralNet OCT",
            "result": None,
            "notes": None,
            "registered_at": "2026-09-10T10:00:00Z",
            "created_at": "2026-09-10T10:00:00Z",
            "updated_at": "2026-09-10T10:00:00Z",
        }

    # --------------------------------------------------------------------------
    # Audit Logging
    # --------------------------------------------------------------------------
    def _record_audit(self, action: str, entity_type: str, entity_id: str, actor_id: str, details: Dict[str, Any]):
        log_entry = {
            "id": str(uuid.uuid4()),
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "actor_id": actor_id,
            "details": details,
            "timestamp": _now_iso(),
        }
        self._audit_logs.append(log_entry)

    # --------------------------------------------------------------------------
    # Event Query & Discovery
    # --------------------------------------------------------------------------
    def list_events(
        self,
        status: Optional[str] = None,
        event_type: Optional[str] = None,
        search: Optional[str] = None,
        is_admin: bool = False,
        page: int = 1,
        page_size: int = 25,
    ) -> Tuple[List[EventResponse], int]:
        all_events = list(self._events.values())

        filtered: List[Dict[str, Any]] = []
        for evt in all_events:
            # Privacy / Public boundary
            if not is_admin:
                if evt.get("visibility") != "PUBLIC" or evt.get("status") in ("DRAFT", "ARCHIVED"):
                    continue

            # Status filter
            if status and evt.get("status") != status:
                continue

            # Type filter
            if event_type and evt.get("event_type") != event_type:
                continue

            # Search filter
            if search:
                term = search.lower()
                title_match = term in (evt.get("title") or "").lower()
                desc_match = term in (evt.get("short_description") or "").lower()
                code_match = term in (evt.get("event_code") or "").lower()
                if not (title_match or desc_match or code_match):
                    continue

            filtered.append(evt)

        # Sort: start_at descending / updated_at
        filtered.sort(key=lambda x: x.get("start_at") or x.get("created_at"), reverse=True)

        total = len(filtered)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        page_items = [EventResponse(**item) for item in filtered[start_idx:end_idx]]
        return page_items, total

    def get_event(self, id_or_slug: str, is_admin: bool = False) -> EventResponse:
        evt: Optional[Dict[str, Any]] = None
        for item in self._events.values():
            if item["id"] == id_or_slug or item["slug"] == id_or_slug:
                evt = item
                break

        if not evt:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event '{id_or_slug}' not found.",
            )

        if not is_admin and (evt.get("visibility") != "PUBLIC" or evt.get("status") in ("DRAFT", "ARCHIVED")):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event '{id_or_slug}' is not publicly available.",
            )

        return EventResponse(**evt)

    def get_event_by_id(self, event_id: str) -> Optional[EventResponse]:
        evt = self._events.get(event_id)
        if not evt:
            return None
        return EventResponse(**evt)

    # --------------------------------------------------------------------------

    # Event Mutations (CRUD & Lifecycle)
    # --------------------------------------------------------------------------
    def create_event(self, data: EventCreate, actor_id: str) -> EventResponse:
        # Date validations
        if data.start_at and data.end_at and data.start_at > data.end_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event start date cannot be after end date.",
            )

        if data.registration_open_at and data.registration_close_at and data.registration_open_at > data.registration_close_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration open date cannot be after registration close date.",
            )

        event_id = str(uuid.uuid4())
        slug = data.slug or _slugify(data.title)
        
        # Verify slug uniqueness
        for item in self._events.values():
            if item["slug"] == slug:
                slug = f"{slug}-{event_id[:6]}"
                break

        event_code = data.event_code or f"EVT-{slug.upper()[:16]}"
        now = _now_iso()

        new_event = {
            "id": event_id,
            "event_code": event_code,
            "slug": slug,
            "title": data.title,
            "short_description": data.short_description,
            "description": data.description,
            "event_type": data.event_type or "WORKSHOP",
            "status": "DRAFT",  # New events always begin in DRAFT
            "visibility": data.visibility or "PUBLIC",
            "venue": data.venue,
            "cover_media_id": data.cover_media_id,
            "start_at": data.start_at,
            "end_at": data.end_at,
            "registration_open_at": data.registration_open_at,
            "registration_close_at": data.registration_close_at,
            "capacity": data.capacity,
            "published_at": None,
            "created_by": actor_id,
            "created_at": now,
            "updated_at": now,
        }

        self._events[event_id] = new_event
        self._record_audit(
            action="EVENT_CREATED",
            entity_type="EVENT",
            entity_id=event_id,
            actor_id=actor_id,
            details={"title": data.title, "event_code": event_code},
        )
        return EventResponse(**new_event)

    def update_event(self, event_id: str, data: EventUpdate, actor_id: str) -> EventResponse:
        if event_id not in self._events:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event '{event_id}' not found.",
            )

        evt = self._events[event_id]

        # Validations on dates
        start_at = data.start_at if data.start_at is not None else evt.get("start_at")
        end_at = data.end_at if data.end_at is not None else evt.get("end_at")
        if start_at and end_at and start_at > end_at:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event start date cannot be after end date.",
            )

        reg_open = data.registration_open_at if data.registration_open_at is not None else evt.get("registration_open_at")
        reg_close = data.registration_close_at if data.registration_close_at is not None else evt.get("registration_close_at")
        if reg_open and reg_close and reg_open > reg_close:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration open date cannot be after registration close date.",
            )

        # Update supplied fields
        update_data = data.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            evt[key] = val

        evt["updated_at"] = _now_iso()
        self._events[event_id] = evt

        self._record_audit(
            action="EVENT_UPDATED",
            entity_type="EVENT",
            entity_id=event_id,
            actor_id=actor_id,
            details=update_data,
        )
        return EventResponse(**evt)

    def transition_event(
        self,
        event_id: str,
        to_status: str,
        actor_id: str,
        reason: Optional[str] = None,
        is_super_admin: bool = False,
    ) -> EventResponse:
        if event_id not in self._events:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event '{event_id}' not found.",
            )

        evt = self._events[event_id]
        current_status = evt["status"]

        # Validate finite state machine transition
        validate_lifecycle_transition(current_status, to_status, is_super_admin=is_super_admin)

        now = _now_iso()
        evt["status"] = to_status
        evt["updated_at"] = now

        if to_status in ("REGISTRATION_OPEN", "LIVE") and not evt.get("published_at"):
            evt["published_at"] = now

        self._events[event_id] = evt
        self._record_audit(
            action="EVENT_STATUS_TRANSITION",
            entity_type="EVENT",
            entity_id=event_id,
            actor_id=actor_id,
            details={"from": current_status, "to": to_status, "reason": reason},
        )
        return EventResponse(**evt)

    def archive_event(self, event_id: str, actor_id: str) -> EventResponse:
        return self.transition_event(
            event_id=event_id,
            to_status="ARCHIVED",
            actor_id=actor_id,
            reason="Event archived by administrator",
        )

    # --------------------------------------------------------------------------
    # Participant Registration & Capacity Management
    # --------------------------------------------------------------------------
    def register_participant(self, event_id: str, data: ParticipationCreate) -> ParticipationResponse:
        if event_id not in self._events:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event '{event_id}' not found.",
            )

        evt = self._events[event_id]

        # 1. Lifecycle status check: must be REGISTRATION_OPEN
        if evt["status"] != "REGISTRATION_OPEN":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Registration is not open for this event (current status: {evt['status']}).",
            )

        # 2. Registration window check
        now = datetime.now(timezone.utc)
        if evt.get("registration_close_at"):
            close_dt = datetime.fromisoformat(evt["registration_close_at"].replace("Z", "+00:00"))
            if now > close_dt:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Registration deadline for this event has passed.",
                )

        # 3. Duplicate registration check (unique per event + enrollment/email)
        norm_enrollment = data.enrollment_number.strip().upper()
        norm_email = data.email.strip().lower()

        for part in self._participations.values():
            if part["event_id"] == event_id:
                if part["enrollment_number"] == norm_enrollment:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Student with enrollment '{norm_enrollment}' is already registered for this event.",
                    )
                if part["email"] == norm_email:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Student with email '{norm_email}' is already registered for this event.",
                    )

        # 4. Capacity and Waitlist Handling
        capacity = evt.get("capacity")
        reg_status = "CONFIRMED"

        if capacity is not None and capacity > 0:
            confirmed_count = sum(
                1 for p in self._participations.values()
                if p["event_id"] == event_id and p["registration_status"] in ("CONFIRMED", "REGISTERED")
            )
            if confirmed_count >= capacity:
                reg_status = "WAITLISTED"

        part_id = str(uuid.uuid4())
        student_id = str(uuid.uuid4())
        now_str = _now_iso()

        new_participation = {
            "id": part_id,
            "event_id": event_id,
            "student_id": student_id,
            "student_name": data.full_name.strip(),
            "enrollment_number": norm_enrollment,
            "email": norm_email,
            "phone": data.phone,
            "department": data.department,
            "course": data.course,
            "batch": data.batch,
            "semester": data.semester,
            "registration_source": data.source or "MANUAL",
            "source_record_id": None,
            "registration_status": reg_status,
            "event_role": "PARTICIPANT",
            "team_name": data.team_name,
            "result": None,
            "notes": data.notes,
            "registered_at": now_str,
            "created_at": now_str,
            "updated_at": now_str,
        }

        self._participations[part_id] = new_participation
        self._record_audit(
            action="PARTICIPANT_REGISTERED",
            entity_type="EVENT_PARTICIPATION",
            entity_id=part_id,
            actor_id=student_id,
            details={"event_id": event_id, "enrollment": norm_enrollment, "status": reg_status},
        )
        return ParticipationResponse(**new_participation)

    def list_participants(
        self,
        event_id: str,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[ParticipationResponse]:
        if event_id not in self._events:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event '{event_id}' not found.",
            )

        results: List[Dict[str, Any]] = []
        for p in self._participations.values():
            if p["event_id"] != event_id:
                continue
            if status and p["registration_status"] != status:
                continue
            if search:
                term = search.lower()
                name_match = term in (p["student_name"] or "").lower()
                enroll_match = term in (p["enrollment_number"] or "").lower()
                email_match = term in (p["email"] or "").lower()
                if not (name_match or enroll_match or email_match):
                    continue
            results.append(p)

        results.sort(key=lambda x: x["registered_at"], reverse=True)
        return [ParticipationResponse(**item) for item in results]

    def update_participant(
        self,
        event_id: str,
        participation_id: str,
        data: ParticipationUpdate,
        actor_id: str,
    ) -> ParticipationResponse:
        if participation_id not in self._participations:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Participation record '{participation_id}' not found.",
            )

        p = self._participations[participation_id]
        if p["event_id"] != event_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Participation record does not belong to specified event.",
            )

        update_data = data.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            p[key] = val

        p["updated_at"] = _now_iso()
        self._participations[participation_id] = p

        self._record_audit(
            action="PARTICIPANT_STATUS_UPDATED",
            entity_type="EVENT_PARTICIPATION",
            entity_id=participation_id,
            actor_id=actor_id,
            details=update_data,
        )
        return ParticipationResponse(**p)

    def cancel_participant(self, event_id: str, participation_id: str, actor_id: str) -> ParticipationResponse:
        return self.update_participant(
            event_id=event_id,
            participation_id=participation_id,
            data=ParticipationUpdate(registration_status="CANCELLED"),
            actor_id=actor_id,
        )

    # --------------------------------------------------------------------------
    # Event Analytics
    # --------------------------------------------------------------------------
    def get_event_analytics(self, event_id: str) -> EventAnalyticsResponse:
        if event_id not in self._events:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Event '{event_id}' not found.",
            )

        evt = self._events[event_id]
        parts = [p for p in self._participations.values() if p["event_id"] == event_id]

        total = len(parts)
        confirmed = sum(1 for p in parts if p["registration_status"] in ("CONFIRMED", "REGISTERED"))
        waitlisted = sum(1 for p in parts if p["registration_status"] == "WAITLISTED")
        cancelled = sum(1 for p in parts if p["registration_status"] == "CANCELLED")
        attended = sum(1 for p in parts if p["registration_status"] == "ATTENDED")
        capacity = evt.get("capacity")

        capacity_pct = None
        if capacity and capacity > 0:
            capacity_pct = round((confirmed / capacity) * 100, 1)

        return EventAnalyticsResponse(
            event_id=event_id,
            event_title=evt["title"],
            total_registrations=total,
            confirmed_count=confirmed,
            waitlisted_count=waitlisted,
            cancelled_count=cancelled,
            attended_count=attended,
            capacity=capacity,
            capacity_percentage=capacity_pct,
        )


# Singleton domain service instance
event_service = EventService()
