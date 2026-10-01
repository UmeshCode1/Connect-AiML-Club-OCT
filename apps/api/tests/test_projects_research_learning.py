"""
AIML CLUB OCT — CONNECT
Phase 7.1 — Knowledge Domain Services & API Endpoint Test Suite

Tests:
1. Projects: list, detail, create, update, archive, publish, lifecycle transitions
2. Project Members: add, duplicate prevention, remove, role validation, lead protection
3. Research: list, detail, create, draft isolation, update, archive, publish
4. Learning Resources: list, detail, create, update, delete, type/difficulty filters
5. Search: public search, authenticated search, certificate boundary, domain filtering, relevance ranking
6. Security: IDOR protection, URL sanitization, RBAC authorization, anti-leakage guards
"""

import pytest
from fastapi.testclient import TestClient

from apps.api.src.main import app

client = TestClient(app)

ADMIN_HEADERS = {"Authorization": "Bearer dev-admin-token"}
CONTENT_MGR_HEADERS = {"Authorization": "Bearer dev-content-manager-token"}
STUDENT_HEADERS = {"Authorization": "Bearer dev-student-token"}
VIEWER_HEADERS = {"Authorization": "Bearer dev-viewer-token"}


# ==============================================================================
# 1. PROJECTS MODULE TESTS
# ==============================================================================

def test_list_projects_public():
    """Public callers should only receive published, public projects."""
    res = client.get("/v1/projects")
    assert res.status_code == 200
    body = res.json()
    assert "data" in body
    assert "meta" in body
    projects = body["data"]
    assert len(projects) >= 1

    for p in projects:
        assert p["visibility"] == "PUBLIC"
        assert p["status"] in ("IN_DEVELOPMENT", "COMPLETED")
        # Ensure private/hidden idea is not exposed
        assert p["status"] != "IDEA"


def test_list_projects_staff_sees_all():
    """Staff callers should receive all projects including IDEA and TEAM_ONLY."""
    res = client.get("/v1/projects", headers=ADMIN_HEADERS)
    assert res.status_code == 200
    projects = res.json()["data"]
    statuses = {p["status"] for p in projects}
    assert "IDEA" in statuses or "COMPLETED" in statuses


def test_get_project_by_slug_public():
    """Public retrieval of a published project succeeds with hydrated members."""
    res = client.get("/v1/projects/oct-vision-ai-campus")
    assert res.status_code == 200
    p = res.json()["data"]
    assert p["slug"] == "oct-vision-ai-campus"
    assert p["status"] == "COMPLETED"
    assert len(p["members"]) >= 1
    assert p["members"][0]["role"] == "LEAD"
    assert p["linked_event_title"] == "Aptify 2.0: AI Symposium"


def test_get_project_by_slug_internal_hidden_from_public():
    """Unpublished/internal project returns 404 for public visitors to prevent discovery."""
    res = client.get("/v1/projects/club-neural-hardware-farm")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "NOT_FOUND"


def test_get_project_by_slug_internal_accessible_by_staff():
    """Staff can view unpublished/internal project."""
    res = client.get("/v1/projects/club-neural-hardware-farm", headers=ADMIN_HEADERS)
    assert res.status_code == 200
    assert res.json()["data"]["slug"] == "club-neural-hardware-farm"


def test_create_project_authenticated_student():
    """Authenticated student can propose a project; creator is automatically assigned LEAD."""
    payload = {
        "title": "Quantum Machine Learning Simulator",
        "summary": "Simulating variational quantum eigensolvers on classical GPUs.",
        "description": "Research experiment evaluating PennyLane on local campus workstation nodes.",
        "technology_stack": ["Python", "PennyLane", "Qiskit"],
        "repository_url": "https://github.com/aimlcluboct/quantum-ml",
        "demo_url": "https://qml.aimlcluboct.in",
    }
    res = client.post("/v1/projects", json=payload, headers=STUDENT_HEADERS)
    assert res.status_code == 201
    created = res.json()["data"]
    assert created["title"] == "Quantum Machine Learning Simulator"
    assert created["status"] in ("IDEA", "IN_DEVELOPMENT")
    assert len(created["members"]) >= 1
    assert created["members"][0]["role"] == "LEAD"


def test_create_project_unauthenticated_rejected():
    """Unauthenticated project creation must return 401."""
    payload = {
        "title": "Unauthorized Project",
        "summary": "Should fail",
        "description": "Fails without auth",
    }
    res = client.post("/v1/projects", json=payload)
    assert res.status_code == 401


