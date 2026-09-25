"""
AIML CLUB OCT — CONNECT
Phase 7.0 — Knowledge Foundation Verification Suite

Tests:
1. Migration 000009 validity, sequencing, and backward compatibility
2. Table definitions, foreign keys, uniqueness, and URL CHECK constraints
3. Native PostgreSQL search foundation (pg_trgm, composite GIN trigram indexes)
4. Row-Level Security (RLS) policies and canonical RBAC authorization integration
5. Shared TypeScript types enum and model consistency
6. Foundational Pydantic v2 schemas for Projects, Members, Research, and Learning
7. Strict URL scheme validation rejecting dangerous non-HTTP(S) protocols
"""

import os
import re
import pytest
from pydantic import ValidationError

from apps.api.src.schemas.knowledge import (
    ProjectBase,
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectMemberBase,
    ProjectMemberCreate,
    ProjectMemberResponse,
    ResearchAuthorSchema,
    ResearchItemBase,
    ResearchItemCreate,
    ResearchItemUpdate,
    ResearchItemResponse,
    LearningResourceBase,
    LearningResourceCreate,
    LearningResourceUpdate,
    LearningResourceResponse,
    VALID_PROJECT_STATUSES,
    VALID_PROJECT_VISIBILITIES,
    VALID_PROJECT_MEMBER_ROLES,
    VALID_RESEARCH_CATEGORIES,
    VALID_RESEARCH_STATUSES,
    VALID_RESEARCH_VISIBILITIES,
    VALID_LEARNING_RESOURCE_TYPES,
    VALID_LEARNING_DIFFICULTY_LEVELS,
    VALID_LEARNING_VISIBILITIES,
    validate_safe_http_url,
)

MIGRATIONS_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "supabase", "migrations")
)
TYPES_INDEX_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "packages", "types", "src", "index.ts")
)


# ------------------------------------------------------------------------------
# 1. Database Migration 000009 Structure & Integrity Tests
# ------------------------------------------------------------------------------

def test_migration_chain_integrity():
    """
    Verifies that migrations 000001 through 000009 exist in unbroken sequence
    and historical migrations 000001-000008 are intact.
    """
    expected_migrations = [
        "20260925000001_initial_schema.sql",
        "20260925000002_event_engine.sql",
        "20260925000003_attendance_operations.sql",
        "20260925000004_media_intelligence.sql",
        "20260925000005_certificate_engine.sql",
        "20260925000006_database_foundation_reconciliation.sql",
        "20260925000007_chronicle_journey_feedback.sql",
        "20260925000008_volunteer_assignments_constraint.sql",
        "20260925000009_projects_research_learning_search.sql",
    ]
    for filename in expected_migrations:
        file_path = os.path.join(MIGRATIONS_DIR, filename)
        assert os.path.isfile(file_path), f"Required migration file missing: {filename}"


