"""
AIML CLUB OCT — CONNECT
Knowledge & Innovation Showcase Schemas (Phase 7.0)

Entities:
- Project, ProjectMember
- ResearchItem
- LearningResource

Complies with:
- 03_DATABASE_SCHEMA.md (§24 Projects, §25 Project Members, §26 Research, §27 Learning)
- 04_RBAC_PERMISSIONS.md (§4 Content Manager, Projects.*, Research.*, Learning.*)
- 05_API_SPECIFICATION.md (§19 Projects, §20 Research, §21 Learning, §22 Search)
- 11_SECURITY_PRIVACY.md (§4 URL Scheme Validation, Granular RBAC)
"""

from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


def validate_safe_http_url(v: Optional[str]) -> Optional[str]:
    """
    Enforces that external URLs are strictly HTTP or HTTPS and rejects
    dangerous schemes like javascript:, data:, vbscript:, file:, etc.
    """
    if v is None:
        return None
    v_clean = v.strip()
    if not v_clean:
        return None
    lower = v_clean.lower()
    if lower.startswith(("javascript:", "data:", "vbscript:", "file:", "about:")):
        raise ValueError("URL scheme is forbidden. Only HTTP and HTTPS URLs are permitted.")
    if not (lower.startswith("http://") or lower.startswith("https://")):
        raise ValueError("URL must be an absolute HTTP or HTTPS URL.")
    return v_clean


# ------------------------------------------------------------------------------
# 1. Projects & Project Members Schemas
# ------------------------------------------------------------------------------

VALID_PROJECT_STATUSES = {"IDEA", "IN_DEVELOPMENT", "COMPLETED", "ARCHIVED"}
VALID_PROJECT_VISIBILITIES = {"PUBLIC", "AUTHENTICATED", "TEAM_ONLY", "HIDDEN"}
VALID_PROJECT_MEMBER_ROLES = {"LEAD", "CONTRIBUTOR", "MENTOR", "ADVISOR"}


class ProjectMemberBase(BaseModel):
    student_id: str
    role: str = Field(default="CONTRIBUTOR")
    display_order: int = Field(default=0)

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        v_upper = v.upper()
        if v_upper not in VALID_PROJECT_MEMBER_ROLES:
            raise ValueError(f"role must be one of: {', '.join(sorted(VALID_PROJECT_MEMBER_ROLES))}")
        return v_upper


class ProjectMemberCreate(ProjectMemberBase):
    pass


class ProjectMemberResponse(ProjectMemberBase):
    id: str
    project_id: str
    created_at: str
    student_full_name: Optional[str] = None
    student_enrollment_number: Optional[str] = None
    student_avatar_url: Optional[str] = None


class ProjectBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    slug: Optional[str] = Field(None, max_length=150)
    summary: str = Field(..., min_length=2, max_length=500)
    description: str = Field(..., min_length=2)
    status: str = Field(default="IN_DEVELOPMENT")
    technology_stack: List[str] = Field(default_factory=list)
    repository_url: Optional[str] = None
    demo_url: Optional[str] = None
    documentation_url: Optional[str] = None
    cover_media_id: Optional[str] = None
    linked_event_id: Optional[str] = None
    visibility: str = Field(default="PUBLIC")
    is_featured: bool = Field(default=False)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        v_upper = v.upper()
        if v_upper not in VALID_PROJECT_STATUSES:
            raise ValueError(f"status must be one of: {', '.join(sorted(VALID_PROJECT_STATUSES))}")
        return v_upper

    @field_validator("visibility")
    @classmethod
    def validate_visibility(cls, v: str) -> str:
        v_upper = v.upper()
        if v_upper not in VALID_PROJECT_VISIBILITIES:
            raise ValueError(f"visibility must be one of: {', '.join(sorted(VALID_PROJECT_VISIBILITIES))}")
        return v_upper

    @field_validator("repository_url", "demo_url", "documentation_url")
    @classmethod
    def validate_urls(cls, v: Optional[str]) -> Optional[str]:
        return validate_safe_http_url(v)


class ProjectCreate(ProjectBase):
    member_student_ids: Optional[List[str]] = Field(default_factory=list)


