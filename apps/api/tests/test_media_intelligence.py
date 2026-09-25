import pytest
from fastapi.testclient import TestClient
from apps.api.src.main import app
from apps.api.src.services.media_service import media_service


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture(autouse=True)
def clean_media_state():
    # Reset media service state between tests
    media_service.media_assets.clear()
    media_service.processing_jobs.clear()
    media_service.face_enrollments.clear()
    media_service.face_embeddings.clear()
    media_service.media_faces.clear()
    media_service.face_reports.clear()
    media_service.audit_log.clear()


ADMIN_AUTH = {"Authorization": "Bearer dev-admin-token"}
VIEWER_AUTH = {"Authorization": "Bearer dev-viewer-token"}


# ------------------------------------------------------------------------------
# 1. Media Assets Ingestion Tests
# ------------------------------------------------------------------------------

def test_ingest_media_asset_success(client):
    payload = {
        "event_id": "00000000-0000-0000-0000-000000000101",
        "media_type": "PHOTO",
        "title": "Aptify 2026 Keynote Stage",
        "original_filename": "stage_keynote_01.jpg",
        "mime_type": "image/jpeg",
        "file_size": 4 * 1024 * 1024,  # 4MB
        "google_drive_file_id": "1DriveFileAptifyKeynotePhoto001",
        "visibility": "PUBLIC",
    }
    res = client.post(
        "/v1/events/00000000-0000-0000-0000-000000000101/media",
        json=payload,
        headers=ADMIN_AUTH,
    )
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["original_filename"] == "stage_keynote_01.jpg"
    assert data["google_drive_file_id"] == "1DriveFileAptifyKeynotePhoto001"
    assert data["processing_status"] == "UPLOADED"
    # Ensure no vector/biometric fields in response
    assert "embedding" not in data


def test_ingest_media_rejected_invalid_mime(client):
    payload = {
        "event_id": "00000000-0000-0000-0000-000000000101",
        "media_type": "PHOTO",
        "original_filename": "exploit.exe",
        "mime_type": "application/x-msdownload",
        "file_size": 1024,
        "google_drive_file_id": "1DriveFileInvalidMime002",
    }
    res = client.post(
        "/v1/events/00000000-0000-0000-0000-000000000101/media",
        json=payload,
        headers=ADMIN_AUTH,
    )
    assert res.status_code == 400
    assert "Unsupported media MIME type" in res.json()["error"]["message"]


def test_ingest_media_rejected_path_traversal(client):
    payload = {
        "event_id": "00000000-0000-0000-0000-000000000101",
        "media_type": "PHOTO",
        "original_filename": "../../etc/passwd.jpg",
        "mime_type": "image/jpeg",
        "file_size": 1024,
        "google_drive_file_id": "1DriveFilePathTraversal003",
    }
    res = client.post(
        "/v1/events/00000000-0000-0000-0000-000000000101/media",
        json=payload,
        headers=ADMIN_AUTH,
    )
    assert res.status_code == 400
    assert "illegal path traversal" in res.json()["error"]["message"]


def test_ingest_media_rejected_oversized(client):
    payload = {
        "event_id": "00000000-0000-0000-0000-000000000101",
        "media_type": "PHOTO",
        "original_filename": "huge_photo.jpg",
        "mime_type": "image/jpeg",
        "file_size": 75 * 1024 * 1024,  # 75MB > 50MB limit
        "google_drive_file_id": "1DriveFileOversized004",
    }
    res = client.post(
        "/v1/events/00000000-0000-0000-0000-000000000101/media",
        json=payload,
        headers=ADMIN_AUTH,
    )
    assert res.status_code == 400
    assert "exceeds maximum allowed size" in res.json()["error"]["message"]


# ------------------------------------------------------------------------------
# 2. Biometric Consent & Lifecycle Tests
# ------------------------------------------------------------------------------

def test_face_enrollment_requires_opt_in(client):
    # Missing opt-in flag fails
    res = client.post(
        "/v1/me/face-enrollment",
        json={"consent_version": "v1.0", "confirm_opt_in": False},
        headers=VIEWER_AUTH,
    )
    assert res.status_code == 400
    assert "Explicit opt-in confirmation is required" in res.json()["error"]["message"]


