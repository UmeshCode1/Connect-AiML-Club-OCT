"""
AIML CLUB OCT — CONNECT
Journey Domain Service & Institutional Timeline Engine

Specification Reference:
- 01_PRODUCT_REQUIREMENTS.md (Section 15)
- 03_DATABASE_SCHEMA.md (Section 23)
- 04_RBAC_PERMISSIONS.md
- 05_API_SPECIFICATION.md (Section 18)
- 07_DOMAIN_ARCHITECTURE.md
"""

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException, status

from apps.api.src.schemas.journey import (
    JourneyMilestoneCreate,
    JourneyMilestoneResponse,
    JourneyMilestoneUpdate,
)
from apps.api.src.services.event_service import event_service


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[-\s]+", "-", text)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class JourneyService:
    def __init__(self):
        self._milestones: Dict[str, Dict[str, Any]] = {}
        self._audit_logs: List[Dict[str, Any]] = []

        self._seed_initial_journey()

    def _seed_initial_journey(self):
        ms_1_id = "00000000-0000-0000-0000-000000000801"
        self._milestones[ms_1_id] = {
            "id": ms_1_id,
            "title": "Foundation of AI & ML Club, Oriental College of Technology",
            "slug": "foundation-of-aiml-club-oct",
            "milestone_date": "2024-08-15",
            "milestone_type": "FOUNDATION",
            "description": "Establishment of the dedicated AI & Machine Learning student chapter at Oriental College of Technology, Bhopal under the leadership of student coordinators and institutional faculty advisors.",
            "cover_media_id": None,
            "linked_event_id": None,
            "linked_project_id": None,
            "external_link": "https://aimlcluboct.in",
            "visibility": "PUBLIC",
            "status": "PUBLISHED",
            "display_order": 0,
            "published_at": "2024-08-15T12:00:00Z",
            "created_by": "00000000-0000-0000-0000-000000000001",
            "created_at": "2024-08-15T12:00:00Z",
            "updated_at": "2024-08-15T12:00:00Z",
        }

        ms_2_id = "00000000-0000-0000-0000-000000000802"
        self._milestones[ms_2_id] = {
            "id": ms_2_id,
            "title": "Inauguration of Aptify AI Symposium Series",
            "slug": "inauguration-of-aptify-series",
            "milestone_date": "2025-02-20",
            "milestone_type": "EVENT",
            "description": "Launch of the flagship technical symposium uniting students, faculty, and industry professionals in AI engineering, computer vision, and machine learning research tracks.",
            "cover_media_id": None,
            "linked_event_id": "00000000-0000-0000-0000-000000000101",
            "linked_project_id": None,
            "external_link": None,
            "visibility": "PUBLIC",
            "status": "PUBLISHED",
            "display_order": 1,
            "published_at": "2025-02-20T10:00:00Z",
            "created_by": "00000000-0000-0000-0000-000000000001",
            "created_at": "2025-02-20T10:00:00Z",
            "updated_at": "2025-02-20T10:00:00Z",
        }

    def _format_milestone(self, ms: Dict[str, Any]) -> JourneyMilestoneResponse:
        ev_title = None
        ev_slug = None
        if ms.get("linked_event_id"):
            ev = event_service.get_event_by_id(ms["linked_event_id"])
            if ev:
                ev_title = ev.title
                ev_slug = ev.slug

        return JourneyMilestoneResponse(
            id=ms["id"],
            title=ms["title"],
            slug=ms["slug"],
            milestone_date=ms["milestone_date"],
            milestone_type=ms["milestone_type"],
            description=ms["description"],
            cover_media_id=ms.get("cover_media_id"),
            linked_event_id=ms.get("linked_event_id"),
            linked_project_id=ms.get("linked_project_id"),
            external_link=ms.get("external_link"),
            visibility=ms["visibility"],
            status=ms["status"],
            display_order=ms.get("display_order", 0),
            published_at=ms.get("published_at"),
            created_by=ms.get("created_by"),
            linked_event_title=ev_title,
            linked_event_slug=ev_slug,
            created_at=ms["created_at"],
            updated_at=ms["updated_at"],
        )

    def list_milestones(
        self,
        milestone_type: Optional[str] = None,
        search: Optional[str] = None,
        is_admin: bool = False,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[JourneyMilestoneResponse], int]:
        results = []

        for ms in self._milestones.values():
            if not is_admin:
                if ms["status"] != "PUBLISHED" or ms["visibility"] != "PUBLIC":
                    continue

            if milestone_type and ms["milestone_type"] != milestone_type:
                continue

            if search:
                s = search.lower()
                title_match = s in ms["title"].lower()
                desc_match = s in ms["description"].lower()
                if not (title_match or desc_match):
                    continue

            results.append(ms)

        # Sort chronologically by milestone_date DESC, then display_order ASC
        results.sort(
            key=lambda x: (x["milestone_date"], -x.get("display_order", 0)),
            reverse=True,
        )

        total = len(results)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paged = results[start_idx:end_idx]

        return [self._format_milestone(m) for m in paged], total

    def get_by_slug(self, slug: str, is_admin: bool = False) -> JourneyMilestoneResponse:
        for ms in self._milestones.values():
            if ms["slug"] == slug:
                if not is_admin and (ms["status"] != "PUBLISHED" or ms["visibility"] != "PUBLIC"):
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Milestone not found or not publicly available.",
                    )
                return self._format_milestone(ms)

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Journey milestone with slug '{slug}' not found.",
        )

    def get_by_id(self, milestone_id: str, is_admin: bool = False) -> JourneyMilestoneResponse:
        ms = self._milestones.get(milestone_id)
        if not ms:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Journey milestone with ID '{milestone_id}' not found.",
            )
        if not is_admin and (ms["status"] != "PUBLISHED" or ms["visibility"] != "PUBLIC"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Milestone not found or not publicly available.",
            )
        return self._format_milestone(ms)

    def create_milestone(self, data: JourneyMilestoneCreate, user_id: str) -> JourneyMilestoneResponse:
        ms_id = str(uuid.uuid4())
        slug = data.slug if data.slug else _slugify(data.title)

        # Check slug uniqueness
        for m in self._milestones.values():
            if m["slug"] == slug:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Journey milestone with slug '{slug}' already exists.",
                )

        # Verify linked canonical event if present
        if data.linked_event_id:
            if not event_service.get_event_by_id(data.linked_event_id):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Canonical Event '{data.linked_event_id}' not found.",
                )

        now = _now_iso()
        milestone_status = data.status or "DRAFT"
        published_at = now if milestone_status == "PUBLISHED" else None

        record = {
            "id": ms_id,
            "title": data.title,
            "slug": slug,
            "milestone_date": data.milestone_date,
            "milestone_type": data.milestone_type,
            "description": data.description,
            "cover_media_id": data.cover_media_id,
            "linked_event_id": data.linked_event_id,
            "linked_project_id": data.linked_project_id,
            "external_link": data.external_link,
            "visibility": data.visibility,
            "status": milestone_status,
            "display_order": data.display_order,
            "published_at": published_at,
            "created_by": user_id,
            "created_at": now,
            "updated_at": now,
        }
        self._milestones[ms_id] = record

        self._audit_logs.append({
            "action": "JOURNEY_MILESTONE_CREATED",
            "entity_id": ms_id,
            "actor_id": user_id,
            "timestamp": now,
        })

        return self._format_milestone(record)

    def update_milestone(self, milestone_id: str, data: JourneyMilestoneUpdate, user_id: str) -> JourneyMilestoneResponse:
        ms = self._milestones.get(milestone_id)
        if not ms:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Journey milestone with ID '{milestone_id}' not found.",
            )

        if data.title is not None:
            ms["title"] = data.title
        if data.slug is not None:
            for k, m in self._milestones.items():
                if k != milestone_id and m["slug"] == data.slug:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Journey milestone with slug '{data.slug}' already exists.",
                    )
            ms["slug"] = data.slug
        if data.milestone_date is not None:
            ms["milestone_date"] = data.milestone_date
        if data.milestone_type is not None:
            ms["milestone_type"] = data.milestone_type
        if data.description is not None:
            ms["description"] = data.description
        if data.cover_media_id is not None:
            ms["cover_media_id"] = data.cover_media_id
        if data.linked_event_id is not None:
            if data.linked_event_id and not event_service.get_event_by_id(data.linked_event_id):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Canonical Event '{data.linked_event_id}' not found.",
                )
            ms["linked_event_id"] = data.linked_event_id
        if data.linked_project_id is not None:
            ms["linked_project_id"] = data.linked_project_id
        if data.external_link is not None:
            ms["external_link"] = data.external_link
        if data.visibility is not None:
            ms["visibility"] = data.visibility
        if data.status is not None:
            ms["status"] = data.status
            if data.status == "PUBLISHED" and not ms.get("published_at"):
                ms["published_at"] = _now_iso()
        if data.display_order is not None:
            ms["display_order"] = data.display_order

        ms["updated_at"] = _now_iso()

        self._audit_logs.append({
            "action": "JOURNEY_MILESTONE_UPDATED",
            "entity_id": milestone_id,
            "actor_id": user_id,
            "timestamp": ms["updated_at"],
        })

        return self._format_milestone(ms)

    def publish_milestone(self, milestone_id: str, user_id: str) -> JourneyMilestoneResponse:
        ms = self._milestones.get(milestone_id)
        if not ms:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Journey milestone with ID '{milestone_id}' not found.",
            )

        now = _now_iso()
        ms["status"] = "PUBLISHED"
        ms["published_at"] = now
        ms["updated_at"] = now

        self._audit_logs.append({
            "action": "JOURNEY_MILESTONE_PUBLISHED",
            "entity_id": milestone_id,
            "actor_id": user_id,
            "timestamp": now,
        })

        return self._format_milestone(ms)

    def archive_milestone(self, milestone_id: str, user_id: str) -> JourneyMilestoneResponse:
        ms = self._milestones.get(milestone_id)
        if not ms:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Journey milestone with ID '{milestone_id}' not found.",
            )

        now = _now_iso()
        ms["status"] = "ARCHIVED"
        ms["updated_at"] = now

        self._audit_logs.append({
            "action": "JOURNEY_MILESTONE_ARCHIVED",
            "entity_id": milestone_id,
            "actor_id": user_id,
            "timestamp": now,
        })

        return self._format_milestone(ms)


journey_service = JourneyService()