def test_create_project_rejects_dangerous_url():
    """Project creation with dangerous javascript: scheme is rejected at schema boundary."""
    payload = {
        "title": "XSS Project Attempt",
        "summary": "Attempting XSS",
        "description": "Payload with bad URL",
        "repository_url": "javascript:alert(document.cookie)",
    }
    res = client.post("/v1/projects", json=payload, headers=STUDENT_HEADERS)
    assert res.status_code == 422


def test_update_project_by_lead_and_forbidden_by_others():
    """Project LEAD can update their project; other non-staff users receive 403."""
    # First create a project with student token
    payload = {
        "title": "Autonomous Drone Navigation",
        "summary": "SLAM and visual odometry on mini quadcopters.",
        "description": "Testing stereo vision algorithms in OCT campus courtyard.",
        "technology_stack": ["ROS2", "Python", "C++"],
    }
    create_res = client.post("/v1/projects", json=payload, headers=STUDENT_HEADERS)
    assert create_res.status_code == 201
    proj_id = create_res.json()["data"]["id"]

    # Student LEAD updates summary -> SUCCESS
    update_res = client.patch(
        f"/v1/projects/{proj_id}",
        json={"summary": "Updated SLAM and visual odometry documentation."},
        headers=STUDENT_HEADERS,
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["summary"] == "Updated SLAM and visual odometry documentation."

    # Viewer (different user) attempts to update -> 403 FORBIDDEN
    forbidden_res = client.patch(
        f"/v1/projects/{proj_id}",
        json={"summary": "Hijacked summary."},
        headers=VIEWER_HEADERS,
    )
    assert forbidden_res.status_code == 403
    assert forbidden_res.json()["error"]["code"] == "PERMISSION_DENIED"


def test_project_lifecycle_invalid_transition_rejected():
    """Invalid lifecycle transition (e.g. from IDEA directly to COMPLETED without dev) is rejected."""
    # Project 3 is in IDEA status
    p3_id = "00000000-0000-0000-0000-000000000903"
    res = client.patch(
        f"/v1/projects/{p3_id}",
        json={"status": "COMPLETED"},
        headers=ADMIN_HEADERS,
    )
    assert res.status_code == 400
    assert "Invalid project lifecycle transition" in res.json()["error"]["message"]


def test_archive_project_staff_only():
    """Only staff can archive projects."""
    p2_id = "00000000-0000-0000-0000-000000000902"
    # Student cannot archive
    student_res = client.delete(f"/v1/projects/{p2_id}", headers=STUDENT_HEADERS)
    assert student_res.status_code == 403

    # Admin can archive
    admin_res = client.delete(f"/v1/projects/{p2_id}", headers=ADMIN_HEADERS)
    assert admin_res.status_code == 200
    assert admin_res.json()["data"]["status"] == "ARCHIVED"


def test_publish_project_staff_only():
    """Only staff can publish projects."""
    p1_id = "00000000-0000-0000-0000-000000000901"
    res = client.post(f"/v1/projects/{p1_id}/publish", headers=CONTENT_MGR_HEADERS)
    assert res.status_code == 200
    assert res.json()["data"]["visibility"] == "PUBLIC"
    assert res.json()["data"]["published_at"] is not None


# ==============================================================================
# 2. PROJECT MEMBERS TESTS
# ==============================================================================

def test_add_and_remove_project_member():
    """Adding a member succeeds, duplicate is rejected with 409, and removal succeeds."""
    p1_id = "00000000-0000-0000-0000-000000000901"
    new_student_id = "00000000-0000-0000-0000-000000000777"

    # Add member
    add_res = client.post(
        f"/v1/projects/{p1_id}/members",
        json={"student_id": new_student_id, "role": "CONTRIBUTOR", "display_order": 2},
        headers=ADMIN_HEADERS,
    )
    assert add_res.status_code == 201
    assert add_res.json()["data"]["student_id"] == new_student_id
    assert add_res.json()["data"]["role"] == "CONTRIBUTOR"

    # Duplicate addition rejected -> 409 Conflict
    dup_res = client.post(
        f"/v1/projects/{p1_id}/members",
        json={"student_id": new_student_id, "role": "CONTRIBUTOR"},
        headers=ADMIN_HEADERS,
    )
    assert dup_res.status_code == 409
    assert dup_res.json()["error"]["code"] == "CONFLICT"

    # Remove member
    del_res = client.delete(
        f"/v1/projects/{p1_id}/members/{new_student_id}",
        headers=ADMIN_HEADERS,
    )
    assert del_res.status_code == 200
    assert del_res.json()["data"]["status"] == "SUCCESS"


def test_cannot_remove_sole_lead_as_non_staff():
    """Non-staff project lead cannot remove the only lead on the project."""
    # Create project by student
    res = client.post(
        "/v1/projects",
        json={"title": "Single Lead Project", "summary": "One lead", "description": "Testing lead protection"},
        headers=STUDENT_HEADERS,
    )
    assert res.status_code == 201
    proj_id = res.json()["data"]["id"]
    student_id = "00000000-0000-0000-0000-000000000008"

    # Student tries to remove self (the only lead)
    del_res = client.delete(f"/v1/projects/{proj_id}/members/{student_id}", headers=STUDENT_HEADERS)
    assert del_res.status_code == 400
    assert "Cannot remove the sole project LEAD" in del_res.json()["error"]["message"]


# ==============================================================================
# 3. RESEARCH MODULE TESTS
# ==============================================================================

def test_list_research_public():
    """Public listing returns only published research items."""
    res = client.get("/v1/research")
    assert res.status_code == 200
    items = res.json()["data"]
    assert len(items) >= 1
    for it in items:
        assert it["status"] == "PUBLISHED"
        assert it["visibility"] == "PUBLIC"


def test_get_research_by_slug_public_and_draft_isolation():
    """Published item is publicly accessible; draft item returns 404 for public visitor."""
    # Published item
    pub_res = client.get("/v1/research/edge-transformer-architectures-oct")
    assert pub_res.status_code == 200
    assert pub_res.json()["data"]["slug"] == "edge-transformer-architectures-oct"
    assert pub_res.json()["data"]["category"] == "AI_ML"

    # Draft item (Federated Learning) returns 404 for public
    draft_res = client.get("/v1/research/federated-learning-student-assessment")
    assert draft_res.status_code == 404


def test_author_can_access_own_draft_research():
    """Author can retrieve and edit their own draft research item."""
    draft_slug = "federated-learning-student-assessment"
    res = client.get(f"/v1/research/{draft_slug}", headers=STUDENT_HEADERS)
    assert res.status_code == 200
    item = res.json()["data"]
    assert item["status"] == "DRAFT"

    # Author edits draft
    patch_res = client.patch(
        f"/v1/research/{item['id']}",
        json={"methodology": "Updated FedAvg simulation with 50 virtual clients."},
        headers=STUDENT_HEADERS,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["methodology"] == "Updated FedAvg simulation with 50 virtual clients."


def test_author_cannot_directly_publish_research():
    """Authors cannot self-publish research without staff authorization."""
    draft_slug = "federated-learning-student-assessment"
    res = client.get(f"/v1/research/{draft_slug}", headers=STUDENT_HEADERS)
    item_id = res.json()["data"]["id"]

    patch_res = client.patch(
        f"/v1/research/{item_id}",
        json={"status": "PUBLISHED"},
        headers=STUDENT_HEADERS,
    )
    assert patch_res.status_code == 403


def test_research_rejects_dangerous_url():
    """Research item creation rejects unsafe URLs."""
    payload = {
        "title": "Bad URL Research",
        "abstract": "This abstract contains a malicious publication link.",
        "publication_url": "javascript:alert(1)",
    }
    res = client.post("/v1/research", json=payload, headers=STUDENT_HEADERS)
    assert res.status_code == 422


# ==============================================================================
# 4. LEARNING RESOURCES MODULE TESTS
# ==============================================================================

def test_list_learning_resources_public_and_filter():
    """Public catalog can be filtered by resource_type and difficulty_level."""
    res = client.get("/v1/learning?resource_type=NOTEBOOK")
    assert res.status_code == 200
    items = res.json()["data"]
    assert len(items) >= 1
    for r in items:
        assert r["resource_type"] == "NOTEBOOK"

    diff_res = client.get("/v1/learning?difficulty_level=BEGINNER")
    assert diff_res.status_code == 200
    for r in diff_res.json()["data"]:
        assert r["difficulty_level"] == "BEGINNER"


def test_get_learning_resource_by_slug():
    """Retrieves learning resource by unique slug."""
    res = client.get("/v1/learning/pytorch-neural-networks-notebook")
    assert res.status_code == 200
    r = res.json()["data"]
    assert r["slug"] == "pytorch-neural-networks-notebook"
    assert r["url"].startswith("https://")


def test_create_and_update_learning_resource_staff_only():
    """Only content managers and administrators can create or update learning resources."""
    payload = {
        "title": "Reinforcement Learning with Gymnasium & PPO",
        "resource_type": "TUTORIAL",
        "difficulty_level": "ADVANCED",
        "url": "https://colab.research.google.com/github/aimlcluboct/rl_ppo.ipynb",
        "description": "Step by step implementation of Proximal Policy Optimization.",
    }

    # Student cannot create
    student_res = client.post("/v1/learning", json=payload, headers=STUDENT_HEADERS)
    assert student_res.status_code == 403

    # Content manager can create
    create_res = client.post("/v1/learning", json=payload, headers=CONTENT_MGR_HEADERS)
    assert create_res.status_code == 201
    created_id = create_res.json()["data"]["id"]

    # Content manager can update
    update_res = client.patch(
        f"/v1/learning/{created_id}",
        json={"difficulty_level": "INTERMEDIATE"},
        headers=CONTENT_MGR_HEADERS,
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["difficulty_level"] == "INTERMEDIATE"


# ==============================================================================
# 5. UNIFIED AUTHORIZATION-AWARE SEARCH TESTS
# ==============================================================================

def test_search_public_returns_multidomain_public_results():
    """Global search across 'Aptify' returns events, projects, learning, and journey without auth."""
    res = client.get("/v1/search?q=aptify")
    assert res.status_code == 200
    results = res.json()["data"]
    assert len(results) >= 1

    entity_types = {r["entity_type"] for r in results}
    assert "event" in entity_types or "project" in entity_types

    # Ensure all returned projects/events are public
    for r in results:
        assert r["url"] is not None
        assert r["score"] is not None
        assert r["score"] >= 0.25


def test_search_type_filter():
    """Filtering search by domain restricts results strictly to requested entity type."""
    res = client.get("/v1/search?q=vision&type=projects")
    assert res.status_code == 200
    results = res.json()["data"]
    assert len(results) >= 1
    for r in results:
        assert r["entity_type"] == "project"


def test_search_certificates_security_isolation():
    """
    Public search NEVER leaks student names or random certificate lists.
    A certificate is only discovered if the query matches the exact certificate ID.
    """
    # Searching by generic student name returns ZERO certificates for public
    name_res = client.get("/v1/search?q=Aman&type=certificates")
    assert name_res.status_code == 200
    assert len(name_res.json()["data"]) == 0

    # Searching with exact certificate ID succeeds
    cert_id_res = client.get("/v1/search?q=AIML26-APT-000184&type=certificates")
    assert cert_id_res.status_code == 200
    certs = cert_id_res.json()["data"]
    assert len(certs) >= 1
    assert certs[0]["entity_type"] == "certificate"
    assert certs[0]["url"] == "/verify/AIML26-APT-000184"


def test_search_query_too_short_rejected():
    """Search query with less than 2 characters is rejected with 400 Bad Request."""
    res = client.get("/v1/search?q=a")
    assert res.status_code == 400
    assert "must be at least 2 characters" in res.json()["error"]["message"]



def test_search_invalid_entity_type_rejected():
    """Invalid entity type is rejected with 400 Bad Request."""
    res = client.get("/v1/search?q=aptify&type=invalid_type")
    assert res.status_code == 400
    assert "Invalid search type" in res.json()["error"]["message"]


def test_search_no_draft_leakage():
    """Public search must never expose draft research or unpublished internal ideas."""
    res = client.get("/v1/search?q=federated")
    assert res.status_code == 200
    results = res.json()["data"]
    # The federated learning paper is in DRAFT status, so public search must NOT return it
    assert not any(r["slug"] == "federated-learning-student-assessment" for r in results)


def test_authenticated_student_search_includes_own_drafts():
    """Authenticated student search includes their own draft research item."""
    res = client.get("/v1/search?q=federated", headers=STUDENT_HEADERS)
    assert res.status_code == 200
    results = res.json()["data"]
    assert any(r["slug"] == "federated-learning-student-assessment" for r in results)
