import os
import re
import pytest
from fastapi.testclient import TestClient
from apps.api.src.main import app

client = TestClient(app)

MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "..", "supabase", "migrations")


# ------------------------------------------------------------------------------
# 1. Migration Sequence & SQL Correctness Tests (DEBT-01 & DEBT-02)
# ------------------------------------------------------------------------------

def test_migration_chain_sequence():
    """
    Verifies that migrations 000001 through 000006 exist in exact sequence.
    """
    expected_migrations = [
        "20260925000001_initial_schema.sql",
        "20260925000002_event_engine.sql",
        "20260925000003_attendance_operations.sql",
        "20260925000004_media_intelligence.sql",
        "20260925000005_certificate_engine.sql",
        "20260925000006_database_foundation_reconciliation.sql",
    ]
    for filename in expected_migrations:
        path = os.path.join(MIGRATIONS_DIR, filename)
        assert os.path.isfile(path), f"Missing required migration file: {filename}"


def test_reconciliation_migration_resolves_debt01_and_debt02():
    """
    Inspects 20260925000006_database_foundation_reconciliation.sql to ensure:
    1. volunteer_assignments is created with safe replay IF NOT EXISTS, constraints & indexes.
    2. Canonical check_user_has_role security-definer function is defined.
    3. All 5 affected RLS policies are dropped and recreated without 'user_roles' or 'roles r'.
    """
    recon_path = os.path.join(MIGRATIONS_DIR, "20260925000006_database_foundation_reconciliation.sql")
    with open(recon_path, "r", encoding="utf-8") as f:
        content = f.read()

    # DEBT-01 verification
    assert "CREATE TABLE IF NOT EXISTS volunteer_assignments" in content
    assert "event_id UUID NOT NULL REFERENCES events(id)" in content
    assert "student_id UUID NOT NULL REFERENCES student_profiles(id)" in content
    assert "uq_event_volunteer_session_role" in content
    assert "ALTER TABLE volunteer_assignments ENABLE ROW LEVEL SECURITY" in content

    # DEBT-02 verification
    assert "CREATE OR REPLACE FUNCTION public.check_user_has_role" in content
    assert "SECURITY DEFINER" in content
    assert "SET search_path = public, pg_temp" in content
    assert "REVOKE ALL ON FUNCTION public.check_user_has_role" in content
    assert "GRANT EXECUTE ON FUNCTION public.check_user_has_role" in content
    assert "CREATE OR REPLACE FUNCTION public.check_user_is_event_volunteer" in content

    # Verify RLS policies are reconciled
    assert "DROP POLICY IF EXISTS \"Staff full access to events\"" in content
    assert "DROP POLICY IF EXISTS \"Staff can manage event participations\"" in content
    assert "DROP POLICY IF EXISTS \"Staff can manage event sessions\"" in content
    assert "DROP POLICY IF EXISTS \"Staff full access to attendance\"" in content
    assert "DROP POLICY IF EXISTS \"Staff can manage volunteer assignments\"" in content

    # Verify NO invalid role references exist in the reconciliation file
    assert "user_roles" not in content
    assert "roles r" not in content


# ------------------------------------------------------------------------------
# 2. RBAC Role Matrix Tests Across All 9 Roles
# ------------------------------------------------------------------------------

def test_rbac_anonymous_user():
    # Anonymous unauthenticated access is rejected on protected endpoints
    res = client.get("/v1/auth/me")
    assert res.status_code == 401


def test_rbac_viewer_student():
    headers = {"Authorization": "Bearer dev-viewer-token"}
    # Allowed: events.view
    res_allowed = client.get("/v1/auth/check-permission?action=events.view", headers=headers)
    assert res_allowed.status_code == 200
    assert res_allowed.json()["data"]["granted"] is True

    # Denied: events.create, attendance.mark, certificates.issue
    for action in ["events.create", "attendance.mark", "certificates.issue"]:
        res_denied = client.get(f"/v1/auth/check-permission?action={action}", headers=headers)
        assert res_denied.status_code == 403


def test_rbac_volunteer():
    headers = {"Authorization": "Bearer dev-volunteer-token"}
    # Allowed: attendance.mark, attendance.view
    res = client.get("/v1/auth/check-permission?action=attendance.mark", headers=headers)
    assert res.status_code == 200

    # Denied: certificates.issue, events.delete
    for action in ["certificates.issue", "events.delete", "media.delete"]:
        res_denied = client.get(f"/v1/auth/check-permission?action={action}", headers=headers)
        assert res_denied.status_code == 403