def test_face_enrollment_and_withdrawal_lifecycle(client):
    # 1. Successful enrollment
    res = client.post(
        "/v1/me/face-enrollment",
        json={"consent_version": "v1.0", "confirm_opt_in": True},
        headers=VIEWER_AUTH,
    )
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["status"] == "ACTIVE"
    assert data["consent_version"] == "v1.0"
    assert "embedding" not in data

    # Verify vector stored internally
    assert len(media_service.face_embeddings) == 1

    # 2. Get status
    res_get = client.get("/v1/me/face-enrollment", headers=VIEWER_AUTH)
    assert res_get.status_code == 200
    assert res_get.json()["data"]["status"] == "ACTIVE"

    # 3. Withdraw consent
    res_del = client.delete("/v1/me/face-enrollment", headers=VIEWER_AUTH)
    assert res_del.status_code == 200
    del_data = res_del.json()["data"]
    assert del_data["status"] == "WITHDRAWN"

    # Verify internal vector was purged
    assert len(media_service.face_embeddings) == 0


# ------------------------------------------------------------------------------
# 3. Event-Scoped Face Discovery Tests
# ------------------------------------------------------------------------------

def test_face_search_unconsented_rejected(client):
    # Student without consent attempts search
    res = client.post(
        "/v1/events/00000000-0000-0000-0000-000000000101/media/search-faces",
        headers=VIEWER_AUTH,
    )
    assert res.status_code == 403
    assert "requires active opt-in consent" in res.json()["error"]["message"]


def test_face_search_cross_event_prevention(client):
    # Enroll student
    client.post(
        "/v1/me/face-enrollment",
        json={"consent_version": "v1.0", "confirm_opt_in": True},
        headers=VIEWER_AUTH,
    )

    # Attempt search in an un-participated event (VIEWER_AUTH has event_scopes=["SELF"])
    res = client.post(
        "/v1/events/unauthorized-event-uuid/media/search-faces",
        headers=VIEWER_AUTH,
    )
    assert res.status_code == 403
    assert "not an authorized participant in event" in res.json()["error"]["message"]


# ------------------------------------------------------------------------------
# 4. "Not Me" Dispute Workflow Tests
# ------------------------------------------------------------------------------

def test_not_me_dispute_workflow(client):
    # 1. Ingest asset
    res_asset = client.post(
        "/v1/events/00000000-0000-0000-0000-000000000101/media",
        json={
            "event_id": "00000000-0000-0000-0000-000000000101",
            "media_type": "PHOTO",
            "original_filename": "disputed_photo.jpg",
            "mime_type": "image/jpeg",
            "file_size": 2 * 1024 * 1024,
            "google_drive_file_id": "1DriveFileDisputed005",
        },
        headers=ADMIN_AUTH,
    )
    asset_id = res_asset.json()["data"]["id"]

    # 2. Student reports "Not Me"
    res_report = client.post(
        f"/v1/media/{asset_id}/face-report",
        json={"report_type": "NOT_ME", "description": "This is someone else in the front row."},
        headers=VIEWER_AUTH,
    )
    assert res_report.status_code == 201
    report_data = res_report.json()["data"]
    report_id = report_data["id"]
    assert report_data["status"] == "OPEN"
    assert report_data["report_type"] == "NOT_ME"

    # 3. Admin lists open reports
    res_list = client.get("/v1/admin/face-reports?status=OPEN", headers=ADMIN_AUTH)
    assert res_list.status_code == 200
    reports = res_list.json()["data"]
    assert len(reports) >= 1
    assert any(r["id"] == report_id for r in reports)

    # 4. Admin resolves report
    res_resolve = client.patch(
        f"/v1/admin/face-reports/{report_id}",
        json={"status": "RESOLVED_DISPUTED", "resolution_notes": "Confirmed false match, unlinked candidate."},
        headers=ADMIN_AUTH,
    )
    assert res_resolve.status_code == 200
    assert res_resolve.json()["data"]["status"] == "RESOLVED_DISPUTED"


# ------------------------------------------------------------------------------
# 5. Security Regression Tests (Phase 4.1 Audit Suite)
# ------------------------------------------------------------------------------

def test_embedding_vectors_never_leaked_in_any_api(client):
    """
    Critical Boundary Test:
    Ensures that raw embeddings or vector fields are NEVER serialized in any API response.
    """
    # 1. Enroll user
    res_enroll = client.post(
        "/v1/me/face-enrollment",
        json={"consent_version": "v1.0", "confirm_opt_in": True},
        headers=ADMIN_AUTH,
    )
    assert res_enroll.status_code == 201
    body_enroll = str(res_enroll.json()).lower()
    assert "embedding" not in body_enroll
    assert "vector" not in body_enroll

    # 2. Ingest asset
    res_asset = client.post(
        "/v1/events/00000000-0000-0000-0000-000000000101/media",
        json={
            "event_id": "00000000-0000-0000-0000-000000000101",
            "media_type": "PHOTO",
            "original_filename": "stage_photo_leak_test.jpg",
            "mime_type": "image/jpeg",
            "file_size": 2 * 1024 * 1024,
            "google_drive_file_id": "1DriveFileLeakTest006",
        },
        headers=ADMIN_AUTH,
    )
    assert res_asset.status_code == 201
    asset_data = res_asset.json()["data"]
    assert "embedding" not in asset_data
    assert "vector" not in asset_data

    # 3. Search faces
    res_search = client.post(
        "/v1/events/00000000-0000-0000-0000-000000000101/media/search-faces",
        headers={"Authorization": "Bearer dev-admin-token"},
    )
    assert res_search.status_code == 200
    search_data = res_search.json()["data"]
    assert "embedding" not in search_data
    assert "vector" not in search_data
    for match in search_data.get("matches", []):
        assert "embedding" not in match
        assert "vector" not in match


