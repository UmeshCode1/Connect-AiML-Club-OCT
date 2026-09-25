from fastapi.testclient import TestClient
from apps.api.src.main import app

client = TestClient(app)

ADMIN_AUTH = {"Authorization": "Bearer dev-admin-token"}
CONTENT_AUTH = {"Authorization": "Bearer dev-content-manager-token"}
EVENT_AUTH = {"Authorization": "Bearer dev-event-manager-token"}
MEDIA_AUTH = {"Authorization": "Bearer dev-media-manager-token"}
CERT_AUTH = {"Authorization": "Bearer dev-cert-manager-token"}
VOLUNTEER_AUTH = {"Authorization": "Bearer dev-volunteer-token"}
VIEWER_AUTH = {"Authorization": "Bearer dev-viewer-token"}
STUDENT_AUTH = {"Authorization": "Bearer dev-student-token"}
SUPER_AUTH = {"Authorization": "Bearer dev-super-token"}

APTIFY_EVENT_ID = "00000000-0000-0000-0000-000000000101"


# ==============================================================================
# 1. Chronicle Tests
# ==============================================================================

def test_chronicle_editorial_lifecycle_complete():
    # 1. Create DRAFT entry as CONTENT_MANAGER
    payload = {
        "title": "Quantum Machine Learning at OCT",
        "slug": "quantum-ml-oct-2026",
        "edition_type": "RESEARCH_DIGEST",
        "excerpt": "A deep dive into quantum computing and QML algorithms.",
        "content": "# Quantum ML\n\nStudent researchers exploring PennyLane and Qiskit.",
        "visibility": "PUBLIC",
        "linked_event_ids": [APTIFY_EVENT_ID],
    }
    create_res = client.post("/v1/chronicle", json=payload, headers=CONTENT_AUTH)
    assert create_res.status_code == 201
    entry = create_res.json()["data"]
    entry_id = entry["id"]
    assert entry["status"] == "DRAFT"
    assert entry["slug"] == "quantum-ml-oct-2026"
    assert len(entry["linked_events"]) == 1
    assert entry["linked_events"][0]["event_id"] == APTIFY_EVENT_ID

    # 2. Public caller CANNOT view unpublished draft
    public_res = client.get(f"/v1/chronicle/{entry['slug']}")
    assert public_res.status_code == 404

    # 3. Submit for Review
    review_res = client.post(f"/v1/chronicle/{entry_id}/submit-review", headers=CONTENT_AUTH)
    assert review_res.status_code == 200
    assert review_res.json()["data"]["status"] == "REVIEW"

    # 4. Approve
    approve_res = client.post(f"/v1/chronicle/{entry_id}/approve", headers=ADMIN_AUTH)
    assert approve_res.status_code == 200
    assert approve_res.json()["data"]["approved_by"] is not None

    # 5. Publish
    pub_res = client.post(f"/v1/chronicle/{entry_id}/publish", headers=ADMIN_AUTH)
    assert pub_res.status_code == 200
    assert pub_res.json()["data"]["status"] == "PUBLISHED"
    assert pub_res.json()["data"]["published_at"] is not None

    # 6. Now public caller CAN view the publication
    public_view = client.get(f"/v1/chronicle/{entry['slug']}")
    assert public_view.status_code == 200
    assert public_view.json()["data"]["title"] == "Quantum Machine Learning at OCT"


def test_chronicle_slug_uniqueness():
    payload = {
        "title": "Unique Edition",
        "slug": "unique-edition-slug",
        "content": "First edition text",
    }
    res1 = client.post("/v1/chronicle", json=payload, headers=ADMIN_AUTH)
    assert res1.status_code == 201

    # Attempt duplicate slug
    res2 = client.post("/v1/chronicle", json=payload, headers=ADMIN_AUTH)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["error"]["message"]


def test_chronicle_rbac_enforcement():
    payload = {
        "title": "Unauthorized Chronicle",
        "content": "Attempting to create with unauthorized roles",
    }
    # Viewer must be denied 403
    res_viewer = client.post("/v1/chronicle", json=payload, headers=VIEWER_AUTH)
    assert res_viewer.status_code == 403

    # Volunteer must be denied 403
    res_vol = client.post("/v1/chronicle", json=payload, headers=VOLUNTEER_AUTH)
    assert res_vol.status_code == 403

    # Media Manager must be denied 403
    res_mm = client.post("/v1/chronicle", json=payload, headers=MEDIA_AUTH)
    assert res_mm.status_code == 403

    # Certificate Manager must be denied 403
    res_cm = client.post("/v1/chronicle", json=payload, headers=CERT_AUTH)
    assert res_cm.status_code == 403


# ==============================================================================
# 2. Journey Tests
# ==============================================================================

