from fastapi.testclient import TestClient
from apps.api.src.main import app

client = TestClient(app)


def test_student_registration_success():
    # Aptify 2.0 is seeded with status REGISTRATION_OPEN
    payload = {
        "full_name": "Priya Sharma",
        "enrollment_number": "0126AL221088",
        "email": "priya.sharma@example.com",
        "phone": "9811223344",
        "department": "AIML",
        "semester": "VI",
        "team_name": "Visionary AI",
    }
    response = client.post("/v1/events/00000000-0000-0000-0000-000000000101/participants", json=payload)
    assert response.status_code == 201
    body = response.json()
    assert body["data"]["student_name"] == "Priya Sharma"
    assert body["data"]["enrollment_number"] == "0126AL221088"
    assert body["data"]["registration_status"] in ("CONFIRMED", "REGISTERED")


def test_duplicate_registration_rejected():
    # Register Priya again -> must be rejected with 409
    payload = {
        "full_name": "Priya Sharma",
        "enrollment_number": "0126AL221088",
        "email": "priya.sharma@example.com",
    }
    response = client.post("/v1/events/00000000-0000-0000-0000-000000000101/participants", json=payload)
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "CONFLICT"
    assert "already registered" in response.json()["error"]["message"]


def test_registration_when_not_open_rejected():
    # 1. Create a DRAFT event
    create_res = client.post(
        "/v1/events",
        json={"title": "Draft Event Not Open"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    event_id = create_res.json()["data"]["id"]

    # 2. Try registering -> must be rejected with 400
    payload = {
        "full_name": "Rahul Mehra",
        "enrollment_number": "0126AL221099",
        "email": "rahul.mehra@example.com",
    }
    response = client.post(f"/v1/events/{event_id}/participants", json=payload)
    assert response.status_code == 400
    assert "Registration is not open" in response.json()["error"]["message"]


def test_capacity_waitlist_handling():
    # 1. Create an event with capacity = 1
    create_res = client.post(
        "/v1/events",
        json={"title": "Micro Workshop", "capacity": 1},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    event_id = create_res.json()["data"]["id"]

    # Transition to PLANNING then REGISTRATION_OPEN
    client.post(
        f"/v1/events/{event_id}/transition",
        json={"to_status": "PLANNING"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    client.post(
        f"/v1/events/{event_id}/transition",
        json={"to_status": "REGISTRATION_OPEN"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )

    # 2. Register first student -> CONFIRMED
    res_1 = client.post(
        f"/v1/events/{event_id}/participants",
        json={"full_name": "Student One", "enrollment_number": "0126AL221001", "email": "s1@example.com"},
    )
    assert res_1.status_code == 201
    assert res_1.json()["data"]["registration_status"] == "CONFIRMED"

    # 3. Register second student -> WAITLISTED
    res_2 = client.post(
        f"/v1/events/{event_id}/participants",
        json={"full_name": "Student Two", "enrollment_number": "0126AL221002", "email": "s2@example.com"},
    )
    assert res_2.status_code == 201
    assert res_2.json()["data"]["registration_status"] == "WAITLISTED"


def test_list_participants_permission():
    # Unauthenticated / unauthorized cannot inspect participants list (protecting student privacy)
    response = client.get("/v1/events/00000000-0000-0000-0000-000000000101/participants")
    assert response.status_code == 401

    # Authorized admin can inspect participants
    auth_response = client.get(
        "/v1/events/00000000-0000-0000-0000-000000000101/participants",
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert auth_response.status_code == 200
    assert len(auth_response.json()["data"]) >= 1


def test_cancel_participant():
    # List to get a participant ID
    parts = client.get(
        "/v1/events/00000000-0000-0000-0000-000000000101/participants",
        headers={"Authorization": "Bearer dev-admin-token"},
    ).json()["data"]
    part_id = parts[0]["id"]

    # Cancel
    cancel_res = client.delete(
        f"/v1/events/00000000-0000-0000-0000-000000000101/participants/{part_id}",
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert cancel_res.status_code == 200
    assert cancel_res.json()["data"]["registration_status"] == "CANCELLED"
