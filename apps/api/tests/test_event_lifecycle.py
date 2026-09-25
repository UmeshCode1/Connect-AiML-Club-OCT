from fastapi.testclient import TestClient
from apps.api.src.main import app

client = TestClient(app)


def test_valid_lifecycle_transitions():
    # 1. Create event in DRAFT
    create_res = client.post(
        "/v1/events",
        json={"title": "Lifecycle Test Symposium"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert create_res.status_code == 201
    event_id = create_res.json()["data"]["id"]
    assert create_res.json()["data"]["status"] == "DRAFT"

    # 2. DRAFT -> PLANNING
    trans_1 = client.post(
        f"/v1/events/{event_id}/transition",
        json={"to_status": "PLANNING", "reason": "Planning started"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert trans_1.status_code == 200
    assert trans_1.json()["data"]["status"] == "PLANNING"

    # 3. PLANNING -> REGISTRATION_OPEN
    trans_2 = client.post(
        f"/v1/events/{event_id}/transition",
        json={"to_status": "REGISTRATION_OPEN", "reason": "Registration opened"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert trans_2.status_code == 200
    assert trans_2.json()["data"]["status"] == "REGISTRATION_OPEN"

    # 4. REGISTRATION_OPEN -> REGISTRATION_CLOSED
    trans_3 = client.post(
        f"/v1/events/{event_id}/transition",
        json={"to_status": "REGISTRATION_CLOSED"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert trans_3.status_code == 200
    assert trans_3.json()["data"]["status"] == "REGISTRATION_CLOSED"

    # 5. REGISTRATION_CLOSED -> LIVE
    trans_4 = client.post(
        f"/v1/events/{event_id}/transition",
        json={"to_status": "LIVE"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert trans_4.status_code == 200
    assert trans_4.json()["data"]["status"] == "LIVE"

    # 6. LIVE -> COMPLETED
    trans_5 = client.post(
        f"/v1/events/{event_id}/transition",
        json={"to_status": "COMPLETED"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert trans_5.status_code == 200
    assert trans_5.json()["data"]["status"] == "COMPLETED"


def test_invalid_lifecycle_transition_rejected():
    # Create event in DRAFT
    create_res = client.post(
        "/v1/events",
        json={"title": "Invalid Transition Event"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    event_id = create_res.json()["data"]["id"]

    # Attempt illegal jump: DRAFT -> COMPLETED
    illegal_res = client.post(
        f"/v1/events/{event_id}/transition",
        json={"to_status": "COMPLETED"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert illegal_res.status_code == 400
    body = illegal_res.json()
    assert "Invalid event lifecycle transition" in body["error"]["message"]


def test_publish_and_archive_endpoints():
    create_res = client.post(
        "/v1/events",
        json={"title": "Publishable Event"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    event_id = create_res.json()["data"]["id"]

    # Transition to PLANNING first so it can be published
    client.post(
        f"/v1/events/{event_id}/transition",
        json={"to_status": "PLANNING"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )

    # Publish
    pub_res = client.post(
        f"/v1/events/{event_id}/publish",
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert pub_res.status_code == 200
    assert pub_res.json()["data"]["status"] == "REGISTRATION_OPEN"

    # Archive
    arch_res = client.post(
        f"/v1/events/{event_id}/archive",
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert arch_res.status_code == 200
    assert arch_res.json()["data"]["status"] == "ARCHIVED"
