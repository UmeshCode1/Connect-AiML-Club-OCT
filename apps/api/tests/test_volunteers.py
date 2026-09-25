from fastapi.testclient import TestClient
from apps.api.src.main import app

client = TestClient(app)

EVENT_ID = "00000000-0000-0000-0000-000000000101"


def test_list_event_volunteers():
    response = client.get(
        f"/v1/events/{EVENT_ID}/volunteers",
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "data" in body
    assert len(body["data"]) >= 1
    assert body["data"][0]["role"] == "ATTENDANCE"


def test_assign_volunteer_success():
    payload = {
        "enrollment_number": "0126AL221099",
        "student_name": "Manish Gupta",
        "role": "SESSION_SUPPORT",
    }
    response = client.post(
        f"/v1/events/{EVENT_ID}/volunteers",
        json=payload,
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert response.status_code == 201
    body = response.json()["data"]
    assert body["enrollment_number"] == "0126AL221099"
    assert body["role"] == "SESSION_SUPPORT"
    assert body["status"] == "ASSIGNED"


def test_volunteer_scoped_permission_boundary():
    # 1. Volunteer CAN mark attendance
    # Try check-out via volunteer token
    co_res = client.post(
        "/v1/sessions/00000000-0000-0000-0000-000000000501/attendance/check-out",
        json={"enrollment_number": "0126AL221001"},
        headers={"Authorization": "Bearer dev-volunteer-token"},
    )
    assert co_res.status_code in (200, 400) # either succeeds or notes no check-in, but NOT 403

    # 2. Volunteer CANNOT create an event (must be 403)
    evt_res = client.post(
        "/v1/events",
        json={"title": "Volunteer Rogue Event"},
        headers={"Authorization": "Bearer dev-volunteer-token"},
    )
    assert evt_res.status_code == 403
    assert evt_res.json()["error"]["code"] == "PERMISSION_DENIED"

    # 3. Volunteer CANNOT publish event (must be 403)
    pub_res = client.post(
        f"/v1/events/{EVENT_ID}/publish",
        headers={"Authorization": "Bearer dev-volunteer-token"},
    )
    assert pub_res.status_code == 403
    assert pub_res.json()["error"]["code"] == "PERMISSION_DENIED"


def test_remove_volunteer_assignment():
    # List volunteers
    vols = client.get(
        f"/v1/events/{EVENT_ID}/volunteers",
        headers={"Authorization": "Bearer dev-admin-token"},
    ).json()["data"]
    assignment_id = vols[0]["id"]

    del_res = client.delete(
        f"/v1/events/{EVENT_ID}/volunteers/{assignment_id}",
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert del_res.status_code == 200
    assert del_res.json()["data"]["status"] == "CANCELLED"


def test_assign_volunteer_duplicate_prevention():
    """
    Validates that assigning the same volunteer to an event multiple times
    is rejected with a 409 Conflict error, enforcing uniqueness.
    """
    payload = {
        "enrollment_number": "0126AL221088",
        "student_name": "Rohan Sharma",
        "role": "REGISTRATION",
    }
    # First assignment succeeds
    res1 = client.post(
        f"/v1/events/{EVENT_ID}/volunteers",
        json=payload,
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert res1.status_code == 201

    # Second assignment with duplicate enrollment for same event is rejected
    res2 = client.post(
        f"/v1/events/{EVENT_ID}/volunteers",
        json=payload,
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert res2.status_code == 409
    assert "already assigned" in res2.json()["error"]["message"]


def test_volunteer_assignments_unique_constraint_migration():
    """
    Verifies that migration 20260925000008_volunteer_assignments_constraint.sql
    enforces the canonical uq_event_volunteer_session_role unique constraint.
    """
    import os
    migrations_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../supabase/migrations"))
    m8_path = os.path.join(migrations_dir, "20260925000008_volunteer_assignments_constraint.sql")
    assert os.path.isfile(m8_path), "Migration 000008 file must exist"

    with open(m8_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "uq_event_volunteer_session_role" in content
    assert "UNIQUE (event_id, student_id, session_id, role)" in content

