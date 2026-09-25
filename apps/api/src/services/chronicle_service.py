"""
AIML CLUB OCT — CONNECT
Chronicle Domain Service & Editorial Workflow Engine

Specification Reference:
- 01_PRODUCT_REQUIREMENTS.md (Section 16)
- 03_DATABASE_SCHEMA.md (Section 28, 29)
- 04_RBAC_PERMISSIONS.md
- 05_API_SPECIFICATION.md (Section 17)
- 07_DOMAIN_ARCHITECTURE.md
"""

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException, status

from apps.api.src.schemas.chronicle import (
    ChronicleCreate,
    ChronicleResponse,
    ChronicleUpdate,
    EventChronicleItemResponse,
)
from apps.api.src.services.event_service import event_service


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[-\s]+", "-", text)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class ChronicleService:
    def __init__(self):
        self._entries: Dict[str, Dict[str, Any]] = {}
        self._event_items: Dict[str, Dict[str, Any]] = {}
        self._audit_logs: List[Dict[str, Any]] = []

        self._seed_initial_chronicle()

    def _seed_initial_chronicle(self):
        entry_id = "00000000-0000-0000-0000-000000000701"
        self._entries[entry_id] = {
            "id": entry_id,
            "title": "Welcome to AIML Club Chronicle: Academic Year 2026",
            "slug": "welcome-to-aiml-club-chronicle-2026",
            "edition_type": "INSTITUTIONAL_ANNOUNCEMENT",
            "excerpt": "Official inaugurative edition of AIML CLUB OCT Chronicle covering key milestones, upcoming symposiums, and student research tracks.",
            "content": "# Welcome to AIML Club Chronicle\n\nInnovate. Implement. Inspire.\n\nWe are pleased to introduce the official digital chronicle of AIML CLUB OCT.",
            "cover_media_id": None,
            "visibility": "PUBLIC",
            "status": "PUBLISHED",
            "scheduled_at": None,
            "published_at": "2026-03-01T10:00:00Z",
            "created_by": "00000000-0000-0000-0000-000000000001",
            "approved_by": "00000000-0000-0000-0000-000000000001",
            "seo_title": "Welcome to AIML Club Chronicle — 2026 Edition",
            "seo_description": "Inaugurative editorial edition from AI & Machine Learning Club, Oriental College of Technology Bhopal.",
            "created_at": "2026-03-01T09:00:00Z",
            "updated_at": "2026-03-01T10:00:00Z",
        }

        # Link to Aptify 2.0
        item_id = str(uuid.uuid4())
        self._event_items[item_id] = {
            "id": item_id,
            "chronicle_id": entry_id,
            "event_id": "00000000-0000-0000-0000-000000000101",
            "display_order": 0,
        }

    def _format_entry(self, entry: Dict[str, Any]) -> ChronicleResponse:
        # Collect linked events
        linked_items: List[EventChronicleItemResponse] = []
        for item in self._event_items.values():
            if item["chronicle_id"] == entry["id"]:
                ev = event_service.get_event_by_id(item["event_id"])
                linked_items.append(
                    EventChronicleItemResponse(
                        id=item["id"],
                        chronicle_id=item["chronicle_id"],
                        event_id=item["event_id"],
                        display_order=item.get("display_order", 0),
                        event_title=ev.title if ev else None,
                        event_slug=ev.slug if ev else None,
                        event_type=ev.event_type if ev else None,
                        start_at=ev.start_at if ev else None,
                        venue=ev.venue if ev else None,
                    )
                )

        linked_items.sort(key=lambda x: x.display_order)

        return ChronicleResponse(
            id=entry["id"],
            title=entry["title"],
            slug=entry["slug"],
            edition_type=entry["edition_type"],
            excerpt=entry.get("excerpt"),
            content=entry["content"],
            cover_media_id=entry.get("cover_media_id"),
            visibility=entry["visibility"],
            status=entry["status"],
            scheduled_at=entry.get("scheduled_at"),
            published_at=entry.get("published_at"),
            created_by=entry.get("created_by"),
            approved_by=entry.get("approved_by"),
            seo_title=entry.get("seo_title"),
            seo_description=entry.get("seo_description"),
            linked_events=linked_items,
            created_at=entry["created_at"],
            updated_at=entry["updated_at"],
        )

    def list_entries(
        self,
        status_filter: Optional[str] = None,
        edition_type: Optional[str] = None,
        search: Optional[str] = None,
        is_admin: bool = False,
        page: int = 1,
        page_size: int = 25,
    ) -> Tuple[List[ChronicleResponse], int]:
        results = []

        for entry in self._entries.values():
            # If public caller, only PUBLISHED and PUBLIC entries are accessible
            if not is_admin:
                if entry["status"] != "PUBLISHED" or entry["visibility"] != "PUBLIC":
                    continue
            else:
                if status_filter and entry["status"] != status_filter:
                    continue

            if edition_type and entry["edition_type"] != edition_type:
                continue

            if search:
                s = search.lower()
                title_match = s in entry["title"].lower()
                excerpt_match = bool(entry.get("excerpt") and s in entry["excerpt"].lower())
                if not (title_match or excerpt_match):
                    continue

            results.append(entry)

        # Sort descending by published_at or created_at
        results.sort(
            key=lambda x: x.get("published_at") or x.get("created_at"),
            reverse=True,
        )

        total = len(results)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paged = results[start_idx:end_idx]

        return [self._format_entry(e) for e in paged], total

    def get_by_slug(self, slug: str, is_admin: bool = False) -> ChronicleResponse:
        for entry in self._entries.values():
            if entry["slug"] == slug:
                if not is_admin and (entry["status"] != "PUBLISHED" or entry["visibility"] != "PUBLIC"):
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Chronicle publication not found or not publicly available.",
                    )
                return self._format_entry(entry)

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chronicle publication with slug '{slug}' not found.",
        )

    def get_by_id(self, entry_id: str, is_admin: bool = False) -> ChronicleResponse:
        entry = self._entries.get(entry_id)
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chronicle publication with ID '{entry_id}' not found.",
            )
        if not is_admin and (entry["status"] != "PUBLISHED" or entry["visibility"] != "PUBLIC"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chronicle publication not found or not publicly available.",
            )
        return self._format_entry(entry)

    def create_entry(self, data: ChronicleCreate, author_id: str) -> ChronicleResponse:
        entry_id = str(uuid.uuid4())
        slug = data.slug if data.slug else _slugify(data.title)

        # Check slug uniqueness
        for e in self._entries.values():
            if e["slug"] == slug:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Chronicle entry with slug '{slug}' already exists.",
                )

        now = _now_iso()
        entry = {
            "id": entry_id,
            "title": data.title,
            "slug": slug,
            "edition_type": data.edition_type,
            "excerpt": data.excerpt,
            "content": data.content,
            "cover_media_id": data.cover_media_id,
            "visibility": data.visibility,
            "status": "DRAFT",
            "scheduled_at": data.scheduled_at,
            "published_at": None,
            "created_by": author_id,
            "approved_by": None,
            "seo_title": data.seo_title or data.title,
            "seo_description": data.seo_description or data.excerpt,
            "created_at": now,
            "updated_at": now,
        }
        self._entries[entry_id] = entry

        # Link canonical events
        if data.linked_event_ids:
            for idx, ev_id in enumerate(data.linked_event_ids):
                # Verify canonical event exists
                if not event_service.get_event_by_id(ev_id):
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Canonical Event '{ev_id}' not found.",
                    )
                item_id = str(uuid.uuid4())
                self._event_items[item_id] = {
                    "id": item_id,
                    "chronicle_id": entry_id,
                    "event_id": ev_id,
                    "display_order": idx,
                }

        self._audit_logs.append({
            "action": "CHRONICLE_CREATED",
            "entity_id": entry_id,
            "actor_id": author_id,
            "timestamp": now,
        })

        return self._format_entry(entry)

    def update_entry(self, entry_id: str, data: ChronicleUpdate, user_id: str) -> ChronicleResponse:
        entry = self._entries.get(entry_id)
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chronicle publication with ID '{entry_id}' not found.",
            )

        # Disallow editing archived entries
        if entry["status"] == "ARCHIVED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot update an archived chronicle publication.",
            )

        if data.title is not None:
            entry["title"] = data.title
        if data.slug is not None:
            # Check unique slug
            for k, e in self._entries.items():
                if k != entry_id and e["slug"] == data.slug:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Chronicle entry with slug '{data.slug}' already exists.",
                    )
            entry["slug"] = data.slug
        if data.edition_type is not None:
            entry["edition_type"] = data.edition_type
        if data.excerpt is not None:
            entry["excerpt"] = data.excerpt
        if data.content is not None:
            entry["content"] = data.content
        if data.cover_media_id is not None:
            entry["cover_media_id"] = data.cover_media_id
        if data.visibility is not None:
            entry["visibility"] = data.visibility
        if data.scheduled_at is not None:
            entry["scheduled_at"] = data.scheduled_at
        if data.seo_title is not None:
            entry["seo_title"] = data.seo_title
        if data.seo_description is not None:
            entry["seo_description"] = data.seo_description

        if data.linked_event_ids is not None:
            # Re-link events
            # Remove old links
            to_remove = [k for k, v in self._event_items.items() if v["chronicle_id"] == entry_id]
            for k in to_remove:
                del self._event_items[k]

            for idx, ev_id in enumerate(data.linked_event_ids):
                if not event_service.get_event_by_id(ev_id):
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Canonical Event '{ev_id}' not found.",
                    )
                item_id = str(uuid.uuid4())
                self._event_items[item_id] = {
                    "id": item_id,
                    "chronicle_id": entry_id,
                    "event_id": ev_id,
                    "display_order": idx,
                }

        entry["updated_at"] = _now_iso()

        self._audit_logs.append({
            "action": "CHRONICLE_UPDATED",
            "entity_id": entry_id,
            "actor_id": user_id,
            "timestamp": entry["updated_at"],
        })

        return self._format_entry(entry)

    def submit_for_review(self, entry_id: str, user_id: str) -> ChronicleResponse:
        entry = self._entries.get(entry_id)
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chronicle publication with ID '{entry_id}' not found.",
            )

        if entry["status"] not in ("DRAFT", "ARCHIVED"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot submit chronicle in '{entry['status']}' state for review.",
            )

        now = _now_iso()
        entry["status"] = "REVIEW"
        entry["updated_at"] = now

        self._audit_logs.append({
            "action": "CHRONICLE_SUBMITTED_FOR_REVIEW",
            "entity_id": entry_id,
            "actor_id": user_id,
            "timestamp": now,
        })

        return self._format_entry(entry)

    def approve(self, entry_id: str, reviewer_id: str) -> ChronicleResponse:
        entry = self._entries.get(entry_id)
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chronicle publication with ID '{entry_id}' not found.",
            )

        if entry["status"] != "REVIEW":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot approve chronicle in '{entry['status']}' state; must be in REVIEW.",
            )

        now = _now_iso()
        entry["approved_by"] = reviewer_id
        if entry.get("scheduled_at"):
            entry["status"] = "SCHEDULED"
        entry["updated_at"] = now

        self._audit_logs.append({
            "action": "CHRONICLE_APPROVED",
            "entity_id": entry_id,
            "actor_id": reviewer_id,
            "timestamp": now,
        })

        return self._format_entry(entry)

    def publish(self, entry_id: str, publisher_id: str) -> ChronicleResponse:
        entry = self._entries.get(entry_id)
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chronicle publication with ID '{entry_id}' not found.",
            )

        if entry["status"] not in ("REVIEW", "SCHEDULED", "DRAFT"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot publish chronicle in '{entry['status']}' state.",
            )

        now = _now_iso()
        entry["status"] = "PUBLISHED"
        entry["approved_by"] = publisher_id
        entry["published_at"] = now
        entry["updated_at"] = now

        self._audit_logs.append({
            "action": "CHRONICLE_PUBLISHED",
            "entity_id": entry_id,
            "actor_id": publisher_id,
            "timestamp": now,
        })

        return self._format_entry(entry)

    def archive(self, entry_id: str, user_id: str) -> ChronicleResponse:
        entry = self._entries.get(entry_id)
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Chronicle publication with ID '{entry_id}' not found.",
            )

        now = _now_iso()
        entry["status"] = "ARCHIVED"
        entry["updated_at"] = now

        self._audit_logs.append({
            "action": "CHRONICLE_ARCHIVED",
            "entity_id": entry_id,
            "actor_id": user_id,
            "timestamp": now,
        })

        return self._format_entry(entry)


chronicle_service = ChronicleService()