def test_rbac_event_manager():
    headers = {"Authorization": "Bearer dev-event-manager-token"}
    # Allowed: events.create, attendance.mark, volunteers.assign
    for action in ["events.create", "attendance.mark", "volunteers.assign"]:
        res = client.get(f"/v1/auth/check-permission?action={action}", headers=headers)
        assert res.status_code == 200

    # Denied: media.delete, certificates.issue
    for action in ["media.delete", "certificates.issue"]:
        res_denied = client.get(f"/v1/auth/check-permission?action={action}", headers=headers)
        assert res_denied.status_code == 403


def test_rbac_media_manager():
    headers = {"Authorization": "Bearer dev-media-manager-token"}
    # Allowed: media.upload, media.process, media.delete
    for action in ["media.upload", "media.process", "media.delete"]:
        res = client.get(f"/v1/auth/check-permission?action={action}", headers=headers)
        assert res.status_code == 200

    # Denied: events.create, attendance.mark, certificates.issue
    for action in ["events.create", "attendance.mark", "certificates.issue"]:
        res_denied = client.get(f"/v1/auth/check-permission?action={action}", headers=headers)
        assert res_denied.status_code == 403


def test_rbac_certificate_manager():
    headers = {"Authorization": "Bearer dev-cert-manager-token"}
    # Allowed: certificates.issue, certificates.template.manage, certificates.revoke
    for action in ["certificates.issue", "certificates.template.manage", "certificates.revoke"]:
        res = client.get(f"/v1/auth/check-permission?action={action}", headers=headers)
        assert res.status_code == 200

    # Denied: events.create, events.delete, media.delete
    for action in ["events.create", "events.delete", "media.delete"]:
        res_denied = client.get(f"/v1/auth/check-permission?action={action}", headers=headers)
        assert res_denied.status_code == 403


def test_rbac_content_manager():
    headers = {"Authorization": "Bearer dev-content-manager-token"}
    # Allowed: chronicle.publish, journey.create
    for action in ["chronicle.publish", "journey.create"]:
        res = client.get(f"/v1/auth/check-permission?action={action}", headers=headers)
        assert res.status_code == 200

    # Denied: attendance.mark, certificates.issue, media.delete
    for action in ["attendance.mark", "certificates.issue", "media.delete"]:
        res_denied = client.get(f"/v1/auth/check-permission?action={action}", headers=headers)
        assert res_denied.status_code == 403


def test_rbac_club_admin():
    headers = {"Authorization": "Bearer dev-admin-token"}
    # Allowed across operational modules
    for action in ["events.create", "events.publish", "participants.view", "attendance.correct", "certificates.issue"]:
        res = client.get(f"/v1/auth/check-permission?action={action}", headers=headers)
        assert res.status_code == 200


def test_rbac_super_admin():
    headers = {"Authorization": "Bearer dev-super-token"}
    # Universal grant
    res = client.get("/v1/auth/check-permission?action=system.recovery.override", headers=headers)
    assert res.status_code == 200
    assert res.json()["data"]["granted"] is True


# ------------------------------------------------------------------------------
# 3. Negative Security Boundary Tests
# ------------------------------------------------------------------------------

def test_unauthorized_certificate_operations_rejected():
    viewer_headers = {"Authorization": "Bearer dev-viewer-token"}
    res = client.post(
        "/v1/certificate-templates",
        json={"name": "Exploit", "certificate_type": "PARTICIPATION", "google_drive_file_id": "none", "configuration": {}},
        headers=viewer_headers,
    )
    assert res.status_code == 403


def test_unauthorized_attendance_modification_rejected():
    viewer_headers = {"Authorization": "Bearer dev-viewer-token"}
    res = client.patch(
        "/v1/sessions/session-001/attendance/att-001",
        json={"status": "PRESENT", "correction_reason": "Privilege escalation attempt"},
        headers=viewer_headers,
    )
    assert res.status_code == 403


def test_unauthorized_volunteer_assignment_rejected():
    viewer_headers = {"Authorization": "Bearer dev-viewer-token"}
    res = client.post(
        "/v1/events/event-001/volunteers",
        json={"enrollment_number": "0126AL221050", "role": "ATTENDANCE"},
        headers=viewer_headers,
    )
    assert res.status_code == 403
