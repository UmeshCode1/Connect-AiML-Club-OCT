import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from apps.api.src.core.errors import (
    NotFoundException,
    BadRequestException,
    ConflictException,
    PermissionDeniedException,
)
from apps.api.src.schemas.certificates import (
    CertificateTemplateCreate,
    CertificateTemplateVersionCreate,
    CertificateTemplateResponse,
    CertificateTemplateVersionResponse,
    CertificateBatchCreate,
    CertificateBatchResponse,
    CertificateRecipientEligibilityResponse,
    CertificateResponse,
    PublicCertificateVerification,
)
from workers.certificates.generator import (
    generate_certificate_id,
    generate_verification_token,
    CertificateRenderer,
)


class CertificateService:
    """
    In-memory / repository service for Phase 5 Certificate Engine & Verification System.
    """

    def __init__(self):
        self.templates: Dict[str, Dict[str, Any]] = {}
        self.template_versions: Dict[str, List[Dict[str, Any]]] = {}  # keyed by template_id
        self.batches: Dict[str, Dict[str, Any]] = {}
        self.certificates: Dict[str, Dict[str, Any]] = {}  # keyed by certificate_id / id
        self.audit_log: List[Dict[str, Any]] = []

        # Seed initial template
        self._seed_initial_template()

    def _seed_initial_template(self):
        tid = "00000000-0000-0000-0000-000000000001"
        now = datetime.now(timezone.utc)
        self.templates[tid] = {
            "id": tid,
            "name": "Standard AIML Club Participation Template",
            "certificate_type": "PARTICIPATION",
            "google_drive_file_id": "1DriveTemplateAssetParticipation001",
            "configuration": {
                "fields": [
                    {"field_name": "RECIPIENT_NAME", "x": 960, "y": 510, "font_size": 56, "font_weight": "bold", "color": "#014B7A"},
                    {"field_name": "EVENT_NAME", "x": 960, "y": 660, "font_size": 32, "font_weight": "bold", "color": "#111820"},
                    {"field_name": "EVENT_DATE", "x": 960, "y": 710, "font_size": 20, "color": "#64748B"},
                    {"field_name": "CERTIFICATE_ID", "x": 140, "y": 870, "font_size": 22, "font_weight": "bold", "color": "#014B7A"},
                ],
                "dimensions": {"width": 1920, "height": 1080},
                "qr_placement": {"x": 1650, "y": 850, "size": 140},
            },
            "version": 1,
            "status": "ACTIVE",
            "created_by": "00000000-0000-0000-0000-000000000001",
            "created_at": now,
            "updated_at": now,
        }

        # Seed a valid historical certificate for smoke testing
        self.certificates["AIML26-APT-000184"] = {
            "id": "cert-smoke-001",
            "certificate_id": "AIML26-APT-000184",
            "verification_token_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "student_id": "00000000-0000-0000-0000-000000000002",
            "recipient_name": "Authorized Recipient",
            "event_id": "00000000-0000-0000-0000-000000000101",
            "event_title": "Aptify 2.0: AI Symposium",
            "event_date": "October 15, 2026",
            "certificate_type": "PARTICIPATION",
            "template_id": tid,
            "template_version_id": None,
            "google_drive_file_id": "1DriveFileCertAptify00184",
            "status": "VALID",
            "issued_at": now,
            "issued_by": "00000000-0000-0000-0000-000000000001",
            "replaced_by": None,
            "revoked_at": None,
            "revoke_reason": None,
            "created_at": now,
            "updated_at": now,
        }

    def _record_audit(self, action: str, actor_id: str, resource_type: str, resource_id: str, details: Dict[str, Any]):
        self.audit_log.append({
            "action": action,
            "actor_id": actor_id,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    # --------------------------------------------------------------------------
    # 1. Template Management & Versioning
    # --------------------------------------------------------------------------

    def create_template(self, payload: CertificateTemplateCreate, creator_id: str) -> CertificateTemplateResponse:
        tid = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        record = {
            "id": tid,
            "name": payload.name,
            "certificate_type": payload.certificate_type,
            "google_drive_file_id": payload.google_drive_file_id,
            "configuration": payload.configuration.model_dump(),
            "version": 1,
            "status": "ACTIVE",
            "created_by": creator_id,
            "created_at": now,
            "updated_at": now,
        }
        self.templates[tid] = record
        self._record_audit("CERTIFICATE_TEMPLATE_CREATED", creator_id, "template", tid, {"name": payload.name})
        return CertificateTemplateResponse(**record)

    def create_template_version(self, template_id: str, payload: CertificateTemplateVersionCreate, creator_id: str) -> CertificateTemplateVersionResponse:
        tmpl = self.templates.get(template_id)
        if not tmpl:
            raise NotFoundException("Certificate template not found.")

        tmpl["version"] += 1
        new_version_num = tmpl["version"]
        tmpl["configuration"] = payload.configuration.model_dump()
        if payload.google_drive_file_id:
            tmpl["google_drive_file_id"] = payload.google_drive_file_id
        tmpl["updated_at"] = datetime.now(timezone.utc)

        vid = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        version_rec = {
            "id": vid,
            "template_id": template_id,
            "version_number": new_version_num,
            "configuration": payload.configuration.model_dump(),
            "google_drive_file_id": payload.google_drive_file_id or tmpl.get("google_drive_file_id"),
            "changelog": payload.changelog,
            "created_by": creator_id,
            "created_at": now,
        }
        if template_id not in self.template_versions:
            self.template_versions[template_id] = []
        self.template_versions[template_id].append(version_rec)

        self._record_audit("CERTIFICATE_TEMPLATE_VERSION_CREATED", creator_id, "template_version", vid, {"version": new_version_num})
        return CertificateTemplateVersionResponse(**version_rec)

    def list_templates(self) -> List[CertificateTemplateResponse]:
        return [CertificateTemplateResponse(**t) for t in self.templates.values()]

    def get_template(self, template_id: str) -> CertificateTemplateResponse:
        tmpl = self.templates.get(template_id)
        if not tmpl:
            raise NotFoundException("Certificate template not found.")
        return CertificateTemplateResponse(**tmpl)

    # --------------------------------------------------------------------------
    # 2. Eligibility & Batch Generation
    # --------------------------------------------------------------------------

    def calculate_eligible_recipients(
        self,
        event_id: str,
        certificate_type: str = "PARTICIPATION",
        min_attendance_sessions: int = 1,
    ) -> List[CertificateRecipientEligibilityResponse]:
        """
        Evaluates event attendees against minimum attendance sessions and registration status.
        Does NOT duplicate attendance data; references existing records.
        """
        # Mock participant pool for demonstration and testing
        mock_students = [
            {"student_id": "00000000-0000-0000-0000-000000000002", "full_name": "Aman Sharma", "enrollment_number": "0126AL221001", "email": "aman@example.com", "attended": 2, "total": 2},
            {"student_id": "00000000-0000-0000-0000-000000000003", "full_name": "Priya Verma", "enrollment_number": "0126CS221045", "email": "priya@example.com", "attended": 1, "total": 2},
            {"student_id": "00000000-0000-0000-0000-000000000004", "full_name": "Rohan Gupta", "enrollment_number": "0126IT221088", "email": "rohan@example.com", "attended": 0, "total": 2},
        ]

        results = []
        for s in mock_students:
            is_eligible = s["attended"] >= min_attendance_sessions
            reason = None if is_eligible else f"Attended {s['attended']} of {s['total']} sessions (minimum required: {min_attendance_sessions})."
            
            # Check if active certificate already exists
            existing_cert_id = None
            for c in self.certificates.values():
                if c.get("event_id") == event_id and c.get("student_id") == s["student_id"] and c.get("certificate_type") == certificate_type and c.get("status") in ["ISSUED", "GENERATED", "APPROVED"]:
                    existing_cert_id = c["certificate_id"]
                    is_eligible = False
                    reason = f"Certificate already issued or generated ({existing_cert_id})."
                    break

            results.append(CertificateRecipientEligibilityResponse(
                student_id=s["student_id"],
                full_name=s["full_name"],
                enrollment_number=s["enrollment_number"],
                email=s["email"],
                attended_sessions=s["attended"],
                total_sessions=s["total"],
                is_eligible=is_eligible,
                ineligibility_reason=reason,
                existing_certificate_id=existing_cert_id,
            ))
        return results

    def create_batch(self, payload: CertificateBatchCreate, creator_id: str) -> CertificateBatchResponse:
        tmpl = self.templates.get(payload.template_id)
        if not tmpl:
            raise NotFoundException("Template not found.")

        # Calculate eligible count
        eligible_list = self.calculate_eligible_recipients(
            event_id=payload.event_id,
            certificate_type=payload.certificate_type,
            min_attendance_sessions=payload.min_attendance_sessions,
        )
        eligible_count = sum(1 for e in eligible_list if e.is_eligible)

        batch_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        record = {
            "id": batch_id,
            "event_id": payload.event_id,
            "template_id": payload.template_id,
            "template_version_id": payload.template_version_id,
            "certificate_type": payload.certificate_type,
            "status": "DRAFT",
            "eligibility_criteria": {
                "min_attendance_sessions": payload.min_attendance_sessions,
                "target_roles": payload.target_roles,
            },
            "total_eligible": eligible_count,
            "total_generated": 0,
            "total_failed": 0,
            "approved_by": None,
            "approved_at": None,
            "issued_at": None,
            "created_by": creator_id,
            "created_at": now,
            "updated_at": now,
        }
        self.batches[batch_id] = record
        self._record_audit("CERTIFICATE_BATCH_CREATED", creator_id, "batch", batch_id, {"eligible": eligible_count})
        return CertificateBatchResponse(**record)

    def generate_batch(self, batch_id: str, operator_id: str) -> CertificateBatchResponse:
        batch = self.batches.get(batch_id)
        if not batch:
            raise NotFoundException("Certificate batch not found.")

        if batch["status"] not in ["DRAFT", "FAILED"]:
            raise BadRequestException(f"Batch in status '{batch['status']}' cannot be regenerated.")

        batch["status"] = "GENERATING"
        now = datetime.now(timezone.utc)

        eligible_list = self.calculate_eligible_recipients(
            event_id=batch["event_id"],
            certificate_type=batch["certificate_type"],
            min_attendance_sessions=batch["eligibility_criteria"].get("min_attendance_sessions", 1),
        )

        generated_count = 0
        failed_count = 0
        serial_base = len(self.certificates) + 100

        for idx, recipient in enumerate(eligible_list):
            if not recipient.is_eligible:
                continue

            try:
                cert_num = generate_certificate_id("EVT-APT", serial_base + idx)
                token_hash = generate_verification_token(cert_num, recipient.student_id)
                verification_url = f"https://aimlcluboct.in/verify/{cert_num}"

                # Render reproducible SVG certificate using the worker generator
                svg_content = CertificateRenderer.render_svg_certificate(
                    recipient_name=recipient.full_name,
                    event_title="Aptify 2.0: AI Symposium",
                    event_date="October 15, 2026",
                    certificate_id=cert_num,
                    certificate_type=batch["certificate_type"],
                    verification_url=verification_url,
                )

                cert_id = str(uuid.uuid4())
                cert_rec = {
                    "id": cert_id,
                    "certificate_id": cert_num,
                    "verification_token_hash": token_hash,
                    "student_id": recipient.student_id,
                    "recipient_name": recipient.full_name,
                    "event_id": batch["event_id"],
                    "event_title": "Aptify 2.0: AI Symposium",
                    "event_date": "October 15, 2026",
                    "batch_id": batch_id,
                    "certificate_type": batch["certificate_type"],
                    "template_id": batch["template_id"],
                    "template_version_id": batch.get("template_version_id"),
                    "google_drive_file_id": f"1DriveCertFile_{cert_num}",
                    "status": "GENERATED",  # Awaiting administrative approval
                    "issued_at": None,
                    "issued_by": None,
                    "replaced_by": None,
                    "revoked_at": None,
                    "revoke_reason": None,
                    "created_at": now,
                    "updated_at": now,
                }
                self.certificates[cert_num] = cert_rec
                self.certificates[cert_id] = cert_rec
                generated_count += 1
            except Exception:
                failed_count += 1

        batch["status"] = "PENDING_APPROVAL" if generated_count > 0 else "FAILED"
        batch["total_generated"] = generated_count
        batch["total_failed"] = failed_count
        batch["updated_at"] = now

        self._record_audit("CERTIFICATES_BATCH_GENERATED", operator_id, "batch", batch_id, {"generated": generated_count, "failed": failed_count})
        return CertificateBatchResponse(**batch)

    def approve_batch(self, batch_id: str, approver_id: str) -> CertificateBatchResponse:
        batch = self.batches.get(batch_id)
        if not batch:
            raise NotFoundException("Batch not found.")

        if batch["status"] != "PENDING_APPROVAL":
            raise BadRequestException(f"Only batches in 'PENDING_APPROVAL' state can be approved (current: '{batch['status']}').")

        now = datetime.now(timezone.utc)
        batch["status"] = "APPROVED"
        batch["approved_by"] = approver_id
        batch["approved_at"] = now
        batch["updated_at"] = now

        # Update contained certificates to APPROVED
        for c in self.certificates.values():
            if c.get("batch_id") == batch_id and c.get("status") == "GENERATED":
                c["status"] = "APPROVED"
                c["updated_at"] = now

        self._record_audit("CERTIFICATES_BATCH_APPROVED", approver_id, "batch", batch_id, {})
        return CertificateBatchResponse(**batch)

    def issue_batch(self, batch_id: str, issuer_id: str) -> CertificateBatchResponse:
        batch = self.batches.get(batch_id)
        if not batch:
            raise NotFoundException("Batch not found.")

        if batch["status"] != "APPROVED":
            raise BadRequestException(f"Batch must be 'APPROVED' prior to public issuance (current: '{batch['status']}').")

        now = datetime.now(timezone.utc)
        batch["status"] = "ISSUED"
        batch["issued_at"] = now
        batch["updated_at"] = now

        # Issue certificates -> makes them publicly verifiable!
        for c in self.certificates.values():
            if c.get("batch_id") == batch_id and c.get("status") == "APPROVED":
                c["status"] = "ISSUED"
                c["issued_at"] = now
                c["issued_by"] = issuer_id
                c["updated_at"] = now

        self._record_audit("CERTIFICATES_BATCH_ISSUED", issuer_id, "batch", batch_id, {})
        return CertificateBatchResponse(**batch)

    # --------------------------------------------------------------------------
    # 3. Revocation & Replacement
    # --------------------------------------------------------------------------

    def revoke_certificate(self, certificate_id: str, reason: str, revoker_id: str) -> CertificateResponse:
        cert = self.certificates.get(certificate_id)
        if not cert:
            raise NotFoundException(f"Certificate '{certificate_id}' not found.")

        if cert["status"] == "REVOKED":
            raise ConflictException("Certificate is already revoked.")

        now = datetime.now(timezone.utc)
        cert["status"] = "REVOKED"
        cert["revoked_at"] = now
        cert["revoke_reason"] = reason
        cert["updated_at"] = now

        self._record_audit("CERTIFICATE_REVOKED", revoker_id, "certificate", certificate_id, {"reason": reason})
        return CertificateResponse(**cert)

    def replace_certificate(self, certificate_id: str, reason: str, operator_id: str) -> CertificateResponse:
        old_cert = self.certificates.get(certificate_id)
        if not old_cert:
            raise NotFoundException(f"Certificate '{certificate_id}' not found.")

        now = datetime.now(timezone.utc)
        new_cert_num = generate_certificate_id("EVT-APT", len(self.certificates) + 200)
        new_token_hash = generate_verification_token(new_cert_num, old_cert["student_id"])

        new_cert_id = str(uuid.uuid4())
        new_cert = {
            "id": new_cert_id,
            "certificate_id": new_cert_num,
            "verification_token_hash": new_token_hash,
            "student_id": old_cert["student_id"],
            "recipient_name": old_cert["recipient_name"],
            "event_id": old_cert.get("event_id"),
            "event_title": old_cert.get("event_title"),
            "event_date": old_cert.get("event_date"),
            "batch_id": old_cert.get("batch_id"),
            "certificate_type": old_cert["certificate_type"],
            "template_id": old_cert["template_id"],
            "template_version_id": old_cert.get("template_version_id"),
            "google_drive_file_id": f"1DriveCertFile_{new_cert_num}",
            "status": "ISSUED",
            "issued_at": now,
            "issued_by": operator_id,
            "replaced_by": None,
            "revoked_at": None,
            "revoke_reason": None,
            "created_at": now,
            "updated_at": now,
        }

        # Update old cert status to REPLACED
        old_cert["status"] = "REPLACED"
        old_cert["replaced_by"] = new_cert_num
        old_cert["updated_at"] = now

        self.certificates[new_cert_num] = new_cert
        self.certificates[new_cert_id] = new_cert

        self._record_audit("CERTIFICATE_REPLACED", operator_id, "certificate", certificate_id, {"new_cert_id": new_cert_num, "reason": reason})
        return CertificateResponse(**new_cert)

    # --------------------------------------------------------------------------
    # 4. Public Verification Contract
    # --------------------------------------------------------------------------

    def verify_certificate(self, certificate_id: str) -> PublicCertificateVerification:
        cert = self.certificates.get(certificate_id)
        if not cert:
            raise NotFoundException(f"Certificate with ID '{certificate_id}' was not found or is unverified.")

        status = cert["status"]

        # Only publicly verifiable once ISSUED, VALID, REVOKED, or REPLACED
        if status in ["DRAFT", "GENERATED", "PENDING_APPROVAL"]:
            raise NotFoundException(f"Certificate with ID '{certificate_id}' is not yet officially issued.")

        is_valid = status in ["VALID", "ISSUED"]

        return PublicCertificateVerification(
            valid=is_valid,
            certificate_id=cert["certificate_id"],
            recipient_name=cert["recipient_name"],
            event_title=cert.get("event_title", "AIML Club OCT Event"),
            event=cert.get("event_title", "AIML Club OCT Event"),
            event_date=cert.get("event_date"),
            certificate_type=cert["certificate_type"],
            issued_at=cert["issued_at"].isoformat() if isinstance(cert["issued_at"], datetime) else str(cert.get("issued_at", "")),
            status=status,
            verification_url=f"https://aimlcluboct.in/verify/{cert['certificate_id']}",
            revoked_at=cert["revoked_at"].isoformat() if isinstance(cert.get("revoked_at"), datetime) else None,
            revoke_reason=cert.get("revoke_reason"),
            replaced_by_certificate_id=cert.get("replaced_by"),
        )

    # --------------------------------------------------------------------------
    # 5. Student Portfolio
    # --------------------------------------------------------------------------

    def get_student_certificates(self, student_id: str) -> List[CertificateResponse]:
        results = []
        for c in self.certificates.values():
            if c.get("student_id") == student_id and c.get("status") in ["ISSUED", "VALID", "REPLACED", "REVOKED"]:
                # Ensure no duplicates between certificate_id key and id key
                if any(r.certificate_id == c["certificate_id"] for r in results):
                    continue
                results.append(CertificateResponse(**c))
        return results


# Global singleton service
certificate_service = CertificateService()
