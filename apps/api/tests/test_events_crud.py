from fastapi.testclient import TestClient
from apps.api.src.main import app

client = TestClient(app)


def test_public_list_events():
    response = client.get("/v1/events")
    assert response.status_code == 200
    body = response.json()
    assert "data" in body
    assert "meta" in body
    # Only published public events visible to anonymous visitor
    for event in body["data"]:
        assert event["visibility"] == "PUBLIC"
        assert event["status"] not in ("DRAFT", "ARCHIVED")


def test_create_event_requires_auth():
    # Anonymous request must fail with 401
    payload = {
        "title": "HackAI 2026: Oriental Hackathon",
        "short_description": "Annual AI hackathon",
        "event_type": "HACKATHON",
        "venue": "Lab 3, Oriental College of Technology",
        "capacity": 100,
    }
    response = client.post("/v1/events", json=payload)
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_create_event_forbidden_for_viewer():
    # Viewer role lacking 'events.create' must receive 403
    payload = {
        "title": "HackAI 2026: Oriental Hackathon",
        "short_description": "Annual AI hackathon",
    }
    response = client.post(
        "/v1/events",
        json=payload,
        headers={"Authorization": "Bearer dev-viewer-token"},
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


def test_create_event_success_for_admin():
    payload = {
        "title": "SNAPCODE 2026: Winter Sprint",
        "short_description": "High-intensity competitive programming sprint.",
        "event_type": "COMPETITION",
        "venue": "Computer Center, OCT Bhopal",
        "start_at": "2026-11-20T10:00:00Z",
        "end_at": "2026-11-20T16:00:00Z",
        "capacity": 80,
    }
    response = client.post(
        "/v1/events",
        json=payload,
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["data"]["title"] == "SNAPCODE 2026: Winter Sprint"
    assert body["data"]["status"] == "DRAFT"
    assert body["data"]["capacity"] == 80
    assert "id" in body["data"]
    assert "slug" in body["data"]


def test_invalid_event_dates_rejected():
    payload = {
        "title": "Invalid Date Event",
        "start_at": "2026-11-25T10:00:00Z",
        "end_at": "2026-11-20T10:00:00Z",  # End before start
    }
    response = client.post(
        "/v1/events",
        json=payload,
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert response.status_code == 400
    assert "cannot be after end date" in response.json()["error"]["message"]


def test_get_event_by_slug():
    response = client.get("/v1/events/aptify-2026")
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["slug"] == "aptify-2026"
    assert body["data"]["title"] == "Aptify 2.0: AI Symposium"


def test_update_event_success():
    # First create an event
    create_res = client.post(
        "/v1/events",
        json={"title": "Updatable Event Workshop"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    event_id = create_res.json()["data"]["id"]

    # Now update it
    update_res = client.patch(
        f"/v1/events/{event_id}",
        json={"venue": "New Seminar Hall, OCT", "capacity": 150},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert update_res.status_code == 200
    body = update_res.json()
    assert body["data"]["venue"] == "New Seminar Hall, OCT"
    assert body["data"]["capacity"] == 150
