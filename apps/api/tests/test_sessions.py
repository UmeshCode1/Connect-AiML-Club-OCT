from fastapi.testclient import TestClient
from apps.api.src.main import app

client = TestClient(app)

EVENT_ID = "00000000-0000-0000-0000-000000000101"


def test_list_event_sessions():
    response = client.get(f"/v1/events/{EVENT_ID}/sessions")
    assert response.status_code == 200
    body = response.json()
    assert "data" in body
    assert len(body["data"]) >= 1
    session = body["data"][0]
    assert session["event_id"] == EVENT_ID
    assert "session_code" in session
    assert "start_at" in session


def test_create_session_success():
    payload = {
        "title": "Hands-on Workshop: Neural Networks in PyTorch",
        "description": "Lab session building PyTorch MLP models.",
        "venue": "Computer Lab 2, OCT",
        "start_at": "2026-10-15T13:30:00Z",
        "end_at": "2026-10-15T15:30:00Z",
        "capacity": 60,
    }
    response = client.post(
        f"/v1/events/{EVENT_ID}/sessions",
        json=payload,
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["data"]["title"] == "Hands-on Workshop: Neural Networks in PyTorch"
    assert body["data"]["status"] == "SCHEDULED"
    assert body["data"]["event_id"] == EVENT_ID


def test_create_session_invalid_timing_rejected():
    payload = {
        "title": "Invalid Timing Session",
        "start_at": "2026-10-15T15:00:00Z",
        "end_at": "2026-10-15T14:00:00Z",  # end before start
    }
    response = client.post(
        f"/v1/events/{EVENT_ID}/sessions",
        json=payload,
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert response.status_code == 400
    assert "start time must be strictly before end time" in response.json()["error"]["message"]


def test_create_session_unauthorized():
    payload = {
        "title": "Unauthorized Session",
        "start_at": "2026-10-15T10:00:00Z",
        "end_at": "2026-10-15T11:00:00Z",
    }
    response = client.post(f"/v1/events/{EVENT_ID}/sessions", json=payload)
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_create_session_forbidden_for_viewer():
    payload = {
        "title": "Viewer Forbidden Session",
        "start_at": "2026-10-15T10:00:00Z",
        "end_at": "2026-10-15T11:00:00Z",
    }
    response = client.post(
        f"/v1/events/{EVENT_ID}/sessions",
        json=payload,
        headers={"Authorization": "Bearer dev-viewer-token"},
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PERMISSION_DENIED"


def test_update_session():
    # Fetch first session
    sessions = client.get(f"/v1/events/{EVENT_ID}/sessions").json()["data"]
    session_id = sessions[0]["id"]

    response = client.patch(
        f"/v1/sessions/{session_id}",
        json={"venue": "Conference Hall B, OCT"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert response.status_code == 200
    assert response.json()["data"]["venue"] == "Conference Hall B, OCT"