def test_migration_000009_ddl_and_constraints():
    """
    Validates that migration 000009 declares all 4 Phase 7 tables with required
    constraints, foreign keys, and idempotency guards.
    """
    m09_path = os.path.join(MIGRATIONS_DIR, "20260925000009_projects_research_learning_search.sql")
    with open(m09_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Table creation guards
    assert "CREATE TABLE IF NOT EXISTS projects" in content
    assert "CREATE TABLE IF NOT EXISTS project_members" in content
    assert "CREATE TABLE IF NOT EXISTS research_items" in content
    assert "CREATE TABLE IF NOT EXISTS learning_resources" in content

    # Foreign key references
    assert "cover_media_id UUID REFERENCES media_assets(id) ON DELETE SET NULL" in content
    assert "linked_event_id UUID REFERENCES events(id) ON DELETE SET NULL" in content
    assert "created_by UUID REFERENCES accounts(id) ON DELETE SET NULL" in content
    assert "project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE" in content
    assert "student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE RESTRICT" in content
    assert "linked_project_id UUID REFERENCES projects(id) ON DELETE SET NULL" in content

    # Unique constraints
    assert "slug TEXT UNIQUE NOT NULL" in content
    assert "CONSTRAINT uq_project_student UNIQUE (project_id, student_id)" in content

    # Value constraints
    assert "CONSTRAINT check_project_status CHECK (status IN ('IDEA', 'IN_DEVELOPMENT', 'COMPLETED', 'ARCHIVED'))" in content
    assert "CONSTRAINT check_project_visibility CHECK (visibility IN ('PUBLIC', 'AUTHENTICATED', 'TEAM_ONLY', 'HIDDEN'))" in content
    assert "CONSTRAINT check_project_member_role CHECK (role IN ('LEAD', 'CONTRIBUTOR', 'MENTOR', 'ADVISOR'))" in content
    assert "CONSTRAINT check_research_category CHECK (category IN ('AI_ML', 'COMPUTER_VISION', 'NLP', 'REINFORCEMENT_LEARNING', 'GENERATIVE_AI', 'ROBOTICS', 'DATA_SCIENCE'))" in content
    assert "CONSTRAINT check_research_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))" in content
    assert "CONSTRAINT check_learning_resource_type CHECK (resource_type IN ('NOTEBOOK', 'TUTORIAL', 'WORKSHOP_MATERIAL', 'RECORDING', 'DATASET', 'SLIDES', 'DOCUMENTATION'))" in content
    assert "CONSTRAINT check_learning_difficulty_level CHECK (difficulty_level IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED'))" in content

    # Database-level URL restrictions
    assert "CONSTRAINT check_project_repo_url CHECK (repository_url IS NULL OR repository_url ~* '^https?://')" in content
    assert "CONSTRAINT check_project_demo_url CHECK (demo_url IS NULL OR demo_url ~* '^https?://')" in content
    assert "CONSTRAINT check_project_doc_url CHECK (documentation_url IS NULL OR documentation_url ~* '^https?://')" in content
    assert "CONSTRAINT check_research_pub_url CHECK (publication_url IS NULL OR publication_url ~* '^https?://')" in content
    assert "CONSTRAINT check_research_repo_url CHECK (repository_url IS NULL OR repository_url ~* '^https?://')" in content
    assert "CONSTRAINT check_research_dataset_url CHECK (dataset_url IS NULL OR dataset_url ~* '^https?://')" in content
    assert "CONSTRAINT check_learning_url CHECK (url ~* '^https?://')" in content


def test_migration_000009_search_foundation():
    """
    Validates native PostgreSQL search indexes using pg_trgm and GIN.
    """
    m09_path = os.path.join(MIGRATIONS_DIR, "20260925000009_projects_research_learning_search.sql")
    with open(m09_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";" in content
    assert "CREATE INDEX IF NOT EXISTS idx_projects_trgm ON projects USING gin (title gin_trgm_ops, summary gin_trgm_ops);" in content
    assert "CREATE INDEX IF NOT EXISTS idx_research_trgm ON research_items USING gin (title gin_trgm_ops, abstract gin_trgm_ops);" in content
    assert "CREATE INDEX IF NOT EXISTS idx_learning_trgm ON learning_resources USING gin (title gin_trgm_ops);" in content


def test_migration_000009_rls_and_canonical_rbac():
    """
    Validates RLS enablement and that canonical public.check_user_has_role(...)
    is used without introducing legacy or deprecated role tables.
    """
    m09_path = os.path.join(MIGRATIONS_DIR, "20260925000009_projects_research_learning_search.sql")
    with open(m09_path, "r", encoding="utf-8") as f:
        content = f.read()

    # All tables have RLS enabled
    assert "ALTER TABLE projects ENABLE ROW LEVEL SECURITY;" in content
    assert "ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;" in content
    assert "ALTER TABLE research_items ENABLE ROW LEVEL SECURITY;" in content
    assert "ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;" in content

    # Canonical security-definer helper is utilized
    assert "public.check_user_has_role('SUPER_ADMIN', 'CLUB_ADMIN', 'CONTENT_MANAGER')" in content

    # Never reference legacy/deprecated structures
    assert "user_roles" not in content
    assert "roles r" not in content

    # Lead authorization is defined
    assert "pm.role = 'LEAD'" in content


# ------------------------------------------------------------------------------
# 2. URL Scheme Security Tests
# ------------------------------------------------------------------------------

def test_url_sanitizer_accepts_valid_http_and_https():
    valid_urls = [
        "https://github.com/UmeshCode1/Connect-AiML-Club-OCT",
        "http://localhost:3000/demo",
        "https://arxiv.org/abs/2301.00001",
        "https://colab.research.google.com/drive/xyz123",
        "https://huggingface.co/datasets/sample",
    ]
    for url in valid_urls:
        assert validate_safe_http_url(url) == url

    assert validate_safe_http_url(None) is None
    assert validate_safe_http_url("   ") is None


def test_url_sanitizer_rejects_dangerous_schemes():
    dangerous_urls = [
        "javascript:alert(document.cookie)",
        "JavaScript:alert('XSS')",
        "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
        "vbscript:msgbox(1)",
        "file:///etc/passwd",
        "about:blank",
        "ftp://files.example.com",
    ]
    for bad_url in dangerous_urls:
        with pytest.raises(ValueError) as excinfo:
            validate_safe_http_url(bad_url)
        assert "forbidden" in str(excinfo.value).lower() or "absolute http or https" in str(excinfo.value).lower()


# ------------------------------------------------------------------------------
# 3. Pydantic v2 Schema Tests (Projects & Project Members)
# ------------------------------------------------------------------------------

def test_pydantic_project_valid_payload():
    payload = {
        "title": "Autonomous Drone Navigation with Vision-Language Models",
        "slug": "drone-nav-vlm",
        "summary": "End-to-end edge inference for autonomous navigation in GPS-denied environments.",
        "description": "Full technical breakdown with PyTorch and ROS 2 implementation.",
        "status": "IN_DEVELOPMENT",
        "technology_stack": ["Python", "PyTorch", "ROS2", "OpenCV"],
        "repository_url": "https://github.com/aiml-club/drone-nav",
        "demo_url": "https://demo.aimlcluboct.in/drone-nav",
        "visibility": "PUBLIC",
        "is_featured": True,
    }
    project = ProjectCreate(**payload)
    assert project.title == payload["title"]
    assert project.status == "IN_DEVELOPMENT"
    assert project.visibility == "PUBLIC"
    assert len(project.technology_stack) == 4


def test_pydantic_project_rejects_invalid_enums_and_urls():
    # Invalid status
    with pytest.raises(ValidationError):
        ProjectCreate(
            title="Invalid Status Project",
            summary="Test summary",
            description="Test description",
            status="INVALID_STATUS",
        )

    # Invalid visibility
    with pytest.raises(ValidationError):
        ProjectCreate(
            title="Invalid Vis Project",
            summary="Test summary",
            description="Test description",
            visibility="SECRET",
        )

    # Dangerous URL
    with pytest.raises(ValidationError):
        ProjectCreate(
            title="XSS Project",
            summary="Test summary",
            description="Test description",
            repository_url="javascript:alert(1)",
        )


def test_pydantic_project_member_valid_and_invalid():
    # Valid member
    member = ProjectMemberCreate(
        student_id="11111111-1111-1111-1111-111111111111",
        role="LEAD",
        display_order=1,
    )
    assert member.role == "LEAD"
    assert member.display_order == 1

    # Case insensitive uppercase conversion
    member_lower = ProjectMemberCreate(
        student_id="11111111-1111-1111-1111-111111111111",
        role="contributor",
    )
    assert member_lower.role == "CONTRIBUTOR"

    # Invalid member role
    with pytest.raises(ValidationError):
        ProjectMemberCreate(
            student_id="11111111-1111-1111-1111-111111111111",
            role="PRESIDENT",
        )


# ------------------------------------------------------------------------------
# 4. Pydantic v2 Schema Tests (Research Items)
# ------------------------------------------------------------------------------

def test_pydantic_research_item_valid():
    payload = {
        "title": "Low-Latency Transformer Quantization on Embedded NPUs",
        "slug": "quant-transformer-npus",
        "abstract": "We present an int4 post-training quantization method yielding 3.2x speedup.",
        "authors": [
            {"name": "Aarav Sharma", "enrollment_number": "0126AL221001", "role": "Lead Researcher"},
            {"name": "Dr. S. K. Gupta", "affiliation": "OCT Bhopal", "role": "Faculty Advisor"},
        ],
        "category": "AI_ML",
        "methodology": "Post-training integer quantization with Hessian weight sensitivity estimation.",
        "publication_url": "https://arxiv.org/abs/2401.99999",
        "repository_url": "https://github.com/aiml-club/quant-transformers",
        "dataset_url": "https://huggingface.co/datasets/oct/edge-eval",
        "visibility": "PUBLIC",
        "status": "PUBLISHED",
    }
    item = ResearchItemCreate(**payload)
    assert item.title == payload["title"]
    assert item.category == "AI_ML"
    assert len(item.authors) == 2
    assert item.authors[0].name == "Aarav Sharma"


def test_pydantic_research_item_rejects_invalid_fields():
    # Abstract too short
    with pytest.raises(ValidationError):
        ResearchItemCreate(
            title="Too short",
            abstract="short",
            category="AI_ML",
        )

    # Invalid category
    with pytest.raises(ValidationError):
        ResearchItemCreate(
            title="Valid Title Paper",
            abstract="This is a valid long abstract describing research results.",
            category="ASTRONOMY",
        )

    # Dangerous dataset URL
    with pytest.raises(ValidationError):
        ResearchItemCreate(
            title="Valid Title Paper",
            abstract="This is a valid long abstract describing research results.",
            dataset_url="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
        )


# ------------------------------------------------------------------------------
# 5. Pydantic v2 Schema Tests (Learning Resources)
# ------------------------------------------------------------------------------

def test_pydantic_learning_resource_valid():
    payload = {
        "title": "Hands-on Introduction to Diffusion Models in PyTorch",
        "slug": "intro-diffusion-models",
        "resource_type": "NOTEBOOK",
        "difficulty_level": "INTERMEDIATE",
        "description": "Colab notebook guiding through forward and reverse diffusion processes.",
        "url": "https://colab.research.google.com/github/aiml-club/diffusion-workshop/blob/main/notebook.ipynb",
        "visibility": "PUBLIC",
    }
    res = LearningResourceCreate(**payload)
    assert res.resource_type == "NOTEBOOK"
    assert res.difficulty_level == "INTERMEDIATE"
    assert res.url.startswith("https://colab.research.google.com")


def test_pydantic_learning_resource_rejects_invalid():
    # Invalid resource type
    with pytest.raises(ValidationError):
        LearningResourceCreate(
            title="Test Resource",
            resource_type="PHYSICAL_BOOK",
            url="https://example.com",
        )

    # Invalid difficulty
    with pytest.raises(ValidationError):
        LearningResourceCreate(
            title="Test Resource",
            difficulty_level="EXTREME",
            url="https://example.com",
        )

    # Dangerous URL
    with pytest.raises(ValidationError):
        LearningResourceCreate(
            title="Test Resource",
            url="javascript:alert(1)",
        )

    # Missing URL
    with pytest.raises(ValidationError):
        LearningResourceCreate(
            title="Test Resource",
            url="",
        )


# ------------------------------------------------------------------------------
# 6. Shared TypeScript Types Parity & Cross-Stack Consistency
# ------------------------------------------------------------------------------

def test_typescript_shared_types_file_content():
    """
    Verifies that @connect/types includes the canonical domain types matching
    the database schema and Pydantic models.
    """
    assert os.path.isfile(TYPES_INDEX_PATH), "Shared types index.ts missing"
    with open(TYPES_INDEX_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Project types
    assert "export type ProjectStatus" in content
    assert "export type ProjectVisibility" in content
    assert "export type ProjectMemberRole" in content
    assert "export interface ProjectMember" in content
    assert "export interface Project" in content
    assert "export interface ProjectCreatePayload" in content
    assert "export interface ProjectUpdatePayload" in content

    # Research types
    assert "export type ResearchCategory" in content
    assert "export type ResearchStatus" in content
    assert "export type ResearchVisibility" in content
    assert "export interface ResearchAuthor" in content
    assert "export interface ResearchItem" in content
    assert "export interface ResearchItemCreatePayload" in content
    assert "export interface ResearchItemUpdatePayload" in content

    # Learning resource types
    assert "export type LearningResourceType" in content
    assert "export type LearningDifficultyLevel" in content
    assert "export type LearningResourceVisibility" in content
    assert "export interface LearningResource" in content
    assert "export interface LearningResourceCreatePayload" in content
    assert "export interface LearningResourceUpdatePayload" in content

    # Verify enum values in TypeScript match Python sets
    for status in VALID_PROJECT_STATUSES:
        assert f"'{status}'" in content

    for role in VALID_PROJECT_MEMBER_ROLES:
        assert f"'{role}'" in content

    for cat in VALID_RESEARCH_CATEGORIES:
        assert f"'{cat}'" in content

    for r_type in VALID_LEARNING_RESOURCE_TYPES:
        assert f"'{r_type}'" in content

    for level in VALID_LEARNING_DIFFICULTY_LEVELS:
        assert f"'{level}'" in content
