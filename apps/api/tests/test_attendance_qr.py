from fastapi.testclient import TestClient
from apps.api.src.main import app

client = TestClient(app)

EVENT_ID = "00000000-0000-0000-0000-000000000101"


def test_generate_and_scan_qr_checkin_success():
    # 1. Create a dedicated session for QR test
    ses_res = client.post(
        f"/v1/events/{EVENT_ID}/sessions",
        json={"title": "Dedicated QR Keynote", "start_at": "2026-10-15T09:00:00Z", "end_at": "2026-10-15T10:00:00Z"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    session_id = ses_res.json()["data"]["id"]

    # 2. Generate QR token for confirmed student (Aman Sharma 0126AL221001)
    pass_res = client.post(
        f"/v1/events/{EVENT_ID}/attendance/qr-pass?enrollment_number=0126AL221001"
    )
    assert pass_res.status_code == 200
    qr_token = pass_res.json()["data"]["token"]
    assert qr_token is not None

    # 3. Check-in student via authorized volunteer scanning QR
    checkin_res = client.post(
        f"/v1/sessions/{session_id}/attendance/check-in",
        json={"qr_token": qr_token},
        headers={"Authorization": "Bearer dev-volunteer-token"},
    )
    assert checkin_res.status_code == 201
    record = checkin_res.json()["data"]
    assert record["session_id"] == session_id
    assert record["enrollment_number"] == "0126AL221001"
    assert record["status"] == "PRESENT"
    assert record["source"] == "QR"
    assert "check_in_at" in record

    # 4. Duplicate scan in the same session must be rejected with 409
    dup_res = client.post(
        f"/v1/sessions/{session_id}/attendance/check-in",
        json={"qr_token": qr_token},
        headers={"Authorization": "Bearer dev-volunteer-token"},
    )
    assert dup_res.status_code == 409
    assert dup_res.json()["error"]["code"] == "CONFLICT"
    assert "already checked in" in dup_res.json()["error"]["message"]


def test_tampered_qr_token_rejected():
    sessions = client.get(f"/v1/events/{EVENT_ID}/sessions").json()["data"]
    session_id = sessions[0]["id"]

    # Tampered signature
    tampered_token = "eyJhbGciOiJIUzI1NiJ9.tampered_payload_sig"
    res = client.post(
        f"/v1/sessions/{session_id}/attendance/check-in",
        json={"qr_token": tampered_token},
        headers={"Authorization": "Bearer dev-volunteer-token"},
    )
    assert res.status_code == 400
    assert "Invalid attendance QR code" in res.json()["error"]["message"]


def test_unregistered_student_rejected():
    sessions = client.get(f"/v1/events/{EVENT_ID}/sessions").json()["data"]
    session_id = sessions[0]["id"]

    # Attempt check-in with unregistered enrollment number
    res = client.post(
        f"/v1/sessions/{session_id}/attendance/check-in",
        json={"enrollment_number": "0126XX999999", "source": "MANUAL"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert res.status_code == 404
    assert "not registered for this event" in res.json()["error"]["message"]


def test_checkout_workflow():
    # 1. Create a session and check in a student
    ses_res = client.post(
        f"/v1/events/{EVENT_ID}/sessions",
        json={"title": "Checkout Test Session", "start_at": "2026-10-15T16:00:00Z", "end_at": "2026-10-15T17:00:00Z"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    session_id = ses_res.json()["data"]["id"]

    client.post(
        f"/v1/sessions/{session_id}/attendance/check-in",
        json={"enrollment_number": "0126AL221001", "source": "MANUAL"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )

    # 2. Check out student who is checked in
    co_res = client.post(
        f"/v1/sessions/{session_id}/attendance/check-out",
        json={"enrollment_number": "0126AL221001"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert co_res.status_code == 200
    body = co_res.json()
    assert body["data"]["check_out_at"] is not None


def test_checkout_without_checkin_rejected():
    sessions = client.get(f"/v1/events/{EVENT_ID}/sessions").json()["data"]
    session_id = sessions[0]["id"]

    # Attempt check out for someone with no check-in record
    res = client.post(
        f"/v1/sessions/{session_id}/attendance/check-out",
        json={"enrollment_number": "0126AL999999"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert res.status_code == 400
    assert "no active check-in record" in res.json()["error"]["message"]
