"""
AIML CLUB OCT — CONNECT
Learning Resources Domain Service & Educational Repository

Specification Reference:
- 01_PRODUCT_REQUIREMENTS.md (Section 21)
- 03_DATABASE_SCHEMA.md (Section 27)
- 04_RBAC_PERMISSIONS.md (Learning.*)
- 05_API_SPECIFICATION.md (Section 21)
- 11_SECURITY_PRIVACY.md (URL Sanitization, Granular RBAC)
"""

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from apps.api.src.core.errors import (
    BadRequestException,
    ConflictException,
    NotFoundException,
    PermissionDeniedException,
)
from apps.api.src.core.security import AuthenticatedUser, check_permission_match
from apps.api.src.schemas.knowledge import (
    LearningResourceCreate,
    LearningResourceResponse,
    LearningResourceUpdate,
    VALID_LEARNING_DIFFICULTY_LEVELS,
    VALID_LEARNING_RESOURCE_TYPES,
    VALID_LEARNING_VISIBILITIES,
    validate_safe_http_url,
)
from apps.api.src.services.event_service import event_service


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[-\s]+", "-", text)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class LearningService:
    def __init__(self):
        self._resources: Dict[str, Dict[str, Any]] = {}
        self._audit_logs: List[Dict[str, Any]] = []

        self._seed_initial_resources()

    def _seed_initial_resources(self):
        lr1_id = "00000000-0000-0000-0000-000000000941"
        self._resources[lr1_id] = {
            "id": lr1_id,
            "title": "Introduction to PyTorch & Neural Networks Workshop Notebook",
            "slug": "pytorch-neural-networks-notebook",
            "resource_type": "NOTEBOOK",
            "difficulty_level": "BEGINNER",
            "description": "Interactive Google Colab notebook accompanying Aptify 2.0 PyTorch zero-to-hero hands-on lab.",
            "url": "https://colab.research.google.com/github/aimlcluboct/workshops/blob/main/pytorch_intro.ipynb",
            "cover_media_id": None,
            "linked_event_id": "00000000-0000-0000-0000-000000000101",
            "visibility": "PUBLIC",
            "created_by": "00000000-0000-0000-0000-000000000001",
            "published_at": "2026-03-01T10:00:00Z",
            "created_at": "2026-03-01T09:00:00Z",
            "updated_at": "2026-03-01T10:00:00Z",
        }

        lr2_id = "00000000-0000-0000-0000-000000000942"
        self._resources[lr2_id] = {
            "id": lr2_id,
            "title": "Computer Vision & Object Detection with YOLOv8",
            "slug": "yolov8-object-detection-slides",
            "resource_type": "SLIDES",
            "difficulty_level": "INTERMEDIATE",
            "description": "Comprehensive slide deck explaining architecture, anchor boxes, and loss functions in modern single-shot detectors.",
            "url": "https://docs.google.com/presentation/d/1yolov8_oct_presentation/edit",
            "cover_media_id": None,
            "linked_event_id": "00000000-0000-0000-0000-000000000101",
            "visibility": "PUBLIC",
            "created_by": "00000000-0000-0000-0000-000000000001",
            "published_at": "2026-03-05T12:00:00Z",
            "created_at": "2026-03-05T11:00:00Z",
            "updated_at": "2026-03-05T12:00:00Z",
        }

        lr3_id = "00000000-0000-0000-0000-000000000943"
        self._resources[lr3_id] = {
            "id": lr3_id,
            "title": "Advanced LLM Fine-Tuning & Quantization Guide",
            "slug": "advanced-llm-fine-tuning-guide",
            "resource_type": "DOCUMENTATION",
            "difficulty_level": "ADVANCED",
            "description": "In-depth guide covering QLoRA, parameter-efficient fine-tuning (PEFT), and 4-bit quantization on campus compute nodes.",
            "url": "https://aimlcluboct.in/docs/llm-tuning",
            "cover_media_id": None,
            "linked_event_id": None,
            "visibility": "PUBLIC",
            "created_by": "00000000-0000-0000-0000-000000000001",
            "published_at": "2026-04-10T14:00:00Z",
            "created_at": "2026-04-10T12:00:00Z",
            "updated_at": "2026-04-10T14:00:00Z",
        }

    # --------------------------------------------------------------------------
    # Formatting & Hydration
    # --------------------------------------------------------------------------
    def _format_resource(self, res: Dict[str, Any]) -> LearningResourceResponse:
        ev_title = None
        if res.get("linked_event_id"):
            ev = event_service.get_event_by_id(res["linked_event_id"])
            if ev:
                ev_title = ev.title

        return LearningResourceResponse(
            id=res["id"],
            title=res["title"],
            slug=res["slug"],
            resource_type=res["resource_type"],
            difficulty_level=res["difficulty_level"],
            description=res.get("description"),
            url=res["url"],
            cover_media_id=res.get("cover_media_id"),
            cover_media_url=None,
            linked_event_id=res.get("linked_event_id"),
            linked_event_title=ev_title,
            visibility=res["visibility"],
            created_by=res.get("created_by"),
            published_at=res.get("published_at"),
            created_at=res["created_at"],
            updated_at=res["updated_at"],
        )

    # --------------------------------------------------------------------------
    # Queries & CRUD Operations
    # --------------------------------------------------------------------------
    def list_resources(
        self,
        resource_type: Optional[str] = None,
        difficulty_level: Optional[str] = None,
        event_id: Optional[str] = None,
        search: Optional[str] = None,
        is_admin: bool = False,
        page: int = 1,
        page_size: int = 25,
    ) -> Tuple[List[LearningResourceResponse], int]:
        all_res = list(self._resources.values())

        filtered: List[Dict[str, Any]] = []
        for r in all_res:
            if is_admin:
                filtered.append(r)
            elif r.get("visibility") == "PUBLIC":
                filtered.append(r)

        if resource_type:
            rt_upper = resource_type.upper().strip()
            filtered = [r for r in filtered if r.get("resource_type", "").upper() == rt_upper]

        if difficulty_level:
            diff_upper = difficulty_level.upper().strip()
            filtered = [r for r in filtered if r.get("difficulty_level", "").upper() == diff_upper]

        if event_id:
            filtered = [r for r in filtered if r.get("linked_event_id") == event_id]

        if search:
            q = search.lower().strip()
            filtered = [
                r for r in filtered
                if q in r.get("title", "").lower()
                or (r.get("description") and q in r["description"].lower())
            ]

        filtered.sort(key=lambda x: x.get("created_at", ""), reverse=True)

        total = len(filtered)
        start = (page - 1) * page_size
        end = start + page_size
        paged = filtered[start:end]

        return [self._format_resource(r) for r in paged], total

    def get_resource_by_slug(self, slug: str, is_admin: bool = False) -> LearningResourceResponse:
        res = next((r for r in self._resources.values() if r["slug"] == slug), None)
        if not res:
            raise NotFoundException(f"Learning resource with slug '{slug}' not found.")

        if not is_admin and res.get("visibility") != "PUBLIC":
            raise NotFoundException(f"Learning resource with slug '{slug}' not found.")

        return self._format_resource(res)

    def create_resource(
        self,
        payload: LearningResourceCreate,
        current_user: AuthenticatedUser,
    ) -> LearningResourceResponse:
        is_staff = current_user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("learning.*", current_user.permissions)
        if not is_staff:
            raise PermissionDeniedException("Only content managers or administrators can register learning resources.")

        base_slug = payload.slug.strip() if payload.slug else _slugify(payload.title)
        slug = base_slug
        counter = 1
        while any(r["slug"] == slug for r in self._resources.values()):
            counter += 1
            slug = f"{base_slug}-{counter}"

        safe_url = validate_safe_http_url(payload.url)
        if not safe_url:
            raise BadRequestException("A valid HTTP or HTTPS resource URL is required.")

        now = _now_iso()
        new_id = str(uuid.uuid4())

        record = {
            "id": new_id,
            "title": payload.title.strip(),
            "slug": slug,
            "resource_type": payload.resource_type,
            "difficulty_level": payload.difficulty_level,
            "description": payload.description.strip() if payload.description else None,
            "url": safe_url,
            "cover_media_id": payload.cover_media_id,
            "linked_event_id": payload.linked_event_id,
            "visibility": payload.visibility,
            "created_by": current_user.account_id,
            "published_at": now if payload.visibility == "PUBLIC" else None,
            "created_at": now,
            "updated_at": now,
        }

        self._resources[new_id] = record
        return self._format_resource(record)

    def update_resource(
        self,
        resource_id: str,
        payload: LearningResourceUpdate,
        current_user: AuthenticatedUser,
    ) -> LearningResourceResponse:
        res = self._resources.get(resource_id)
        if not res:
            raise NotFoundException(f"Learning resource with ID '{resource_id}' not found.")

        is_staff = current_user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("learning.*", current_user.permissions)
        if not is_staff:
            raise PermissionDeniedException("Only content managers or administrators can edit learning resources.")

        if payload.slug and payload.slug != res["slug"]:
            clean_slug = _slugify(payload.slug)
            if any(r["id"] != resource_id and r["slug"] == clean_slug for r in self._resources.values()):
                raise ConflictException(f"Learning resource slug '{clean_slug}' is already taken.")
            res["slug"] = clean_slug

        if payload.title is not None:
            res["title"] = payload.title.strip()
        if payload.resource_type is not None:
            res["resource_type"] = payload.resource_type
        if payload.difficulty_level is not None:
            res["difficulty_level"] = payload.difficulty_level
        if payload.description is not None:
            res["description"] = payload.description.strip()
        if payload.url is not None:
            safe_url = validate_safe_http_url(payload.url)
            if not safe_url:
                raise BadRequestException("A valid HTTP or HTTPS resource URL is required.")
            res["url"] = safe_url
        if payload.cover_media_id is not None:
            res["cover_media_id"] = payload.cover_media_id
        if payload.linked_event_id is not None:
            res["linked_event_id"] = payload.linked_event_id
        if payload.visibility is not None:
            res["visibility"] = payload.visibility

        res["updated_at"] = _now_iso()
        return self._format_resource(res)

    def delete_resource(
        self,
        resource_id: str,
        current_user: AuthenticatedUser,
    ) -> Dict[str, Any]:
        res = self._resources.get(resource_id)
        if not res:
            raise NotFoundException(f"Learning resource with ID '{resource_id}' not found.")

        is_staff = current_user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("learning.*", current_user.permissions)
        if not is_staff:
            raise PermissionDeniedException("Only administrators can remove learning resources.")

        del self._resources[resource_id]
        return {"status": "SUCCESS", "message": f"Resource {resource_id} removed."}


# Global singleton instance
learning_service = LearningService()