class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = Field(None, max_length=150)
    summary: Optional[str] = Field(None, min_length=2, max_length=500)
    description: Optional[str] = Field(None, min_length=2)
    status: Optional[str] = None
    technology_stack: Optional[List[str]] = None
    repository_url: Optional[str] = None
    demo_url: Optional[str] = None
    documentation_url: Optional[str] = None
    cover_media_id: Optional[str] = None
    linked_event_id: Optional[str] = None
    visibility: Optional[str] = None
    is_featured: Optional[bool] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_upper = v.upper()
            if v_upper not in VALID_PROJECT_STATUSES:
                raise ValueError(f"status must be one of: {', '.join(sorted(VALID_PROJECT_STATUSES))}")
            return v_upper
        return None

    @field_validator("visibility")
    @classmethod
    def validate_visibility(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_upper = v.upper()
            if v_upper not in VALID_PROJECT_VISIBILITIES:
                raise ValueError(f"visibility must be one of: {', '.join(sorted(VALID_PROJECT_VISIBILITIES))}")
            return v_upper
        return None

    @field_validator("repository_url", "demo_url", "documentation_url")
    @classmethod
    def validate_urls(cls, v: Optional[str]) -> Optional[str]:
        return validate_safe_http_url(v)


class ProjectResponse(ProjectBase):
    id: str
    published_at: Optional[str] = None
    created_by: Optional[str] = None
    linked_event_title: Optional[str] = None
    linked_event_slug: Optional[str] = None
    cover_media_url: Optional[str] = None
    members: List[ProjectMemberResponse] = Field(default_factory=list)
    created_at: str
    updated_at: str


# ------------------------------------------------------------------------------
# 2. Research Items Schemas
# ------------------------------------------------------------------------------

VALID_RESEARCH_CATEGORIES = {
    "AI_ML",
    "COMPUTER_VISION",
    "NLP",
    "REINFORCEMENT_LEARNING",
    "GENERATIVE_AI",
    "ROBOTICS",
    "DATA_SCIENCE",
}
VALID_RESEARCH_STATUSES = {"DRAFT", "PUBLISHED", "ARCHIVED"}
VALID_RESEARCH_VISIBILITIES = {"PUBLIC", "AUTHENTICATED", "HIDDEN"}


class ResearchAuthorSchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    enrollment_number: Optional[str] = None
    affiliation: Optional[str] = None
    role: Optional[str] = None


class ResearchItemBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    slug: Optional[str] = Field(None, max_length=150)
    abstract: str = Field(..., min_length=10)
    authors: List[ResearchAuthorSchema] = Field(default_factory=list)
    category: str = Field(default="AI_ML")
    methodology: Optional[str] = None
    publication_url: Optional[str] = None
    repository_url: Optional[str] = None
    dataset_url: Optional[str] = None
    linked_event_id: Optional[str] = None
    linked_project_id: Optional[str] = None
    visibility: str = Field(default="PUBLIC")

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        v_upper = v.upper()
        if v_upper not in VALID_RESEARCH_CATEGORIES:
            raise ValueError(f"category must be one of: {', '.join(sorted(VALID_RESEARCH_CATEGORIES))}")
        return v_upper

    @field_validator("visibility")
    @classmethod
    def validate_visibility(cls, v: str) -> str:
        v_upper = v.upper()
        if v_upper not in VALID_RESEARCH_VISIBILITIES:
            raise ValueError(f"visibility must be one of: {', '.join(sorted(VALID_RESEARCH_VISIBILITIES))}")
        return v_upper

    @field_validator("publication_url", "repository_url", "dataset_url")
    @classmethod
    def validate_urls(cls, v: Optional[str]) -> Optional[str]:
        return validate_safe_http_url(v)


class ResearchItemCreate(ResearchItemBase):
    status: Optional[str] = Field(default="PUBLISHED")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_upper = v.upper()
            if v_upper not in VALID_RESEARCH_STATUSES:
                raise ValueError(f"status must be one of: {', '.join(sorted(VALID_RESEARCH_STATUSES))}")
            return v_upper
        return None


class ResearchItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = Field(None, max_length=150)
    abstract: Optional[str] = Field(None, min_length=10)
    authors: Optional[List[ResearchAuthorSchema]] = None
    category: Optional[str] = None
    methodology: Optional[str] = None
    publication_url: Optional[str] = None
    repository_url: Optional[str] = None
    dataset_url: Optional[str] = None
    linked_event_id: Optional[str] = None
    linked_project_id: Optional[str] = None
    visibility: Optional[str] = None
    status: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_upper = v.upper()
            if v_upper not in VALID_RESEARCH_CATEGORIES:
                raise ValueError(f"category must be one of: {', '.join(sorted(VALID_RESEARCH_CATEGORIES))}")
            return v_upper
        return None

    @field_validator("visibility")
    @classmethod
    def validate_visibility(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_upper = v.upper()
            if v_upper not in VALID_RESEARCH_VISIBILITIES:
                raise ValueError(f"visibility must be one of: {', '.join(sorted(VALID_RESEARCH_VISIBILITIES))}")
            return v_upper
        return None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_upper = v.upper()
            if v_upper not in VALID_RESEARCH_STATUSES:
                raise ValueError(f"status must be one of: {', '.join(sorted(VALID_RESEARCH_STATUSES))}")
            return v_upper
        return None

    @field_validator("publication_url", "repository_url", "dataset_url")
    @classmethod
    def validate_urls(cls, v: Optional[str]) -> Optional[str]:
        return validate_safe_http_url(v)


class ResearchItemResponse(ResearchItemBase):
    id: str
    status: str
    created_by: Optional[str] = None
    published_at: Optional[str] = None
    linked_event_title: Optional[str] = None
    linked_project_title: Optional[str] = None
    created_at: str
    updated_at: str


# ------------------------------------------------------------------------------
# 3. Learning Resources Schemas
# ------------------------------------------------------------------------------

VALID_LEARNING_RESOURCE_TYPES = {
    "NOTEBOOK",
    "TUTORIAL",
    "WORKSHOP_MATERIAL",
    "RECORDING",
    "DATASET",
    "SLIDES",
    "DOCUMENTATION",
}
VALID_LEARNING_DIFFICULTY_LEVELS = {"BEGINNER", "INTERMEDIATE", "ADVANCED"}
VALID_LEARNING_VISIBILITIES = {"PUBLIC", "AUTHENTICATED", "HIDDEN"}


class LearningResourceBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    slug: Optional[str] = Field(None, max_length=150)
    resource_type: str = Field(default="TUTORIAL")
    difficulty_level: str = Field(default="BEGINNER")
    description: Optional[str] = None
    url: str = Field(...)
    cover_media_id: Optional[str] = None
    linked_event_id: Optional[str] = None
    visibility: str = Field(default="PUBLIC")

    @field_validator("resource_type")
    @classmethod
    def validate_resource_type(cls, v: str) -> str:
        v_upper = v.upper()
        if v_upper not in VALID_LEARNING_RESOURCE_TYPES:
            raise ValueError(f"resource_type must be one of: {', '.join(sorted(VALID_LEARNING_RESOURCE_TYPES))}")
        return v_upper

    @field_validator("difficulty_level")
    @classmethod
    def validate_difficulty_level(cls, v: str) -> str:
        v_upper = v.upper()
        if v_upper not in VALID_LEARNING_DIFFICULTY_LEVELS:
            raise ValueError(f"difficulty_level must be one of: {', '.join(sorted(VALID_LEARNING_DIFFICULTY_LEVELS))}")
        return v_upper

    @field_validator("visibility")
    @classmethod
    def validate_visibility(cls, v: str) -> str:
        v_upper = v.upper()
        if v_upper not in VALID_LEARNING_VISIBILITIES:
            raise ValueError(f"visibility must be one of: {', '.join(sorted(VALID_LEARNING_VISIBILITIES))}")
        return v_upper

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        val = validate_safe_http_url(v)
        if not val:
            raise ValueError("url is required and must be an absolute HTTP or HTTPS URL.")
        return val


class LearningResourceCreate(LearningResourceBase):
    pass


class LearningResourceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = Field(None, max_length=150)
    resource_type: Optional[str] = None
    difficulty_level: Optional[str] = None
    description: Optional[str] = None
    url: Optional[str] = None
    cover_media_id: Optional[str] = None
    linked_event_id: Optional[str] = None
    visibility: Optional[str] = None

    @field_validator("resource_type")
    @classmethod
    def validate_resource_type(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_upper = v.upper()
            if v_upper not in VALID_LEARNING_RESOURCE_TYPES:
                raise ValueError(f"resource_type must be one of: {', '.join(sorted(VALID_LEARNING_RESOURCE_TYPES))}")
            return v_upper
        return None

    @field_validator("difficulty_level")
    @classmethod
    def validate_difficulty_level(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_upper = v.upper()
            if v_upper not in VALID_LEARNING_DIFFICULTY_LEVELS:
                raise ValueError(f"difficulty_level must be one of: {', '.join(sorted(VALID_LEARNING_DIFFICULTY_LEVELS))}")
            return v_upper
        return None

    @field_validator("visibility")
    @classmethod
    def validate_visibility(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v_upper = v.upper()
            if v_upper not in VALID_LEARNING_VISIBILITIES:
                raise ValueError(f"visibility must be one of: {', '.join(sorted(VALID_LEARNING_VISIBILITIES))}")
            return v_upper
        return None

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            val = validate_safe_http_url(v)
            if not val:
                raise ValueError("url cannot be empty.")
            return val
        return None


class LearningResourceResponse(LearningResourceBase):
    id: str
    created_by: Optional[str] = None
    published_at: Optional[str] = None
    cover_media_url: Optional[str] = None
    linked_event_title: Optional[str] = None
    created_at: str
    updated_at: str
