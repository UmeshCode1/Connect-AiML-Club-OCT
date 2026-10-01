"""
AIML CLUB OCT — CONNECT
Research Domain Service & Academic Archive Engine

Specification Reference:
- 01_PRODUCT_REQUIREMENTS.md (Section 20)
- 03_DATABASE_SCHEMA.md (Section 26)
- 04_RBAC_PERMISSIONS.md (Research.*)
- 05_API_SPECIFICATION.md (Section 20)
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
    ResearchAuthorSchema,
    ResearchItemCreate,
    ResearchItemResponse,
    ResearchItemUpdate,
    VALID_RESEARCH_CATEGORIES,
    VALID_RESEARCH_STATUSES,
    VALID_RESEARCH_VISIBILITIES,
    validate_safe_http_url,
)
from apps.api.src.services.event_service import event_service
from apps.api.src.services.project_service import project_service


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[-\s]+", "-", text)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class ResearchService:
    def __init__(self):
        self._items: Dict[str, Dict[str, Any]] = {}
        self._audit_logs: List[Dict[str, Any]] = []

        self._seed_initial_research()

    def _seed_initial_research(self):
        r1_id = "00000000-0000-0000-0000-000000000921"
        self._items[r1_id] = {
            "id": r1_id,
            "title": "Comparative Analysis of Lightweight Transformer Architectures for Edge Devices",
            "slug": "edge-transformer-architectures-oct",
            "abstract": "We evaluate quantization, pruning, and low-rank approximation methods for MobileBERT and TinyLlama deployed on Jetson Orin edge nodes in campus edge AI setups.",
            "authors": [
                {
                    "name": "Aman Sharma",
                    "enrollment_number": "0126AL221001",
                    "affiliation": "Oriental College of Technology, Bhopal",
                    "role": "Lead Researcher",
                },
                {
                    "name": "Club Research Group",
                    "enrollment_number": None,
                    "affiliation": "AIML Club OCT",
                    "role": "Collaborators",
                },
            ],
            "category": "AI_ML",
            "methodology": "Benchmarking inference latency, memory consumption, and perplexity across quantized models running TensorRT and ONNX Runtime.",
            "publication_url": "https://arxiv.org/abs/2401.00001",
            "repository_url": "https://github.com/aimlcluboct/edge-transformers",
            "dataset_url": "https://huggingface.co/datasets/aimlcluboct/campus-edge-benchmarks",
            "linked_event_id": "00000000-0000-0000-0000-000000000101",
            "linked_project_id": "00000000-0000-0000-0000-000000000901",
            "visibility": "PUBLIC",
            "status": "PUBLISHED",
            "created_by": "00000000-0000-0000-0000-000000000001",
            "published_at": "2026-03-15T10:00:00Z",
            "created_at": "2026-02-15T09:00:00Z",
            "updated_at": "2026-03-15T10:00:00Z",
        }

        r2_id = "00000000-0000-0000-0000-000000000922"
        self._items[r2_id] = {
            "id": r2_id,
            "title": "Federated Learning for Privacy-Preserving Student Assessment",
            "slug": "federated-learning-student-assessment",
            "abstract": "Investigation into decentralized model training for predictive learning analytics without consolidating private student grade transcripts into a central database.",
            "authors": [
                {
                    "name": "Student Member",
                    "enrollment_number": "0126AL221008",
                    "affiliation": "Oriental College of Technology, Bhopal",
                    "role": "Author",
                }
            ],
            "category": "AI_ML",
            "methodology": "Simulated federated averaging (FedAvg) with differential privacy guarantees using Flower framework.",
            "publication_url": None,
            "repository_url": "https://github.com/aimlcluboct/fed-student-assess",
            "dataset_url": None,
            "linked_event_id": None,
            "linked_project_id": None,
            "visibility": "PUBLIC",
            "status": "DRAFT",
            "created_by": "00000000-0000-0000-0000-000000000008",
            "published_at": None,
            "created_at": "2026-09-20T11:00:00Z",
            "updated_at": "2026-09-20T11:00:00Z",
        }

    # --------------------------------------------------------------------------
    # Formatting & Hydration
    # --------------------------------------------------------------------------
    def _format_research(self, item: Dict[str, Any]) -> ResearchItemResponse:
        ev_title = None
        if item.get("linked_event_id"):
            ev = event_service.get_event_by_id(item["linked_event_id"])
            if ev:
                ev_title = ev.title

        proj_title = None
        if item.get("linked_project_id"):
            proj = project_service.get_project_by_id(item["linked_project_id"])
            if proj:
                proj_title = proj.get("title")

        authors_list = [
            ResearchAuthorSchema(**a) if isinstance(a, dict) else a
            for a in item.get("authors", [])
        ]

        return ResearchItemResponse(
            id=item["id"],
            title=item["title"],
            slug=item["slug"],
            abstract=item["abstract"],
            authors=authors_list,
            category=item["category"],
            methodology=item.get("methodology"),
            publication_url=item.get("publication_url"),
            repository_url=item.get("repository_url"),
            dataset_url=item.get("dataset_url"),
            linked_event_id=item.get("linked_event_id"),
            linked_event_title=ev_title,
            linked_project_id=item.get("linked_project_id"),
            linked_project_title=proj_title,
            visibility=item["visibility"],
            status=item["status"],
            created_by=item.get("created_by"),
            published_at=item.get("published_at"),
            created_at=item["created_at"],
            updated_at=item["updated_at"],
        )

    def _is_item_visible_to_public(self, item: Dict[str, Any]) -> bool:
        return item.get("visibility") == "PUBLIC" and item.get("status") == "PUBLISHED"

    # --------------------------------------------------------------------------
    # Queries & CRUD Operations
    # --------------------------------------------------------------------------
    def list_research(
        self,
        category: Optional[str] = None,
        status_filter: Optional[str] = None,
        event_id: Optional[str] = None,
        search: Optional[str] = None,
        is_admin: bool = False,
        current_user: Optional[AuthenticatedUser] = None,
        page: int = 1,
        page_size: int = 25,
    ) -> Tuple[List[ResearchItemResponse], int]:
        all_items = list(self._items.values())

        filtered: List[Dict[str, Any]] = []
        for it in all_items:
            if is_admin:
                filtered.append(it)
            elif self._is_item_visible_to_public(it):
                filtered.append(it)
            elif current_user and it.get("created_by") == current_user.account_id:
                filtered.append(it)

        if category:
            cat_upper = category.upper().strip()
            filtered = [it for it in filtered if it.get("category", "").upper() == cat_upper]

        if status_filter:
            st_upper = status_filter.upper().strip()
            filtered = [it for it in filtered if it.get("status", "").upper() == st_upper]

        if event_id:
            filtered = [it for it in filtered if it.get("linked_event_id") == event_id]

        if search:
            q = search.lower().strip()
            filtered = [
                it for it in filtered
                if q in it.get("title", "").lower()
                or q in it.get("abstract", "").lower()
                or any(q in a.get("name", "").lower() for a in it.get("authors", []))
            ]

        filtered.sort(key=lambda x: x.get("created_at", ""), reverse=True)

        total = len(filtered)
        start = (page - 1) * page_size
        end = start + page_size
        paged = filtered[start:end]

        return [self._format_research(it) for it in paged], total

    def get_research_by_slug(
        self,
        slug: str,
        is_admin: bool = False,
        current_user: Optional[AuthenticatedUser] = None,
    ) -> ResearchItemResponse:
        item = next((it for it in self._items.values() if it["slug"] == slug), None)
        if not item:
            raise NotFoundException(f"Research item with slug '{slug}' not found.")

        if not is_admin:
            is_pub = self._is_item_visible_to_public(item)
            is_author = current_user and item.get("created_by") == current_user.account_id
            if not is_pub and not is_author:
                raise NotFoundException(f"Research item with slug '{slug}' not found.")

        return self._format_research(item)

    def create_research(
        self,
        payload: ResearchItemCreate,
        current_user: AuthenticatedUser,
    ) -> ResearchItemResponse:
        base_slug = payload.slug.strip() if payload.slug else _slugify(payload.title)
        slug = base_slug
        counter = 1
        while any(it["slug"] == slug for it in self._items.values()):
            counter += 1
            slug = f"{base_slug}-{counter}"

        is_staff = current_user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("research.*", current_user.permissions)
        # Non-staff default to DRAFT
        status_val = payload.status if is_staff else "DRAFT"
        now = _now_iso()
        published_at = now if (is_staff and status_val == "PUBLISHED") else None

        pub_url = validate_safe_http_url(payload.publication_url)
        repo_url = validate_safe_http_url(payload.repository_url)
        ds_url = validate_safe_http_url(payload.dataset_url)

        new_id = str(uuid.uuid4())
        authors_data = [a.model_dump() for a in payload.authors]

        record = {
            "id": new_id,
            "title": payload.title.strip(),
            "slug": slug,
            "abstract": payload.abstract.strip(),
            "authors": authors_data,
            "category": payload.category,
            "methodology": payload.methodology.strip() if payload.methodology else None,
            "publication_url": pub_url,
            "repository_url": repo_url,
            "dataset_url": ds_url,
            "linked_event_id": payload.linked_event_id,
            "linked_project_id": payload.linked_project_id,
            "visibility": payload.visibility,
            "status": status_val,
            "created_by": current_user.account_id,
            "published_at": published_at,
            "created_at": now,
            "updated_at": now,
        }

        self._items[new_id] = record
        return self._format_research(record)

    def update_research(
        self,
        research_id: str,
        payload: ResearchItemUpdate,
        current_user: AuthenticatedUser,
    ) -> ResearchItemResponse:
        item = self._items.get(research_id)
        if not item:
            raise NotFoundException(f"Research item with ID '{research_id}' not found.")

        is_staff = current_user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("research.*", current_user.permissions)
        is_creator = item.get("created_by") == current_user.account_id

        if not is_staff and not is_creator:
            raise PermissionDeniedException("Only the author or club content managers can edit this research item.")

        if not is_staff and item["status"] != "DRAFT":
            raise PermissionDeniedException("Authors can only edit research items in DRAFT status. Contact staff for updates to published items.")

        if payload.slug and payload.slug != item["slug"]:
            clean_slug = _slugify(payload.slug)
            if any(it["id"] != research_id and it["slug"] == clean_slug for it in self._items.values()):
                raise ConflictException(f"Research slug '{clean_slug}' is already taken.")
            item["slug"] = clean_slug

        if payload.title is not None:
            item["title"] = payload.title.strip()
        if payload.abstract is not None:
            item["abstract"] = payload.abstract.strip()
        if payload.authors is not None:
            item["authors"] = [a.model_dump() for a in payload.authors]
        if payload.category is not None:
            item["category"] = payload.category
        if payload.methodology is not None:
            item["methodology"] = payload.methodology.strip()

        if payload.publication_url is not None:
            item["publication_url"] = validate_safe_http_url(payload.publication_url)
        if payload.repository_url is not None:
            item["repository_url"] = validate_safe_http_url(payload.repository_url)
        if payload.dataset_url is not None:
            item["dataset_url"] = validate_safe_http_url(payload.dataset_url)

        if payload.linked_event_id is not None:
            item["linked_event_id"] = payload.linked_event_id
        if payload.linked_project_id is not None:
            item["linked_project_id"] = payload.linked_project_id

        if payload.visibility is not None:
            item["visibility"] = payload.visibility

        if payload.status is not None:
            if not is_staff and payload.status != item["status"]:
                raise PermissionDeniedException("Only content managers or admins can publish or archive research.")
            item["status"] = payload.status
            if payload.status == "PUBLISHED" and not item.get("published_at"):
                item["published_at"] = _now_iso()

        item["updated_at"] = _now_iso()
        return self._format_research(item)

    def archive_research(
        self,
        research_id: str,
        current_user: AuthenticatedUser,
    ) -> ResearchItemResponse:
        item = self._items.get(research_id)
        if not item:
            raise NotFoundException(f"Research item with ID '{research_id}' not found.")

        is_staff = current_user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("research.*", current_user.permissions)
        if not is_staff:
            raise PermissionDeniedException("Only administrators can archive research items.")

        item["status"] = "ARCHIVED"
        item["visibility"] = "HIDDEN"
        item["updated_at"] = _now_iso()
        return self._format_research(item)

    def publish_research(
        self,
        research_id: str,
        current_user: AuthenticatedUser,
    ) -> ResearchItemResponse:
        item = self._items.get(research_id)
        if not item:
            raise NotFoundException(f"Research item with ID '{research_id}' not found.")

        is_staff = current_user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("research.*", current_user.permissions)
        if not is_staff:
            raise PermissionDeniedException("Only content managers or administrators can publish research.")

        item["status"] = "PUBLISHED"
        item["visibility"] = "PUBLIC"
        item["published_at"] = _now_iso()
        item["updated_at"] = _now_iso()
        return self._format_research(item)


# Global singleton instance
research_service = ResearchService()
