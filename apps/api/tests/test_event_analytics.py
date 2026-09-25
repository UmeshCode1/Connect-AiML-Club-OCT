from fastapi.testclient import TestClient
from apps.api.src.main import app

client = TestClient(app)


def test_get_event_analytics():
    response = client.get(
        "/v1/events/00000000-0000-0000-0000-000000000101/analytics",
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert response.status_code == 200
    body = response.json()
    assert "data" in body
    data = body["data"]
    assert data["event_id"] == "00000000-0000-0000-0000-000000000101"
    assert data["event_title"] == "Aptify 2.0: AI Symposium"
    assert "total_registrations" in data
    assert "confirmed_count" in data
    assert "capacity" in data


def test_get_event_analytics_requires_permission():
    response = client.get("/v1/events/00000000-0000-0000-0000-000000000101/analytics")
    assert response.status_code == 401