def test_unauthorized_user_cannot_upload_media(client):
    """
    Ensures that a non-admin/non-manager without 'media.upload' is rejected with 403.
    """
    res = client.post(
        "/v1/events/00000000-0000-0000-0000-000000000101/media",
        json={
            "event_id": "00000000-0000-0000-0000-000000000101",
            "media_type": "PHOTO",
            "original_filename": "unauthorized.jpg",
            "mime_type": "image/jpeg",
            "file_size": 1024,
            "google_drive_file_id": "1DriveUnauthorized007",
        },
        headers=VIEWER_AUTH,
    )
    assert res.status_code == 403


def test_unauthorized_user_cannot_resolve_disputes(client):
    """
    Ensures that a regular student/viewer cannot resolve administrative dispute reports.
    """
    res = client.patch(
        "/v1/admin/face-reports/rep-fake-id",
        json={"status": "RESOLVED_DISPUTED", "resolution_notes": "Attempted exploit"},
        headers=VIEWER_AUTH,
    )
    assert res.status_code == 403


def test_consent_withdrawal_immediately_blocks_face_discovery(client):
    """
    Ensures that immediately following consent withdrawal, any face search
    is rejected with 403 Forbidden.
    """
    # 1. Enroll
    client.post(
        "/v1/me/face-enrollment",
        json={"consent_version": "v1.0", "confirm_opt_in": True},
        headers=VIEWER_AUTH,
    )

    # 2. Withdraw
    del_res = client.delete("/v1/me/face-enrollment", headers=VIEWER_AUTH)
    assert del_res.status_code == 200

    # 3. Attempt search - MUST fail
    search_res = client.post(
        "/v1/events/00000000-0000-0000-0000-000000000101/media/search-faces",
        headers=VIEWER_AUTH,
    )
    assert search_res.status_code == 403
    assert "requires active opt-in consent" in search_res.json()["error"]["message"]


def test_unknown_faces_remain_unlinked(client):
    """
    Ensures that unknown faces with no matched student remain unassigned
    and are not inferred or returned to arbitrary searchers.
    """
    # Add an anonymous face
    media_service.media_faces["anon-face-01"] = {
        "id": "anon-face-01",
        "media_asset_id": "med-fake",
        "matched_student_id": None,
        "confidence": None,
    }

    # Verify student search does not match anon face
    client.post(
        "/v1/me/face-enrollment",
        json={"consent_version": "v1.0", "confirm_opt_in": True},
        headers=ADMIN_AUTH,
    )
    res = client.post(
        "/v1/events/00000000-0000-0000-0000-000000000101/media/search-faces",
        headers=ADMIN_AUTH,
    )
    assert res.status_code == 200
    matched_ids = [m["media_asset_id"] for m in res.json()["data"]["matches"]]
    assert "med-fake" not in matched_ids


def test_duplicate_google_drive_file_id_rejected(client):
    """
    Ensures that duplicate Google Drive file IDs cannot be registered across assets.
    """
    payload = {
        "event_id": "00000000-0000-0000-0000-000000000101",
        "media_type": "PHOTO",
        "original_filename": "photo_1.jpg",
        "mime_type": "image/jpeg",
        "file_size": 1024,
        "google_drive_file_id": "1UniqueDriveFileId999",
    }
    # First ingestion succeeds
    res1 = client.post(
        "/v1/events/00000000-0000-0000-0000-000000000101/media",
        json=payload,
        headers=ADMIN_AUTH,
    )
    assert res1.status_code == 201

    # Second ingestion with same drive file ID fails with 409 Conflict
    res2 = client.post(
        "/v1/events/00000000-0000-0000-0000-000000000101/media",
        json=payload,
        headers=ADMIN_AUTH,
    )
    assert res2.status_code == 409
    assert "already registered" in res2.json()["error"]["message"]