def test_journey_milestone_lifecycle_and_linking():
    # 1. Create milestone linking to canonical Aptify event
    payload = {
        "title": "OCT Wins State AI Innovation Championship",
        "slug": "oct-wins-state-ai-championship",
        "milestone_date": "2025-11-10",
        "milestone_type": "ACHIEVEMENT",
        "description": "Student delegation secured 1st prize in the State AI Innovation Challenge.",
        "linked_event_id": APTIFY_EVENT_ID,
        "external_link": "https://aimlcluboct.in/journey",
        "status": "DRAFT",
    }
    create_res = client.post("/v1/journey", json=payload, headers=CONTENT_AUTH)
    assert create_res.status_code == 201
    ms = create_res.json()["data"]
    ms_id = ms["id"]
    assert ms["status"] == "DRAFT"
    assert ms["linked_event_title"] == "Aptify 2.0: AI Symposium"

    # 2. Public cannot view draft
    public_res = client.get(f"/v1/journey/{ms['slug']}")
    assert public_res.status_code == 404

    # 3. Publish milestone
    pub_res = client.post(f"/v1/journey/{ms_id}/publish", headers=ADMIN_AUTH)
    assert pub_res.status_code == 200
    assert pub_res.json()["data"]["status"] == "PUBLISHED"

    # 4. Public can view published milestone
    public_view = client.get(f"/v1/journey/{ms['slug']}")
    assert public_view.status_code == 200
    assert public_view.json()["data"]["title"] == "OCT Wins State AI Innovation Championship"


def test_journey_invalid_event_reference_rejected():
    payload = {
        "title": "Milestone With Bogus Event",
        "slug": "milestone-bogus-event",
        "milestone_date": "2026-01-01",
        "milestone_type": "EVENT",
        "description": "Attempting to link non-existent event.",
        "linked_event_id": "00000000-0000-0000-0000-999999999999",
    }
    res = client.post("/v1/journey", json=payload, headers=ADMIN_AUTH)
    assert res.status_code == 404
    assert "Canonical Event" in res.json()["error"]["message"]


def test_journey_rbac_enforcement():
    payload = {
        "title": "Unauthorized Milestone",
        "milestone_date": "2026-01-01",
        "description": "Forbidden creation",
    }
    assert client.post("/v1/journey", json=payload, headers=VIEWER_AUTH).status_code == 403
    assert client.post("/v1/journey", json=payload, headers=VOLUNTEER_AUTH).status_code == 403
    assert client.post("/v1/journey", json=payload, headers=CERT_AUTH).status_code == 403


# ==============================================================================
# 3. Feedback Tests
# ==============================================================================

def test_feedback_submission_and_privacy_boundaries():
    # 1. Student submits feedback with ANONYMOUS consent
    payload = {
        "rating": 5,
        "feedback_text": "Great workshop on transformer attention mechanisms!",
        "suggestion_text": "More hands-on PyTorch coding time.",
        "publication_consent": "ANONYMOUS",
    }
    submit_res = client.post(
        f"/v1/events/{APTIFY_EVENT_ID}/feedback",
        json=payload,
        headers=STUDENT_AUTH,
    )
    assert submit_res.status_code == 201
    fb = submit_res.json()["data"]
    fb_id = fb["id"]
    assert fb["rating"] == 5
    assert fb["moderation_status"] == "PENDING"
    assert fb["visibility"] == "ADMIN_ONLY"
    assert fb["is_anonymous"] is True

    # 2. Duplicate submission prevention
    dup_res = client.post(
        f"/v1/events/{APTIFY_EVENT_ID}/feedback",
        json=payload,
        headers=STUDENT_AUTH,
    )
    assert dup_res.status_code == 409
    assert "already been submitted" in dup_res.json()["error"]["message"]

    # 3. Public feedback listing does NOT include unmoderated / pending feedback
    public_list = client.get(f"/v1/events/{APTIFY_EVENT_ID}/feedback")
    assert public_list.status_code == 200
    public_items = public_list.json()["data"]
    for item in public_items:
        # None of the public items should have the unmoderated ID
        assert item["id"] != fb_id
        # Public feedback MUST NOT expose student ID or email
        assert "student_id" not in item
        assert "email" not in item
        assert "phone" not in item

    # 4. Moderate feedback -> APPROVE
    mod_res = client.patch(
        f"/v1/feedback/{fb_id}",
        json={"moderation_status": "APPROVED", "visibility": "PUBLIC"},
        headers=CONTENT_AUTH,
    )
    assert mod_res.status_code == 200
    assert mod_res.json()["data"]["moderation_status"] == "APPROVED"

    # 5. Now it is visible publicly with author_name = "Anonymous Participant"
    public_list_after = client.get(f"/v1/events/{APTIFY_EVENT_ID}/feedback")
    assert public_list_after.status_code == 200
    approved_items = public_list_after.json()["data"]
    target = next((item for item in approved_items if item["id"] == fb_id), None)
    assert target is not None
    assert target["author_name"] == "Anonymous Participant"
    assert target["is_anonymous"] is True


