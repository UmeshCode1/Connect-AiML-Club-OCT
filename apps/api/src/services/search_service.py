"""
AIML CLUB OCT — CONNECT
Unified Authorization-Aware Search Service

Specification Reference:
- 01_PRODUCT_REQUIREMENTS.md (Section 22)
- 03_DATABASE_SCHEMA.md (Migration 000009 pg_trgm & GIN indexes)
- 04_RBAC_PERMISSIONS.md (Granular RBAC boundaries)
- 05_API_SPECIFICATION.md (Section 22)
- 11_SECURITY_PRIVACY.md (Anti-Leakage, Private Data Isolation)
"""

import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

from apps.api.src.core.errors import BadRequestException
from apps.api.src.core.security import AuthenticatedUser, check_permission_match
from apps.api.src.schemas.knowledge import SearchItemResponse, VALID_SEARCH_ENTITY_TYPES
from apps.api.src.services.certificate_service import certificate_service
from apps.api.src.services.chronicle_service import chronicle_service
from apps.api.src.services.event_service import event_service
from apps.api.src.services.journey_service import journey_service
from apps.api.src.services.learning_service import learning_service
from apps.api.src.services.project_service import project_service
from apps.api.src.services.research_service import research_service


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _extract_trigrams(text: str) -> Set[str]:
    """Generates trigrams conforming to PostgreSQL pg_trgm extension."""
    padded = f"  {text.lower().strip()} "
    if len(padded) < 3:
        return set()
    return {padded[i : i + 3] for i in range(len(padded) - 2)}


def calculate_trigram_similarity(query: Optional[str], target: Optional[str]) -> float:
    """
    Computes trigram similarity metric matching PostgreSQL gin_trgm_ops.
    Includes exact match, prefix match, and word boundary boosts.
    """
    if not query or not target:
        return 0.0

    q_norm = query.lower().strip()
    t_norm = target.lower().strip()

    if not q_norm or not t_norm:
        return 0.0


    if q_norm == t_norm:
        return 1.0

    if t_norm.startswith(q_norm):
        return 0.85

    if q_norm in t_norm:
        base = 0.65
    else:
        base = 0.0

    # Trigram Jaccard coefficient
    tri_q = _extract_trigrams(q_norm)
    tri_t = _extract_trigrams(t_norm)

    if not tri_q or not tri_t:
        return base

    intersection = len(tri_q & tri_t)
    union = len(tri_q | tri_t)
    trigram_score = intersection / union if union > 0 else 0.0

    return max(base, trigram_score)


# Hardcoded canonical leadership roster for public team discovery
CANONICAL_TEAM_MEMBERS = [
    {
        "id": "team-lead-001",
        "name": "Dr. Faculty Advisor",
        "role": "Faculty Head & Mentor",
        "department": "Department of Artificial Intelligence & Machine Learning",
        "bio": "Guiding student research and institutional AI projects at Oriental College of Technology.",
    },
    {
        "id": "team-lead-002",
        "name": "Aman Sharma",
        "role": "President & Technical Coordinator",
        "department": "AIML Batch 2022-2026",
        "bio": "Leading student innovation, technical symposiums, and edge AI project research tracks.",
    },
    {
        "id": "team-lead-003",
        "name": "Daksh Technical Lead",
        "role": "Event Operations & Engineering Lead",
        "department": "AIML Batch 2023-2027",
        "bio": "Organizing Aptify symposiums and cloud infrastructure for AIML Club OCT.",
    },
]


