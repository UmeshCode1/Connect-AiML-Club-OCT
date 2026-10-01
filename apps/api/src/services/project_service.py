"""
AIML CLUB OCT — CONNECT
Projects Domain Service & Knowledge Engine

Specification Reference:
- 01_PRODUCT_REQUIREMENTS.md (Section 19)
- 03_DATABASE_SCHEMA.md (Section 24, 25)
- 04_RBAC_PERMISSIONS.md (Projects.*)
- 05_API_SPECIFICATION.md (Section 19)
- 11_SECURITY_PRIVACY.md (URL Sanitization, Granular RBAC)
"""

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Set

from apps.api.src.core.errors import (
    BadRequestException,
    ConflictException,
    NotFoundException,
    PermissionDeniedException,
)
from apps.api.src.core.security import AuthenticatedUser, check_permission_match
from apps.api.src.schemas.knowledge import (
    ProjectCreate,
    ProjectMemberCreate,
    ProjectMemberResponse,
    ProjectResponse,
    ProjectUpdate,
    VALID_PROJECT_MEMBER_ROLES,
    VALID_PROJECT_STATUSES,
    VALID_PROJECT_VISIBILITIES,
    validate_safe_http_url,
)
from apps.api.src.services.event_service import event_service


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[-\s]+", "-", text)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ------------------------------------------------------------------------------
# Project Lifecycle State Machine
# ------------------------------------------------------------------------------

ALLOWED_PROJECT_TRANSITIONS: Dict[str, Set[str]] = {
    "IDEA": {"IN_DEVELOPMENT", "ARCHIVED"},
    "IN_DEVELOPMENT": {"COMPLETED", "ARCHIVED", "IDEA"},
    "COMPLETED": {"IN_DEVELOPMENT", "ARCHIVED"},
    "ARCHIVED": set(),  # Regular operators cannot resurrect an archived project
}

SUPER_ADMIN_PROJECT_REVERSIBLE: Set[str] = {"ARCHIVED"}


def validate_project_lifecycle_transition(
    current_status: str,
    target_status: str,
    is_super_admin: bool = False,
) -> bool:
    if current_status not in ALLOWED_PROJECT_TRANSITIONS:
        raise BadRequestException(f"Unknown current project status: '{current_status}'.")

    if target_status not in VALID_PROJECT_STATUSES:
        raise BadRequestException(
            f"Unknown target project status: '{target_status}'. Must be one of {sorted(VALID_PROJECT_STATUSES)}"
        )

    if current_status == target_status:
        return True

    allowed = ALLOWED_PROJECT_TRANSITIONS[current_status]
    if target_status in allowed:
        return True

    if is_super_admin and current_status in SUPER_ADMIN_PROJECT_REVERSIBLE:
        return True

    raise BadRequestException(
        f"Invalid project lifecycle transition from '{current_status}' to '{target_status}'. "
        f"Allowed transitions from '{current_status}' are: {sorted(list(allowed)) or ['None (Terminal)']}"
    )