def test_feedback_attributed_consent_preserves_allowed_name():
    # Another student account (dev-viewer-token) submits feedback with PUBLIC_NAME
    payload = {
        "rating": 4,
        "feedback_text": "Excellent guest speaker from robotics research center.",
        "publication_consent": "PUBLIC_NAME",
    }
    submit_res = client.post(
        f"/v1/events/{APTIFY_EVENT_ID}/feedback",
        json=payload,
        headers=VIEWER_AUTH,
    )
    assert submit_res.status_code == 201
    fb_id = submit_res.json()["data"]["id"]

    # Approve and publish
    pub_res = client.post(f"/v1/feedback/{fb_id}/publish", headers=ADMIN_AUTH)
    assert pub_res.status_code == 200

    # Public view must show author_name as viewer (name portion of email), NOT leaking email or phone
    public_list = client.get(f"/v1/events/{APTIFY_EVENT_ID}/feedback")
    target = next((item for item in public_list.json()["data"] if item["id"] == fb_id), None)
    assert target is not None
    assert target["author_name"] == "viewer"
    assert "@" not in target["author_name"]
    assert "email" not in target
    assert "phone" not in target


def test_feedback_summary_statistics():
    res = client.get(f"/v1/events/{APTIFY_EVENT_ID}/feedback/summary")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["event_id"] == APTIFY_EVENT_ID
    assert data["total_feedback"] >= 1
    assert "rating_distribution" in data
    assert data["average_rating"] > 0


def test_feedback_rbac_enforcement():
    # Viewer cannot moderate feedback
    mod_res = client.patch(
        "/v1/feedback/00000000-0000-0000-0000-000000000901",
        json={"moderation_status": "REJECTED"},
        headers=VIEWER_AUTH,
    )
    assert mod_res.status_code == 403

    # Volunteer cannot moderate feedback
    assert client.patch(
        "/v1/feedback/00000000-0000-0000-0000-000000000901",
        json={"moderation_status": "REJECTED"},
        headers=VOLUNTEER_AUTH,
    ).status_code == 403

    # EVENT_MANAGER cannot publish/moderate feedback (has feedback.view, but requires feedback.publish)
    assert client.post(
        "/v1/feedback/00000000-0000-0000-0000-000000000901/publish",
        headers=EVENT_AUTH,
    ).status_code == 403


# ==============================================================================
# 4. Migration Chain & RLS Structure Tests (000001 -> 000007)
# ==============================================================================

def test_full_migration_chain_integrity():
    import os
    migrations_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "supabase", "migrations")
    expected = [
        "20260925000001_initial_schema.sql",
        "20260925000002_event_engine.sql",
        "20260925000003_attendance_operations.sql",
        "20260925000004_media_intelligence.sql",
        "20260925000005_certificate_engine.sql",
        "20260925000006_database_foundation_reconciliation.sql",
        "20260925000007_chronicle_journey_feedback.sql",
    ]
    for fn in expected:
        p = os.path.join(migrations_dir, fn)
        assert os.path.isfile(p), f"Migration missing: {fn}"

    # Verify migration 000007 schema requirements
    p_07 = os.path.join(migrations_dir, "20260925000007_chronicle_journey_feedback.sql")
    with open(p_07, "r", encoding="utf-8") as f:
        content = f.read()

    # Tables created
    assert "CREATE TABLE IF NOT EXISTS chronicle_entries" in content
    assert "CREATE TABLE IF NOT EXISTS event_chronicle_items" in content
    assert "CREATE TABLE IF NOT EXISTS journey_milestones" in content
    assert "CREATE TABLE IF NOT EXISTS feedback" in content

    # RLS enabled
    assert "ALTER TABLE chronicle_entries ENABLE ROW LEVEL SECURITY" in content
    assert "ALTER TABLE event_chronicle_items ENABLE ROW LEVEL SECURITY" in content
    assert "ALTER TABLE journey_milestones ENABLE ROW LEVEL SECURITY" in content
    assert "ALTER TABLE feedback ENABLE ROW LEVEL SECURITY" in content

    # Constraints & indexes
    assert "uq_event_student_feedback" in content
    assert "rating >= 1 AND rating <= 5" in content
    assert "idx_chronicle_slug" in content
    assert "idx_journey_date" in content
    assert "idx_feedback_event_mod" in content

    # Canonical RBAC helper used - NO legacy role references
    assert "public.check_user_has_role" in content
    assert "user_roles" not in content
    assert "roles r" not in content

