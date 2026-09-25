import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from apps.api.src.main import app
from apps.api.src.services.certificate_service import certificate_service

client = TestClient(app)

ADMIN_AUTH = {"Authorization": "Bearer dev-admin-token"}
VIEWER_AUTH = {"Authorization": "Bearer dev-viewer-token"}
EVENT_ID = "00000000-0000-0000-0000-000000000101"


# ------------------------------------------------------------------------------
# 1. Template Management & Versioning Tests
# ------------------------------------------------------------------------------

def test_create_template_and_version():
    # 1. Create template
    tmpl_res = client.post(
        "/v1/certificate-templates",
        json={
            "name": "Aptify 2026 Symposium Merit Template",
            "certificate_type": "WINNER",
            "google_drive_file_id": "1DriveTemplateAssetWinner002",
            "configuration": {
                "fields": [
                    {"field_name": "RECIPIENT_NAME", "x": 960, "y": 500, "font_size": 52, "color": "#014B7A"},
                    {"field_name": "EVENT_NAME", "x": 960, "y": 640, "font_size": 30, "color": "#111820"},
                ],
                "dimensions": {"width": 1920, "height": 1080},
                "qr_placement": {"x": 1650, "y": 850, "size": 140},
            },
        },
        headers=ADMIN_AUTH,
    )
    assert tmpl_res.status_code == 201
    tmpl = tmpl_res.json()["data"]
    template_id = tmpl["id"]
    assert tmpl["name"] == "Aptify 2026 Symposium Merit Template"
    assert tmpl["version"] == 1

    # 2. Create new template version
    ver_res = client.post(
        f"/v1/certificate-templates/{template_id}/versions",
        json={
            "configuration": {
                "fields": [
                    {"field_name": "RECIPIENT_NAME", "x": 960, "y": 520, "font_size": 56, "color": "#014B7A"},
                ],
                "dimensions": {"width": 1920, "height": 1080},
            },
            "google_drive_file_id": "1DriveTemplateAssetWinner002_v2",
            "changelog": "Adjusted recipient name baseline position",
        },
        headers=ADMIN_AUTH,
    )
    assert ver_res.status_code == 201
    ver = ver_res.json()["data"]
    assert ver["version_number"] == 2
    assert ver["changelog"] == "Adjusted recipient name baseline position"


# ------------------------------------------------------------------------------
# 2. Eligibility & Batch Generation Tests
# ------------------------------------------------------------------------------

def test_certificate_eligibility_calculation():
    res = client.get(
        f"/v1/events/{EVENT_ID}/certificates/eligible?certificate_type=PARTICIPATION&min_sessions=1",
        headers=ADMIN_AUTH,
    )
    assert res.status_code == 200
    recipients = res.json()["data"]
    assert len(recipients) >= 2
    # At least one eligible and one ineligible (e.g. attended 0 sessions)
    assert any(r["is_eligible"] is True for r in recipients)
    assert any(r["is_eligible"] is False for r in recipients)


def test_batch_issuance_and_verification_lifecycle():
    # 1. Create Batch
    batch_res = client.post(
        f"/v1/events/{EVENT_ID}/certificates/batches",
        json={
            "event_id": EVENT_ID,
            "template_id": "00000000-0000-0000-0000-000000000001",
            "certificate_type": "PARTICIPATION",
            "min_attendance_sessions": 1,
        },
        headers=ADMIN_AUTH,
    )
    assert batch_res.status_code == 201
    batch = batch_res.json()["data"]
    batch_id = batch["id"]
    assert batch["status"] == "DRAFT"
    assert batch["total_eligible"] >= 1

    # 2. Generate Batch
    gen_res = client.post(
        f"/v1/certificate-batches/{batch_id}/generate",
        headers=ADMIN_AUTH,
    )
    assert gen_res.status_code == 200
    gen_batch = gen_res.json()["data"]
    assert gen_batch["status"] == "PENDING_APPROVAL"
    assert gen_batch["total_generated"] >= 1

    # Find one of the generated certificate IDs
    generated_cert = None
    for c in certificate_service.certificates.values():
        if c.get("batch_id") == batch_id:
            generated_cert = c
            break
    assert generated_cert is not None
    cert_id = generated_cert["certificate_id"]

    # 3. Unissued certificates MUST NOT be publicly verifiable
    unissued_verify = client.get(f"/v1/public/certificates/verify/{cert_id}")
    assert unissued_verify.status_code == 404

    # 4. Approve Batch
    appr_res = client.post(
        f"/v1/certificate-batches/{batch_id}/approve",
        headers=ADMIN_AUTH,
    )
    assert appr_res.status_code == 200
    assert appr_res.json()["data"]["status"] == "APPROVED"

    # 5. Issue Batch
    issue_res = client.post(
        f"/v1/certificate-batches/{batch_id}/issue",
        headers=ADMIN_AUTH,
    )
    assert issue_res.status_code == 200
    assert issue_res.json()["data"]["status"] == "ISSUED"

    # 6. Officially Issued Certificate is now publicly verifiable
    verify_res = client.get(f"/v1/public/certificates/verify/{cert_id}")
    assert verify_res.status_code == 200
    v_data = verify_res.json()["data"]
    assert v_data["valid"] is True
    assert v_data["certificate_id"] == cert_id
    assert v_data["status"] == "ISSUED"
    assert "event_title" in v_data
    # Strict Privacy Bounds: sensitive info must be omitted
    assert "phone" not in v_data
    assert "email" not in v_data
    assert "enrollment_number" not in v_data