class ProjectService:
    def __init__(self):
        self._projects: Dict[str, Dict[str, Any]] = {}
        self._members: Dict[str, Dict[str, Any]] = {}  # member_id -> member_dict
        self._audit_logs: List[Dict[str, Any]] = []

        self._seed_initial_projects()

    def _seed_initial_projects(self):
        # Project 1: Completed Flagship Project
        p1_id = "00000000-0000-0000-0000-000000000901"
        self._projects[p1_id] = {
            "id": p1_id,
            "title": "OCT Vision AI: Smart Campus Surveillance",
            "slug": "oct-vision-ai-campus",
            "summary": "Edge-computed real-time student safety and campus monitoring using YOLOv8 and Jetson nano nodes.",
            "description": "Comprehensive vision AI platform deployed at Oriental College of Technology, detecting safety anomalies and parking congestion using local neural edge inferencing.",
            "status": "COMPLETED",
            "technology_stack": ["Python", "PyTorch", "YOLOv8", "OpenCV", "FastAPI"],
            "repository_url": "https://github.com/aimlcluboct/oct-vision-ai",
            "demo_url": "https://vision.aimlcluboct.in",
            "documentation_url": "https://docs.aimlcluboct.in/projects/vision-ai",
            "cover_media_id": None,
            "linked_event_id": "00000000-0000-0000-0000-000000000101",
            "visibility": "PUBLIC",
            "is_featured": True,
            "created_by": "00000000-0000-0000-0000-000000000001",
            "published_at": "2026-03-10T10:00:00Z",
            "created_at": "2026-02-01T09:00:00Z",
            "updated_at": "2026-03-10T10:00:00Z",
        }

        # Seed Member for Project 1
        m1_id = "00000000-0000-0000-0000-000000000951"
        self._members[m1_id] = {
            "id": m1_id,
            "project_id": p1_id,
            "student_id": "00000000-0000-0000-0000-000000000301",
            "role": "LEAD",
            "display_order": 0,
            "created_at": "2026-02-01T09:00:00Z",
            "student_full_name": "Aman Sharma",
            "student_enrollment_number": "0126AL221001",
            "student_avatar_url": None,
        }

        # Project 2: In-Development Project
        p2_id = "00000000-0000-0000-0000-000000000902"
        self._projects[p2_id] = {
            "id": p2_id,
            "title": "Aptify Recommendation Engine",
            "slug": "aptify-recommendation-engine",
            "summary": "Graph-based hybrid workshop and session recommendation engine for Aptify symposium participants.",
            "description": "Collaborative filtering and LLM semantic embeddings engine personalizing workshop schedules according to student skill level.",
            "status": "IN_DEVELOPMENT",
            "technology_stack": ["Python", "FastAPI", "PostgreSQL", "pgvector"],
            "repository_url": "https://github.com/aimlcluboct/aptify-recs",
            "demo_url": None,
            "documentation_url": None,
            "cover_media_id": None,
            "linked_event_id": "00000000-0000-0000-0000-000000000101",
            "visibility": "PUBLIC",
            "is_featured": False,
            "created_by": "00000000-0000-0000-0000-000000000008",
            "published_at": "2026-09-15T12:00:00Z",
            "created_at": "2026-09-01T10:00:00Z",
            "updated_at": "2026-09-15T12:00:00Z",
        }

        m2_id = "00000000-0000-0000-0000-000000000952"
        self._members[m2_id] = {
            "id": m2_id,
            "project_id": p2_id,
            "student_id": "00000000-0000-0000-0000-000000000008",
            "role": "LEAD",
            "display_order": 0,
            "created_at": "2026-09-01T10:00:00Z",
            "student_full_name": "Student Member",
            "student_enrollment_number": "0126AL221008",
            "student_avatar_url": None,
        }

        # Project 3: Internal Idea (Hidden/Team Only)
        p3_id = "00000000-0000-0000-0000-000000000903"
        self._projects[p3_id] = {
            "id": p3_id,
            "title": "Club Neural Hardware Farm",
            "slug": "club-neural-hardware-farm",
            "summary": "Internal distributed cluster orchestration across lab workstations.",
            "description": "High-throughput cluster setup orchestrating Ray clusters across OCT computer lab machines for multi-GPU training.",
            "status": "IDEA",
            "technology_stack": ["Linux", "Kubernetes", "Ray", "Slurm"],
            "repository_url": "https://github.com/aimlcluboct/cluster-infra",
            "demo_url": None,
            "documentation_url": None,
            "cover_media_id": None,
            "linked_event_id": None,
            "visibility": "TEAM_ONLY",
            "is_featured": False,
            "created_by": "00000000-0000-0000-0000-000000000001",
            "published_at": None,
            "created_at": "2026-08-20T08:00:00Z",
            "updated_at": "2026-08-20T08:00:00Z",
        }

    # --------------------------------------------------------------------------
    # Formatting & Hydration
    # --------------------------------------------------------------------------
    def _format_project(self, project: Dict[str, Any]) -> ProjectResponse:
        members = [
            ProjectMemberResponse(
                id=m["id"],
                project_id=m["project_id"],
                student_id=m["student_id"],
                role=m["role"],
                display_order=m.get("display_order", 0),
                created_at=m.get("created_at", _now_iso()),
                student_full_name=m.get("student_full_name"),
                student_enrollment_number=m.get("student_enrollment_number"),
                student_avatar_url=m.get("student_avatar_url"),
            )
            for m in self._members.values()
            if m["project_id"] == project["id"]
        ]
        members.sort(key=lambda x: (0 if x.role == "LEAD" else 1, x.display_order))

        ev_title = None
        ev_slug = None
        if project.get("linked_event_id"):
            ev = event_service.get_event_by_id(project["linked_event_id"])
            if ev:
                ev_title = ev.title
                ev_slug = ev.slug

        return ProjectResponse(
            id=project["id"],
            title=project["title"],
            slug=project["slug"],
            summary=project["summary"],
            description=project["description"],
            status=project["status"],
            technology_stack=project.get("technology_stack", []),
            repository_url=project.get("repository_url"),
            demo_url=project.get("demo_url"),
            documentation_url=project.get("documentation_url"),
            cover_media_id=project.get("cover_media_id"),
            cover_media_url=None,
            linked_event_id=project.get("linked_event_id"),
            linked_event_title=ev_title,
            linked_event_slug=ev_slug,
            visibility=project["visibility"],
            is_featured=project.get("is_featured", False),
            created_by=project.get("created_by"),
            published_at=project.get("published_at"),
            created_at=project["created_at"],
            updated_at=project["updated_at"],
            members=members,
        )

    def _is_project_visible_to_public(self, project: Dict[str, Any]) -> bool:
        if project.get("visibility") != "PUBLIC":
            return False
        if project.get("status") not in ("IN_DEVELOPMENT", "COMPLETED"):
            return False
        pub_at = project.get("published_at")
        if pub_at and pub_at > _now_iso():
            return False
        return True

    def _is_user_project_member(self, project_id: str, current_user: Optional[AuthenticatedUser]) -> bool:
        if not current_user:
            return False
        for m in self._members.values():
            if m["project_id"] == project_id and (
                m["student_id"] == current_user.account_id
                or m["student_id"] == current_user.auth_user_id
            ):
                return True
        return False

    def _is_user_project_lead(self, project_id: str, current_user: Optional[AuthenticatedUser]) -> bool:
        if not current_user:
            return False
        for m in self._members.values():
            if m["project_id"] == project_id and (
                m["student_id"] == current_user.account_id
                or m["student_id"] == current_user.auth_user_id
            ) and m.get("role") == "LEAD":
                return True
        return False

    # --------------------------------------------------------------------------
    # Queries & CRUD Operations
    # --------------------------------------------------------------------------
    def list_projects(
        self,
        status_filter: Optional[str] = None,
        tag: Optional[str] = None,
        event_id: Optional[str] = None,
        is_featured: Optional[bool] = None,
        search: Optional[str] = None,
        is_admin: bool = False,
        current_user: Optional[AuthenticatedUser] = None,
        page: int = 1,
        page_size: int = 25,
    ) -> Tuple[List[ProjectResponse], int]:
        all_projects = list(self._projects.values())

        # Visibility filter
        filtered: List[Dict[str, Any]] = []
        for p in all_projects:
            if is_admin:
                filtered.append(p)
            elif self._is_project_visible_to_public(p):
                filtered.append(p)
            elif current_user and (
                p.get("created_by") == current_user.account_id
                or self._is_user_project_member(p["id"], current_user)
            ):
                filtered.append(p)

        # Filters
        if status_filter:
            filtered = [p for p in filtered if p.get("status", "").upper() == status_filter.upper()]

        if tag:
            tag_lower = tag.lower().strip()
            filtered = [
                p for p in filtered
                if any(t.lower() == tag_lower for t in p.get("technology_stack", []))
            ]

        if event_id:
            filtered = [p for p in filtered if p.get("linked_event_id") == event_id]

        if is_featured is not None:
            filtered = [p for p in filtered if p.get("is_featured") == is_featured]

        if search:
            q = search.lower().strip()
            filtered = [
                p for p in filtered
                if q in p.get("title", "").lower()
                or q in p.get("summary", "").lower()
                or any(q in t.lower() for t in p.get("technology_stack", []))
            ]

        # Sorting: newest first
        filtered.sort(key=lambda x: x.get("created_at", ""), reverse=True)

        total = len(filtered)
        start = (page - 1) * page_size
        end = start + page_size
        paged = filtered[start:end]

        return [self._format_project(p) for p in paged], total

    def get_project_by_slug(
        self,
        slug: str,
        is_admin: bool = False,
        current_user: Optional[AuthenticatedUser] = None,
    ) -> ProjectResponse:
        project = next((p for p in self._projects.values() if p["slug"] == slug), None)
        if not project:
            raise NotFoundException(f"Project with slug '{slug}' not found.")

        # Security & authorization boundary: prevent IDOR/information leakage
        if not is_admin:
            is_visible = self._is_project_visible_to_public(project)
            is_member = current_user and (
                project.get("created_by") == current_user.account_id
                or self._is_user_project_member(project["id"], current_user)
            )
            if not is_visible and not is_member:
                raise NotFoundException(f"Project with slug '{slug}' not found.")

        return self._format_project(project)

    def get_project_by_id(self, project_id: str) -> Optional[Dict[str, Any]]:
        return self._projects.get(project_id)

    def create_project(
        self,
        payload: ProjectCreate,
        current_user: AuthenticatedUser,
    ) -> ProjectResponse:
        # Generate slug if omitted
        base_slug = payload.slug.strip() if payload.slug else _slugify(payload.title)
        slug = base_slug
        counter = 1
        while any(p["slug"] == slug for p in self._projects.values()):
            counter += 1
            slug = f"{base_slug}-{counter}"

        # Status validation: Students cannot directly publish or mark completed
        is_staff = current_user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("projects.*", current_user.permissions)
        status_val = payload.status
        if not is_staff:
            if status_val not in ("IDEA", "IN_DEVELOPMENT"):
                status_val = "IN_DEVELOPMENT"

        # Validate URLs
        repo_url = validate_safe_http_url(payload.repository_url)
        demo_url = validate_safe_http_url(payload.demo_url)
        doc_url = validate_safe_http_url(payload.documentation_url)

        new_id = str(uuid.uuid4())
        now = _now_iso()

        published_at = now if (is_staff and payload.visibility == "PUBLIC" and status_val in ("IN_DEVELOPMENT", "COMPLETED")) else None

        project_record = {
            "id": new_id,
            "title": payload.title.strip(),
            "slug": slug,
            "summary": payload.summary.strip(),
            "description": payload.description.strip(),
            "status": status_val,
            "technology_stack": payload.technology_stack,
            "repository_url": repo_url,
            "demo_url": demo_url,
            "documentation_url": doc_url,
            "cover_media_id": payload.cover_media_id,
            "linked_event_id": payload.linked_event_id,
            "visibility": payload.visibility,
            "is_featured": payload.is_featured if is_staff else False,
            "created_by": current_user.account_id,
            "published_at": published_at,
            "created_at": now,
            "updated_at": now,
        }

        self._projects[new_id] = project_record

        # Automatically record creator as LEAD in project_members
        creator_member_id = str(uuid.uuid4())
        self._members[creator_member_id] = {
            "id": creator_member_id,
            "project_id": new_id,
            "student_id": current_user.account_id,
            "role": "LEAD",
            "display_order": 0,
            "created_at": now,
            "student_full_name": current_user.email.split("@")[0].replace(".", " ").title() if current_user.email else "Project Creator",
            "student_enrollment_number": None,
            "student_avatar_url": None,
        }

        # Add optional additional members
        if payload.member_student_ids:
            for s_id in payload.member_student_ids:
                if s_id != current_user.account_id:
                    add_id = str(uuid.uuid4())
                    self._members[add_id] = {
                        "id": add_id,
                        "project_id": new_id,
                        "student_id": s_id,
                        "role": "CONTRIBUTOR",
                        "display_order": 1,
                        "created_at": now,
                        "student_full_name": None,
                        "student_enrollment_number": None,
                        "student_avatar_url": None,
                    }

        return self._format_project(project_record)

    def update_project(
        self,
        project_id: str,
        payload: ProjectUpdate,
        current_user: AuthenticatedUser,
    ) -> ProjectResponse:
        project = self._projects.get(project_id)
        if not project:
            raise NotFoundException(f"Project with ID '{project_id}' not found.")

        # Check authorization: staff OR project LEAD
        is_staff = current_user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("projects.*", current_user.permissions)
        is_lead = self._is_user_project_lead(project_id, current_user) or (project.get("created_by") == current_user.account_id)

        if not is_staff and not is_lead:
            raise PermissionDeniedException("Only designated project leads or club staff can modify this project.")

        # Lifecycle transition check
        if payload.status and payload.status != project["status"]:
            is_super = current_user.role == "SUPER_ADMIN"
            validate_project_lifecycle_transition(project["status"], payload.status, is_super_admin=is_super)
            # Only staff can transition directly to ARCHIVED
            if payload.status == "ARCHIVED" and not is_staff:
                raise PermissionDeniedException("Only club administrators can archive projects.")
            project["status"] = payload.status

        # Slug uniqueness check if updated
        if payload.slug and payload.slug != project["slug"]:
            clean_slug = _slugify(payload.slug)
            if any(p["id"] != project_id and p["slug"] == clean_slug for p in self._projects.values()):
                raise ConflictException(f"Project slug '{clean_slug}' is already taken.")
            project["slug"] = clean_slug

        if payload.title is not None:
            project["title"] = payload.title.strip()
        if payload.summary is not None:
            project["summary"] = payload.summary.strip()
        if payload.description is not None:
            project["description"] = payload.description.strip()
        if payload.technology_stack is not None:
            project["technology_stack"] = payload.technology_stack

        if payload.repository_url is not None:
            project["repository_url"] = validate_safe_http_url(payload.repository_url)
        if payload.demo_url is not None:
            project["demo_url"] = validate_safe_http_url(payload.demo_url)
        if payload.documentation_url is not None:
            project["documentation_url"] = validate_safe_http_url(payload.documentation_url)

        if payload.cover_media_id is not None:
            project["cover_media_id"] = payload.cover_media_id
        if payload.linked_event_id is not None:
            project["linked_event_id"] = payload.linked_event_id

        if payload.visibility is not None:
            project["visibility"] = payload.visibility

        if payload.is_featured is not None and is_staff:
            project["is_featured"] = payload.is_featured

        project["updated_at"] = _now_iso()
        return self._format_project(project)

    def archive_project(
        self,
        project_id: str,
        current_user: AuthenticatedUser,
    ) -> ProjectResponse:
        project = self._projects.get(project_id)
        if not project:
            raise NotFoundException(f"Project with ID '{project_id}' not found.")

        is_staff = current_user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("projects.*", current_user.permissions)
        if not is_staff:
            raise PermissionDeniedException("Only club administrators can archive projects.")

        validate_project_lifecycle_transition(project["status"], "ARCHIVED", is_super_admin=(current_user.role == "SUPER_ADMIN"))
        project["status"] = "ARCHIVED"
        project["visibility"] = "HIDDEN"
        project["updated_at"] = _now_iso()

        return self._format_project(project)

    def publish_project(
        self,
        project_id: str,
        current_user: AuthenticatedUser,
    ) -> ProjectResponse:
        project = self._projects.get(project_id)
        if not project:
            raise NotFoundException(f"Project with ID '{project_id}' not found.")

        is_staff = current_user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("projects.*", current_user.permissions)
        if not is_staff:
            raise PermissionDeniedException("Only club administrators or content managers can publish projects.")

        if project["status"] == "IDEA":
            project["status"] = "IN_DEVELOPMENT"

        project["visibility"] = "PUBLIC"
        project["published_at"] = _now_iso()
        project["updated_at"] = _now_iso()

        return self._format_project(project)

    # --------------------------------------------------------------------------
    # Project Members Management
    # --------------------------------------------------------------------------
    def add_project_member(
        self,
        project_id: str,
        payload: ProjectMemberCreate,
        current_user: AuthenticatedUser,
    ) -> ProjectMemberResponse:
        project = self._projects.get(project_id)
        if not project:
            raise NotFoundException(f"Project with ID '{project_id}' not found.")

        is_staff = current_user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("projects.*", current_user.permissions)
        is_lead = self._is_user_project_lead(project_id, current_user) or (project.get("created_by") == current_user.account_id)

        if not is_staff and not is_lead:
            raise PermissionDeniedException("Only project leads or staff can manage project members.")

        # Check duplicate membership (project_id, student_id)
        for m in self._members.values():
            if m["project_id"] == project_id and m["student_id"] == payload.student_id:
                raise ConflictException("Student is already registered as a member of this project.")

        role = payload.role.upper()
        if role not in VALID_PROJECT_MEMBER_ROLES:
            raise BadRequestException(f"Invalid member role: '{payload.role}'. Must be one of {sorted(VALID_PROJECT_MEMBER_ROLES)}")

        new_mid = str(uuid.uuid4())
        now = _now_iso()

        record = {
            "id": new_mid,
            "project_id": project_id,
            "student_id": payload.student_id,
            "role": role,
            "display_order": payload.display_order,
            "created_at": now,
            "student_full_name": None,
            "student_enrollment_number": None,
            "student_avatar_url": None,
        }
        self._members[new_mid] = record

        return ProjectMemberResponse(**record)

    def remove_project_member(
        self,
        project_id: str,
        student_id: str,
        current_user: AuthenticatedUser,
    ) -> Dict[str, Any]:
        project = self._projects.get(project_id)
        if not project:
            raise NotFoundException(f"Project with ID '{project_id}' not found.")

        is_staff = current_user.role in ("SUPER_ADMIN", "CLUB_ADMIN", "CONTENT_MANAGER") or check_permission_match("projects.*", current_user.permissions)
        is_lead = self._is_user_project_lead(project_id, current_user) or (project.get("created_by") == current_user.account_id)

        if not is_staff and not is_lead:
            raise PermissionDeniedException("Only project leads or staff can remove project members.")

        target_member_id = None
        target_role = None
        for mid, m in self._members.items():
            if m["project_id"] == project_id and m["student_id"] == student_id:
                target_member_id = mid
                target_role = m.get("role")
                break

        if not target_member_id:
            raise NotFoundException("Member not found on this project.")

        # Prevent removing the only LEAD
        if target_role == "LEAD":
            leads = [
                m for m in self._members.values()
                if m["project_id"] == project_id and m.get("role") == "LEAD"
            ]
            if len(leads) <= 1:
                raise BadRequestException("Cannot remove the sole project LEAD. Promote another member to LEAD first.")

        del self._members[target_member_id]
        return {"status": "SUCCESS", "message": f"Member {student_id} removed from project."}

    def list_project_members(
        self,
        project_id: str,
        is_admin: bool = False,
        current_user: Optional[AuthenticatedUser] = None,
    ) -> List[ProjectMemberResponse]:
        project = self._projects.get(project_id)
        if not project:
            raise NotFoundException(f"Project with ID '{project_id}' not found.")

        if not is_admin and not self._is_project_visible_to_public(project):
            if not current_user or not self._is_user_project_member(project_id, current_user):
                raise NotFoundException(f"Project with ID '{project_id}' not found.")

        members = [
            ProjectMemberResponse(**m)
            for m in self._members.values()
            if m["project_id"] == project_id
        ]
        members.sort(key=lambda x: (0 if x.role == "LEAD" else 1, x.display_order))
        return members


# Global singleton instance
project_service = ProjectService()
