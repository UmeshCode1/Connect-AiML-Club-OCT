"""
AIML CLUB OCT — CONNECT
Unified Authorization-Aware Search Service

Specification Reference:
- 01_PRODUCT_REQUIREMENTS.md (Section 22)
- 03_DATABASE_SCHEMA.md (Migration 000009 pg_trgm & GIN indexes)
- 04_RBAC_PERMISSIONS.md (Granular RBAC boundaries)
- 05_API_SPECIFICATION.md (Section 22)
- 11_SECURITY_PRIVACY.md (Anti-Leakage, Private Data Isolation)

PostgreSQL Engine:
- Utilizes pg_trgm extension and GIN trigram indexes (idx_events_title_trgm,
  idx_projects_trgm, idx_research_trgm, idx_learning_trgm).
- Uses PostgreSQL operators: `%` (similarity threshold), `ILIKE` (GIN trigram accelerated).
- Uses PostgreSQL function: `similarity(column, query)`.
- Eliminates in-memory trigram / Jaccard simulation from Python.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import psycopg
from psycopg.rows import dict_row

from apps.api.src.core.config import settings
from apps.api.src.core.errors import BadRequestException
from apps.api.src.core.security import AuthenticatedUser
from apps.api.src.schemas.knowledge import SearchItemResponse, VALID_SEARCH_ENTITY_TYPES
from apps.api.src.services.certificate_service import certificate_service
from apps.api.src.services.chronicle_service import chronicle_service
from apps.api.src.services.event_service import event_service
from apps.api.src.services.journey_service import journey_service
from apps.api.src.services.learning_service import learning_service
from apps.api.src.services.project_service import project_service
from apps.api.src.services.research_service import research_service

logger = logging.getLogger(__name__)


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
    """
    Authorization-aware search service powered by PostgreSQL native pg_trgm.
    Directly leverages GIN trigram indexes on titles, summaries, and abstracts.
    """

    def __init__(self, database_url: Optional[str] = None):
        self._database_url = database_url

    @property
    def database_url(self) -> str:
        return self._database_url or settings.DATABASE_URL

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
    # PostgreSQL Query Builder & Executor (Real Database Trigram Search)
    # --------------------------------------------------------------------------

    def build_postgres_query(
        self,
        domain: str,
        query: str,
        is_admin: bool,
        current_user: Optional[AuthenticatedUser] = None,
        limit: int = 50,
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Builds native PostgreSQL query utilizing pg_trgm operators (%, ILIKE, similarity)
        with authorization checks embedded directly in SQL WHERE clauses.
        """
        like_q = f"%{query}%"
        params: Dict[str, Any] = {
            "q": query,
            "like_q": like_q,
            "limit": limit,
        }

        if domain == "events":
            auth_clause = "1=1" if is_admin else "(visibility = 'PUBLIC' AND status != 'DRAFT')"
            sql = f"""
                SELECT 
                    id::text,
                    title,
                    COALESCE(short_description, description) AS description,
                    slug,
                    event_type,
                    status,
                    start_at::text,
                    ROUND(CAST(GREATEST(
                        similarity(title, %(q)s),
                        similarity(COALESCE(description, ''), %(q)s) * 0.8
                    ) AS numeric), 3) AS score
                FROM events
                WHERE {auth_clause}
                  AND (
                      title % %(q)s
                      OR title ILIKE %(like_q)s
                      OR COALESCE(description, '') ILIKE %(like_q)s
                      OR COALESCE(event_code, '') ILIKE %(like_q)s
                  )
                ORDER BY score DESC
                LIMIT %(limit)s;
            """
            return sql, params

        elif domain == "projects":
            if is_admin:
                auth_clause = "1=1"
            elif current_user:
                params["account_id"] = current_user.account_id
                auth_clause = """
                    (
                        (visibility = 'PUBLIC' AND status IN ('IN_DEVELOPMENT', 'COMPLETED') AND (published_at IS NULL OR published_at <= NOW()))
                        OR created_by::text = %(account_id)s
                        OR EXISTS (
                            SELECT 1 FROM project_members pm
                            JOIN student_profiles sp ON sp.id = pm.student_id
                            JOIN accounts a ON (a.email = sp.email OR a.id = sp.id)
                            WHERE pm.project_id = projects.id AND a.id::text = %(account_id)s
                        )
                    )
                """
            else:
                auth_clause = "(visibility = 'PUBLIC' AND status IN ('IN_DEVELOPMENT', 'COMPLETED') AND (published_at IS NULL OR published_at <= NOW()))"

            sql = f"""
                SELECT 
                    id::text,
                    title,
                    summary AS description,
                    slug,
                    status,
                    technology_stack,
                    is_featured,
                    ROUND(CAST(GREATEST(
                        similarity(title, %(q)s),
                        similarity(summary, %(q)s) * 0.85
                    ) AS numeric), 3) AS score
                FROM projects
                WHERE {auth_clause}
                  AND (
                      title % %(q)s
                      OR summary % %(q)s
                      OR title ILIKE %(like_q)s
                      OR summary ILIKE %(like_q)s
                  )
                ORDER BY score DESC
                LIMIT %(limit)s;
            """
            return sql, params

        elif domain == "research":
            if is_admin:
                auth_clause = "1=1"
            elif current_user:
                params["account_id"] = current_user.account_id
                auth_clause = "((visibility = 'PUBLIC' AND status = 'PUBLISHED') OR created_by::text = %(account_id)s)"
            else:
                auth_clause = "(visibility = 'PUBLIC' AND status = 'PUBLISHED')"

            sql = f"""
                SELECT 
                    id::text,
                    title,
                    SUBSTRING(abstract FROM 1 FOR 240) AS description,
                    slug,
                    category,
                    status,
                    published_at::text,
                    ROUND(CAST(GREATEST(
                        similarity(title, %(q)s),
                        similarity(abstract, %(q)s) * 0.7
                    ) AS numeric), 3) AS score
                FROM research_items
                WHERE {auth_clause}
                  AND (
                      title % %(q)s
                      OR abstract % %(q)s
                      OR title ILIKE %(like_q)s
                      OR abstract ILIKE %(like_q)s
                  )
                ORDER BY score DESC
                LIMIT %(limit)s;
            """
            return sql, params

        elif domain == "learning":
            auth_clause = "1=1" if is_admin else "(visibility = 'PUBLIC')"
            sql = f"""
                SELECT 
                    id::text,
                    title,
                    description,
                    slug,
                    resource_type,
                    difficulty_level,
                    ROUND(CAST(similarity(title, %(q)s) AS numeric), 3) AS score
                FROM learning_resources
                WHERE {auth_clause}
                  AND (
                      title % %(q)s
                      OR title ILIKE %(like_q)s
                      OR COALESCE(description, '') ILIKE %(like_q)s
                  )
                ORDER BY score DESC
                LIMIT %(limit)s;
            """
            return sql, params

        elif domain == "chronicle":
            auth_clause = "1=1" if is_admin else "(visibility = 'PUBLIC' AND status = 'PUBLISHED')"
            sql = f"""
                SELECT 
                    id::text,
                    title,
                    excerpt AS description,
                    slug,
                    edition_type,
                    published_at::text,
                    ROUND(CAST(GREATEST(
                        similarity(title, %(q)s),
                        similarity(COALESCE(excerpt, ''), %(q)s) * 0.75
                    ) AS numeric), 3) AS score
                FROM chronicle_entries
                WHERE {auth_clause}
                  AND (
                      title % %(q)s
                      OR title ILIKE %(like_q)s
                      OR COALESCE(excerpt, '') ILIKE %(like_q)s
                  )
                ORDER BY score DESC
                LIMIT %(limit)s;
            """
            return sql, params

        elif domain == "journey":
            auth_clause = "1=1" if is_admin else "(visibility = 'PUBLIC' AND status = 'PUBLISHED')"
            sql = f"""
                SELECT 
                    id::text,
                    title,
                    description,
                    slug,
                    milestone_date::text,
                    milestone_type,
                    ROUND(CAST(GREATEST(
                        similarity(title, %(q)s),
                        similarity(COALESCE(description, ''), %(q)s) * 0.7
                    ) AS numeric), 3) AS score
                FROM journey_milestones
                WHERE {auth_clause}
                  AND (
                      title % %(q)s
                      OR title ILIKE %(like_q)s
                      OR COALESCE(description, '') ILIKE %(like_q)s
                  )
                ORDER BY score DESC
                LIMIT %(limit)s;
            """
            return sql, params

        elif domain == "certificates":
            # Strict Certificate Security Boundary:
            # - Public callers can ONLY query exact certificate ID
            # - Authenticated students can query their own student ID or exact certificate ID
            # - Staff can search by certificate ID prefix or recipient name
            q_upper = query.upper().strip()
            params["q_upper"] = q_upper

            if is_admin:
                auth_clause = "(certificate_id ILIKE %(like_q)s OR metadata->>'recipient_name' ILIKE %(like_q)s)"
            elif current_user:
                params["account_id"] = current_user.account_id
                auth_clause = "(UPPER(certificate_id) = %(q_upper)s OR student_id::text = %(account_id)s)"
            else:
                auth_clause = "UPPER(certificate_id) = %(q_upper)s"

            sql = f"""
                SELECT 
                    id::text,
                    certificate_id,
                    certificate_type,
                    status,
                    metadata->>'recipient_name' AS recipient_name,
                    CASE WHEN UPPER(certificate_id) = %(q_upper)s THEN 1.0 ELSE 0.8 END AS score
                FROM certificates
                WHERE {auth_clause}
                ORDER BY score DESC
                LIMIT %(limit)s;
            """
            return sql, params

        else:
            raise ValueError(f"Unsupported PostgreSQL search domain: {domain}")

    def execute_postgres_search(
        self,
        domain: str,
        query: str,
        is_admin: bool,
        current_user: Optional[AuthenticatedUser] = None,
        limit: int = 50,
    ) -> Optional[List[SearchItemResponse]]:
        """
        Executes native PostgreSQL trigram query against connected database.
        Returns None if DATABASE_URL is not configured or connection is unavailable.
        """
        db_url = self.database_url
        if not db_url:
            return None

        try:
            sql, params = self.build_postgres_query(domain, query, is_admin, current_user, limit)
            with psycopg.connect(db_url, row_factory=dict_row) as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, params)
                    rows = cur.fetchall()

            results: List[SearchItemResponse] = []
            for r in rows:
                score = float(r.get("score") or 0.5)
                if score < 0.2:
                    continue

                if domain == "events":
                    results.append(
                        SearchItemResponse(
                            id=r["id"],
                            entity_type="event",
                            title=r["title"],
                            description=r.get("description"),
                            slug=r.get("slug"),
                            url=f"/events/{r.get('slug')}",
                            score=score,
                            metadata={
                                "event_type": r.get("event_type"),
                                "status": r.get("status"),
                                "start_at": r.get("start_at"),
                            },
                        )
                    )
                elif domain == "projects":
                    results.append(
                        SearchItemResponse(
                            id=r["id"],
                            entity_type="project",
                            title=r["title"],
                            description=r.get("description"),
                            slug=r.get("slug"),
                            url=f"/projects/{r.get('slug')}",
                            score=score,
                            metadata={
                                "status": r.get("status"),
                                "technology_stack": r.get("technology_stack", []),
                                "is_featured": r.get("is_featured", False),
                            },
                        )
                    )
                elif domain == "research":
                    results.append(
                        SearchItemResponse(
                            id=r["id"],
                            entity_type="research",
                            title=r["title"],
                            description=r.get("description"),
                            slug=r.get("slug"),
                            url=f"/research/{r.get('slug')}",
                            score=score,
                            metadata={
                                "category": r.get("category"),
                                "status": r.get("status"),
                                "published_at": r.get("published_at"),
                            },
                        )
                    )
                elif domain == "learning":
                    results.append(
                        SearchItemResponse(
                            id=r["id"],
                            entity_type="learning",
                            title=r["title"],
                            description=r.get("description"),
                            slug=r.get("slug"),
                            url=f"/learning/{r.get('slug')}",
                            score=score,
                            metadata={
                                "resource_type": r.get("resource_type"),
                                "difficulty_level": r.get("difficulty_level"),
                            },
                        )
                    )
                elif domain == "chronicle":
                    results.append(
                        SearchItemResponse(
                            id=r["id"],
                            entity_type="chronicle",
                            title=r["title"],
                            description=r.get("description"),
                            slug=r.get("slug"),
                            url=f"/chronicle/{r.get('slug')}",
                            score=score,
                            metadata={
                                "edition_type": r.get("edition_type"),
                                "published_at": r.get("published_at"),
                            },
                        )
                    )
                elif domain == "journey":
                    results.append(
                        SearchItemResponse(
                            id=r["id"],
                            entity_type="journey",
                            title=r["title"],
                            description=r.get("description"),
                            slug=r.get("slug"),
                            url=f"/journey#{r.get('slug')}",
                            score=score,
                            metadata={
                                "milestone_date": r.get("milestone_date"),
                                "milestone_type": r.get("milestone_type"),
                            },
                        )
                    )
                elif domain == "certificates":
                    cid = r["certificate_id"]
                    recip_name = r.get("recipient_name") or "Verified Recipient"
                    results.append(
                        SearchItemResponse(
                            id=r["id"],
                            entity_type="certificate",
                            title=f"Certificate {cid}",
                            description=f"Verified Certificate for {recip_name}",
                            slug=None,
                            url=f"/verify/{cid}",
                            score=score,
                            metadata={
                                "certificate_id": cid,
                                "certificate_type": r.get("certificate_type"),
                                "status": r.get("status"),
                            },
                        )
                    )

            return results
        except Exception as e:
            logger.warning("PostgreSQL search query failed (%s); using fallback execution: %s", domain, e)
            return None

    # --------------------------------------------------------------------------
    # Sub-domain Search Methods (PostgreSQL execution with zero-trigram-calc fallback)
    # --------------------------------------------------------------------------

    def _search_events(self, query: str, is_admin: bool) -> List[SearchItemResponse]:
        db_results = self.execute_postgres_search("events", query, is_admin)
        if db_results is not None:
            return db_results

        # Fallback when DATABASE_URL is unconfigured: direct field matching without trigram calculation
        q_norm = query.lower()
        results = []
        for ev in event_service._events.values():
            if not is_admin and (ev.get("visibility") != "PUBLIC" or ev.get("status") == "DRAFT"):
                continue

            title = ev.get("title", "")
            desc = ev.get("description", "") or ""
            code = ev.get("event_code", "") or ""

            score = 0.0
            if q_norm == title.lower():
                score = 1.0
            elif title.lower().startswith(q_norm):
                score = 0.85
            elif q_norm in title.lower():
                score = 0.75
            elif q_norm in code.lower():
                score = 0.8
            elif q_norm in desc.lower():
                score = 0.5

            if score >= 0.25:
                results.append(
                    SearchItemResponse(
                        id=ev["id"],
                        entity_type="event",
                        title=title,
                        description=ev.get("short_description") or desc,
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
        db_results = self.execute_postgres_search("projects", query, is_admin, current_user)
        if db_results is not None:
            return db_results

        # Fallback when DATABASE_URL is unconfigured: direct field matching without trigram calculation
        q_norm = query.lower()
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

            title = p.get("title", "")
            summary = p.get("summary", "") or ""
            tech_stack = p.get("technology_stack", [])

            score = 0.0
            if q_norm == title.lower():
                score = 1.0
            elif title.lower().startswith(q_norm):
                score = 0.85
            elif q_norm in title.lower():
                score = 0.75
            elif any(q_norm in t.lower() for t in tech_stack):
                score = 0.7
            elif q_norm in summary.lower():
                score = 0.6

            if score >= 0.25:
                results.append(
                    SearchItemResponse(
                        id=p["id"],
                        entity_type="project",
                        title=title,
                        description=summary,
                        slug=p.get("slug"),
                        url=f"/projects/{p.get('slug')}",
                        score=round(score, 3),
                        metadata={
                            "status": p.get("status"),
                            "technology_stack": tech_stack,
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
        db_results = self.execute_postgres_search("research", query, is_admin, current_user)
        if db_results is not None:
            return db_results

        # Fallback when DATABASE_URL is unconfigured: direct field matching without trigram calculation
        q_norm = query.lower()
        results = []
        for r in research_service._items.values():
            is_pub = research_service._is_item_visible_to_public(r)
            is_author = current_user and r.get("created_by") == current_user.account_id

            # Security boundary: drafts visible only to author or staff
            if not is_admin and not is_pub and not is_author:
                continue

            title = r.get("title", "")
            abstract = r.get("abstract", "") or ""
            authors = r.get("authors", [])

            score = 0.0
            if q_norm == title.lower():
                score = 1.0
            elif title.lower().startswith(q_norm):
                score = 0.85
            elif q_norm in title.lower():
                score = 0.75
            elif any(q_norm in a.get("name", "").lower() for a in authors):
                score = 0.7
            elif q_norm in abstract.lower():
                score = 0.6

            if score >= 0.25:
                desc = abstract[:240] + ("..." if len(abstract) > 240 else "")
                results.append(
                    SearchItemResponse(
                        id=r["id"],
                        entity_type="research",
                        title=title,
                        description=desc,
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
        db_results = self.execute_postgres_search("learning", query, is_admin)
        if db_results is not None:
            return db_results

        # Fallback when DATABASE_URL is unconfigured: direct field matching without trigram calculation
        q_norm = query.lower()
        results = []
        for lr in learning_service._resources.values():
            if not is_admin and lr.get("visibility") != "PUBLIC":
                continue

            title = lr.get("title", "")
            desc = lr.get("description", "") or ""

            score = 0.0
            if q_norm == title.lower():
                score = 1.0
            elif title.lower().startswith(q_norm):
                score = 0.85
            elif q_norm in title.lower():
                score = 0.75
            elif q_norm in desc.lower():
                score = 0.55

            if score >= 0.25:
                results.append(
                    SearchItemResponse(
                        id=lr["id"],
                        entity_type="learning",
                        title=title,
                        description=desc,
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
        db_results = self.execute_postgres_search("chronicle", query, is_admin)
        if db_results is not None:
            return db_results

        # Fallback when DATABASE_URL is unconfigured: direct field matching without trigram calculation
        q_norm = query.lower()
        results = []
        for ch in chronicle_service._entries.values():
            if not is_admin and (ch.get("visibility") != "PUBLIC" or ch.get("status") != "PUBLISHED"):
                continue

            title = ch.get("title", "")
            excerpt = ch.get("excerpt", "") or ""

            score = 0.0
            if q_norm == title.lower():
                score = 1.0
            elif title.lower().startswith(q_norm):
                score = 0.85
            elif q_norm in title.lower():
                score = 0.75
            elif q_norm in excerpt.lower():
                score = 0.6

            if score >= 0.25:
                results.append(
                    SearchItemResponse(
                        id=ch["id"],
                        entity_type="chronicle",
                        title=title,
                        description=excerpt,
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
        db_results = self.execute_postgres_search("journey", query, is_admin)
        if db_results is not None:
            return db_results

        # Fallback when DATABASE_URL is unconfigured: direct field matching without trigram calculation
        q_norm = query.lower()
        results = []
        for jm in journey_service._milestones.values():
            if not is_admin and (jm.get("visibility") != "PUBLIC" or jm.get("status") != "PUBLISHED"):
                continue

            title = jm.get("title", "")
            desc = jm.get("description", "") or ""

            score = 0.0
            if q_norm == title.lower():
                score = 1.0
            elif title.lower().startswith(q_norm):
                score = 0.85
            elif q_norm in title.lower():
                score = 0.75
            elif q_norm in desc.lower():
                score = 0.55

            if score >= 0.25:
                results.append(
                    SearchItemResponse(
                        id=jm["id"],
                        entity_type="journey",
                        title=title,
                        description=desc,
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
        # Public team discovery across canonical leadership roster
        q_norm = query.lower()
        results = []
        for tm in CANONICAL_TEAM_MEMBERS:
            name = tm["name"]
            role = tm["role"]
            dept = tm["department"]

            score = 0.0
            if q_norm == name.lower():
                score = 1.0
            elif name.lower().startswith(q_norm):
                score = 0.85
            elif q_norm in name.lower():
                score = 0.75
            elif q_norm in role.lower():
                score = 0.65
            elif q_norm in dept.lower():
                score = 0.5

            if score >= 0.25:
                results.append(
                    SearchItemResponse(
                        id=tm["id"],
                        entity_type="team",
                        title=name,
                        description=f"{role} — {dept}",
                        slug=None,
                        url="/team",
                        score=round(score, 3),
                        metadata={
                            "role": role,
                            "department": dept,
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
        db_results = self.execute_postgres_search("certificates", query, is_admin, current_user)
        if db_results is not None:
            return db_results

        # Strict Security & Privacy Boundary for Certificates:
        # 1. Public callers: can ONLY find by exact certificate ID match (e.g. AIML26-APT-000184).
        #    Public query cannot search by student names or return lists of other people's certificates!
        # 2. Authenticated students: can find certificates belonging to their student_id or email.
        # 3. Staff: can query certificates by recipient name, certificate ID, or event.
        results = []
        q_upper = query.upper().strip()
        seen_ids = set()

        for cert in certificate_service.certificates.values():
            cid = cert.get("certificate_id")
            if not cid or cid in seen_ids:
                continue

            matches = False
            # Check exact certificate ID match (accessible to everyone)
            if cid.upper() == q_upper:
                matches = True
            elif is_admin:
                # Staff can search by recipient or certificate ID prefix
                meta = cert.get("metadata", {})
                recip = meta.get("recipient_name", "")
                if query.lower() in recip.lower() or query.lower() in cid.lower():
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