# ------------------------------------------------------------------------------
# 3. Revocation & Replacement Tests
# ------------------------------------------------------------------------------

def test_certificate_revocation_workflow():
    # Dedicated issued certificate for revocation test
    cert_id = "AIML26-APT-999991"
    now = datetime.now(timezone.utc)
    certificate_service.certificates[cert_id] = {
        "id": "cert-revocation-test-01",
        "certificate_id": cert_id,
        "verification_token_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "student_id": "00000000-0000-0000-0000-000000000002",
        "recipient_name": "Test Recipient for Revocation",
        "event_id": EVENT_ID,
        "event_title": "Aptify 2.0: AI Symposium",
        "event_date": "October 15, 2026",
        "certificate_type": "PARTICIPATION",
        "template_id": "00000000-0000-0000-0000-000000000001",
        "template_version_id": None,
        "google_drive_file_id": "1DriveRevokeTest",
        "status": "ISSUED",
        "issued_at": now,
        "issued_by": "00000000-0000-0000-0000-000000000001",
        "replaced_by": None,
        "revoked_at": None,
        "revoke_reason": None,
        "created_at": now,
        "updated_at": now,
    }

    # 1. Revoke certificate
    rev_res = client.post(
        f"/v1/certificates/{cert_id}/revoke",
        json={"reason": "Academic record administrative dispute resolution"},
        headers=ADMIN_AUTH,
    )
    assert rev_res.status_code == 200
    assert rev_res.json()["data"]["status"] == "REVOKED"
    assert rev_res.json()["data"]["revoke_reason"] == "Academic record administrative dispute resolution"

    # 2. Public verification reflects revoked status
    verify_res = client.get(f"/v1/public/certificates/verify/{cert_id}")
    assert verify_res.status_code == 200
    v_data = verify_res.json()["data"]
    assert v_data["valid"] is False
    assert v_data["status"] == "REVOKED"
    assert v_data["revoke_reason"] == "Academic record administrative dispute resolution"


def test_certificate_replacement_workflow():
    # 1. Create and issue a certificate to replace
    batch_res = client.post(
        f"/v1/events/{EVENT_ID}/certificates/batches",
        json={
            "event_id": EVENT_ID,
            "template_id": "00000000-0000-0000-0000-000000000001",
            "certificate_type": "VOLUNTEER",
            "min_attendance_sessions": 0,
        },
        headers=ADMIN_AUTH,
    )
    bid = batch_res.json()["data"]["id"]
    client.post(f"/v1/certificate-batches/{bid}/generate", headers=ADMIN_AUTH)
    client.post(f"/v1/certificate-batches/{bid}/approve", headers=ADMIN_AUTH)
    client.post(f"/v1/certificate-batches/{bid}/issue", headers=ADMIN_AUTH)

    target_cert_id = None
    for c in certificate_service.certificates.values():
        if c.get("batch_id") == bid:
            target_cert_id = c["certificate_id"]
            break
    assert target_cert_id is not None

    # 2. Replace certificate
    rep_res = client.post(
        f"/v1/certificates/{target_cert_id}/replace",
        json={"reason": "Name spelling correction per official college ID card"},
        headers=ADMIN_AUTH,
    )
    assert rep_res.status_code == 200
    new_cert = rep_res.json()["data"]
    new_cert_id = new_cert["certificate_id"]
    assert new_cert_id != target_cert_id
    assert new_cert["status"] == "ISSUED"

    # 3. Old certificate verification shows REPLACED
    old_verify = client.get(f"/v1/public/certificates/verify/{target_cert_id}")
    assert old_verify.status_code == 200
    old_data = old_verify.json()["data"]
    assert old_data["valid"] is False
    assert old_data["status"] == "REPLACED"
    assert old_data["replaced_by_certificate_id"] == new_cert_id


# ------------------------------------------------------------------------------
# 4. Security & RBAC Regression Tests
# ------------------------------------------------------------------------------

def test_unauthorized_user_cannot_approve_or_issue_batches():
    bid = "fake-batch-id"
    # Regular viewer cannot approve or issue
    res_appr = client.post(f"/v1/certificate-batches/{bid}/approve", headers=VIEWER_AUTH)
    assert res_appr.status_code == 403

    res_issue = client.post(f"/v1/certificate-batches/{bid}/issue", headers=VIEWER_AUTH)
    assert res_issue.status_code == 403


def test_student_can_fetch_own_certificates():
    # Viewer token has account_id "00000000-0000-0000-0000-000000000002"
    res = client.get("/v1/me/certificates", headers=VIEWER_AUTH)
    assert res.status_code == 200
    certs = res.json()["data"]
    assert isinstance(certs, list)