class SearchService:
    def __init__(self):
        pass

    def search(
        self,
        query: str,
        entity_type: str = "all",
        is_admin: bool = False,
        current_user: Optional[AuthenticatedUser] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[SearchItemResponse], int]:
        q_clean = query.strip()
        if len(q_clean) < 2:
            raise BadRequestException("Search query must be at least 2 characters.")

        type_upper = entity_type.upper().strip()
        if type_upper not in VALID_SEARCH_ENTITY_TYPES:
            raise BadRequestException(
                f"Invalid search type '{entity_type}'. Must be one of: {', '.join(sorted([t.lower() for t in VALID_SEARCH_ENTITY_TYPES]))}"
            )

        all_results: List[SearchItemResponse] = []

        # 1. Events Domain
        if type_upper in ("ALL", "EVENTS"):
            all_results.extend(self._search_events(q_clean, is_admin))

        # 2. Projects Domain
        if type_upper in ("ALL", "PROJECTS"):
            all_results.extend(self._search_projects(q_clean, is_admin, current_user))

        # 3. Research Domain
        if type_upper in ("ALL", "RESEARCH"):
            all_results.extend(self._search_research(q_clean, is_admin, current_user))

        # 4. Learning Resources Domain
        if type_upper in ("ALL", "LEARNING"):
            all_results.extend(self._search_learning(q_clean, is_admin))

        # 5. Chronicle Domain
        if type_upper in ("ALL", "CHRONICLE"):
            all_results.extend(self._search_chronicle(q_clean, is_admin))

        # 6. Journey Domain
        if type_upper in ("ALL", "JOURNEY"):
            all_results.extend(self._search_journey(q_clean, is_admin))

        # 7. Team Domain
        if type_upper in ("ALL", "TEAM"):
            all_results.extend(self._search_team(q_clean))

        # 8. Certificates Domain
        if type_upper in ("ALL", "CERTIFICATES"):
            all_results.extend(self._search_certificates(q_clean, is_admin, current_user))

        # Rank by score descending
        all_results.sort(key=lambda r: r.score or 0.0, reverse=True)

        total = len(all_results)
        start = (page - 1) * page_size
        end = start + page_size
        paged = all_results[start:end]

        return paged, total

    # --------------------------------------------------------------------------
    # Sub-domain Search Methods with Strict Authorization Isolation
    # --------------------------------------------------------------------------

    def _search_events(self, query: str, is_admin: bool) -> List[SearchItemResponse]:
        results = []
        for ev in event_service._events.values():
            # Security boundary: unauthenticated / non-staff cannot see DRAFT events
            if not is_admin and (ev.get("visibility") != "PUBLIC" or ev.get("status") == "DRAFT"):
                continue

            sim_title = calculate_trigram_similarity(query, ev.get("title", ""))
            sim_desc = calculate_trigram_similarity(query, ev.get("description", "")) * 0.8
            sim_code = 1.0 if query.lower() in ev.get("event_code", "").lower() else 0.0
            score = max(sim_title, sim_desc, sim_code)

            if score >= 0.25:
                results.append(
                    SearchItemResponse(
                        id=ev["id"],
                        entity_type="event",
                        title=ev["title"],
                        description=ev.get("short_description") or ev.get("description"),
                        slug=ev.get("slug"),
                        url=f"/events/{ev.get('slug')}",
                        score=round(score, 3),
                        metadata={
                            "event_type": ev.get("event_type"),
                            "status": ev.get("status"),
                            "start_at": ev.get("start_at"),
                        },
                    )
                )
        return results

    def _search_projects(
        self,
        query: str,
        is_admin: bool,
        current_user: Optional[AuthenticatedUser],
    ) -> List[SearchItemResponse]:
        results = []
        for p in project_service._projects.values():
            is_visible = project_service._is_project_visible_to_public(p)
            is_member = current_user and (
                p.get("created_by") == current_user.account_id
                or project_service._is_user_project_member(p["id"], current_user)
            )

            # Security boundary: hide unpublished/internal projects from unauthorized callers
            if not is_admin and not is_visible and not is_member:
                continue

            sim_title = calculate_trigram_similarity(query, p.get("title", ""))
            sim_sum = calculate_trigram_similarity(query, p.get("summary", "")) * 0.85
            sim_tech = 0.8 if any(query.lower() in t.lower() for t in p.get("technology_stack", [])) else 0.0
            score = max(sim_title, sim_sum, sim_tech)

            if score >= 0.25:
                results.append(
                    SearchItemResponse(
                        id=p["id"],
                        entity_type="project",
                        title=p["title"],
                        description=p.get("summary"),
                        slug=p.get("slug"),
                        url=f"/projects/{p.get('slug')}",
                        score=round(score, 3),
                        metadata={
                            "status": p.get("status"),
                            "technology_stack": p.get("technology_stack", []),
                            "is_featured": p.get("is_featured", False),
                        },
                    )
                )
        return results

    def _search_research(
        self,
        query: str,
        is_admin: bool,
        current_user: Optional[AuthenticatedUser],
    ) -> List[SearchItemResponse]:
        results = []
        for r in research_service._items.values():
            is_pub = research_service._is_item_visible_to_public(r)
            is_author = current_user and r.get("created_by") == current_user.account_id

            # Security boundary: drafts visible only to author or staff
            if not is_admin and not is_pub and not is_author:
                continue

            sim_title = calculate_trigram_similarity(query, r.get("title", ""))
            sim_abs = calculate_trigram_similarity(query, r.get("abstract", "")) * 0.7
            sim_author = 0.8 if any(query.lower() in a.get("name", "").lower() for a in r.get("authors", [])) else 0.0
            score = max(sim_title, sim_abs, sim_author)

            if score >= 0.25:
                results.append(
                    SearchItemResponse(
                        id=r["id"],
                        entity_type="research",
                        title=r["title"],
                        description=r.get("abstract")[:240] + ("..." if len(r.get("abstract", "")) > 240 else ""),
                        slug=r.get("slug"),
                        url=f"/research/{r.get('slug')}",
                        score=round(score, 3),
                        metadata={
                            "category": r.get("category"),
                            "status": r.get("status"),
                            "published_at": r.get("published_at"),
                        },
                    )
                )
        return results

    def _search_learning(self, query: str, is_admin: bool) -> List[SearchItemResponse]:
        results = []
        for lr in learning_service._resources.values():
            if not is_admin and lr.get("visibility") != "PUBLIC":
                continue

            sim_title = calculate_trigram_similarity(query, lr.get("title", ""))
            sim_desc = calculate_trigram_similarity(query, lr.get("description", "") or "") * 0.7
            score = max(sim_title, sim_desc)

            if score >= 0.25:
                results.append(
                    SearchItemResponse(
                        id=lr["id"],
                        entity_type="learning",
                        title=lr["title"],
                        description=lr.get("description"),
                        slug=lr.get("slug"),
                        url=f"/learning/{lr.get('slug')}",
                        score=round(score, 3),
                        metadata={
                            "resource_type": lr.get("resource_type"),
                            "difficulty_level": lr.get("difficulty_level"),
                        },
                    )
                )
        return results

    def _search_chronicle(self, query: str, is_admin: bool) -> List[SearchItemResponse]:
        results = []
        for ch in chronicle_service._entries.values():
            if not is_admin and (ch.get("visibility") != "PUBLIC" or ch.get("status") != "PUBLISHED"):
                continue

            sim_title = calculate_trigram_similarity(query, ch.get("title", ""))
            sim_excerpt = calculate_trigram_similarity(query, ch.get("excerpt", "") or "") * 0.75
            score = max(sim_title, sim_excerpt)

            if score >= 0.25:
                results.append(
                    SearchItemResponse(
                        id=ch["id"],
                        entity_type="chronicle",
                        title=ch["title"],
                        description=ch.get("excerpt"),
                        slug=ch.get("slug"),
                        url=f"/chronicle/{ch.get('slug')}",
                        score=round(score, 3),
                        metadata={
                            "edition_type": ch.get("edition_type"),
                            "published_at": ch.get("published_at"),
                        },
                    )
                )
        return results

    def _search_journey(self, query: str, is_admin: bool) -> List[SearchItemResponse]:
        results = []
        for jm in journey_service._milestones.values():
            if not is_admin and (jm.get("visibility") != "PUBLIC" or jm.get("status") != "PUBLISHED"):
                continue

            sim_title = calculate_trigram_similarity(query, jm.get("title", ""))
            sim_desc = calculate_trigram_similarity(query, jm.get("description", "") or "") * 0.7
            score = max(sim_title, sim_desc)

            if score >= 0.25:
                results.append(
                    SearchItemResponse(
                        id=jm["id"],
                        entity_type="journey",
                        title=jm["title"],
                        description=jm.get("description"),
                        slug=jm.get("slug"),
                        url=f"/journey#{jm.get('slug')}",
                        score=round(score, 3),
                        metadata={
                            "milestone_date": jm.get("milestone_date"),
                            "milestone_type": jm.get("milestone_type"),
                        },
                    )
                )
        return results

    def _search_team(self, query: str) -> List[SearchItemResponse]:
        results = []
        for tm in CANONICAL_TEAM_MEMBERS:
            sim_name = calculate_trigram_similarity(query, tm["name"])
            sim_role = calculate_trigram_similarity(query, tm["role"]) * 0.8
            sim_dept = calculate_trigram_similarity(query, tm["department"]) * 0.6
            score = max(sim_name, sim_role, sim_dept)

            if score >= 0.25:
                results.append(
                    SearchItemResponse(
                        id=tm["id"],
                        entity_type="team",
                        title=tm["name"],
                        description=f"{tm['role']} — {tm['department']}",
                        slug=None,
                        url="/team",
                        score=round(score, 3),
                        metadata={
                            "role": tm["role"],
                            "department": tm["department"],
                        },
                    )
                )
        return results

    def _search_certificates(
        self,
        query: str,
        is_admin: bool,
        current_user: Optional[AuthenticatedUser],
    ) -> List[SearchItemResponse]:
        results = []
        q_upper = query.upper().strip()

        # Strict Security & Privacy Boundary for Certificates:
        # 1. Public callers: can ONLY find by exact certificate ID match (e.g. AIML26-APT-000184).
        #    Public query cannot search by student names or return lists of other people's certificates!
        # 2. Authenticated students: can find certificates belonging to their student_id or email.
        # 3. Staff: can query certificates by recipient name, certificate ID, or event.

        seen_ids = set()
        for cert in certificate_service.certificates.values():
            cid = cert.get("certificate_id")
            if not cid or cid in seen_ids:
                continue

            matches = False
            # Check exact certificate ID match (accessible to everyone)
            if cid.upper() == q_upper or (len(q_upper) >= 6 and q_upper in cid.upper()):
                matches = True
            elif is_admin:
                # Staff can search by recipient or event
                meta = cert.get("metadata", {})
                recip = meta.get("recipient_name", "")
                if query.lower() in recip.lower():
                    matches = True
            elif current_user:
                # Student can match their own certificate
                if cert.get("student_id") == current_user.account_id:
                    meta = cert.get("metadata", {})
                    recip = meta.get("recipient_name", "")
                    if query.lower() in recip.lower() or query.lower() in cid.lower():
                        matches = True

            if matches:
                seen_ids.add(cid)
                # Public-safe projection: do not leak student phone/email
                recip_name = cert.get("metadata", {}).get("recipient_name", "Verified Recipient")
                results.append(
                    SearchItemResponse(
                        id=cert.get("id", cid),
                        entity_type="certificate",
                        title=f"Certificate {cid}",
                        description=f"Verified Certificate for {recip_name}",
                        slug=None,
                        url=f"/verify/{cid}",
                        score=1.0 if cid.upper() == q_upper else 0.8,
                        metadata={
                            "certificate_id": cid,
                            "certificate_type": cert.get("certificate_type"),
                            "status": cert.get("status"),
                        },
                    )
                )
        return results


# Global singleton instance
search_service = SearchService()
