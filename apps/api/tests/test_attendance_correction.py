from fastapi.testclient import TestClient
from apps.api.src.main import app

client = TestClient(app)

EVENT_ID = "00000000-0000-0000-0000-000000000101"
SESSION_ID = "00000000-0000-0000-0000-000000000501"


def _ensure_checked_in():
    # Make sure a student is checked in for SESSION_ID
    client.post(
        f"/v1/sessions/{SESSION_ID}/attendance/check-in",
        json={"enrollment_number": "0126AL221001", "source": "MANUAL"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )


def test_manual_attendance_correction_with_reason():
    _ensure_checked_in()

    # 1. Get the attendance record ID
    records = client.get(
        f"/v1/sessions/{SESSION_ID}/attendance",
        headers={"Authorization": "Bearer dev-admin-token"},
    ).json()["data"]
    assert len(records) >= 1
    attendance_id = records[0]["id"]

    # 2. Correct attendance to LATE with mandatory reason
    corr_res = client.patch(
        f"/v1/sessions/{SESSION_ID}/attendance/{attendance_id}",
        json={"status": "LATE", "reason": "Student arrived 20 minutes late with lab permission"},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert corr_res.status_code == 200
    body = corr_res.json()["data"]
    assert body["status"] == "LATE"
    assert body["correction_reason"] == "Student arrived 20 minutes late with lab permission"
    assert body["corrected_by"] is not None


def test_correction_without_reason_rejected():
    _ensure_checked_in()

    records = client.get(
        f"/v1/sessions/{SESSION_ID}/attendance",
        headers={"Authorization": "Bearer dev-admin-token"},
    ).json()["data"]
    attendance_id = records[0]["id"]

    # Reason too short / whitespace
    bad_res = client.patch(
        f"/v1/sessions/{SESSION_ID}/attendance/{attendance_id}",
        json={"status": "EXCUSED", "reason": " "},
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert bad_res.status_code in (400, 422)


def test_session_attendance_metrics():
    _ensure_checked_in()

    res = client.get(
        f"/v1/sessions/{SESSION_ID}/attendance/metrics",
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["session_id"] == SESSION_ID
    assert "total_present" in data
    assert "total_absent" in data
    assert "attendance_percentage" in data
