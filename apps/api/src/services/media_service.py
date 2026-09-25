import uuid
import hashlib
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from apps.api.src.core.errors import (
    NotFoundException,
    BadRequestException,
    ConflictException,
    PermissionDeniedException,
)
from apps.api.src.schemas.media import (
    MediaAssetCreate,
    MediaAssetResponse,
    MediaProcessingJobResponse,
    FaceEnrollmentCreate,
    FaceEnrollmentResponse,
    FaceSearchMatchItem,
    FaceSearchResponse,
    FaceReportCreate,
    FaceReportResponse,
    FaceReportResolve,
)

# Allowed MIME types and size boundaries
ALLOWED_MEDIA_MIME = {
    "image/jpeg": {"type": "PHOTO", "max_bytes": 50 * 1024 * 1024},
    "image/png": {"type": "PHOTO", "max_bytes": 50 * 1024 * 1024},
    "image/webp": {"type": "PHOTO", "max_bytes": 50 * 1024 * 1024},
    "video/mp4": {"type": "VIDEO", "max_bytes": 500 * 1024 * 1024},
    "video/webm": {"type": "VIDEO", "max_bytes": 500 * 1024 * 1024},
    "application/pdf": {"type": "DOCUMENT", "max_bytes": 50 * 1024 * 1024},
}

DANGEROUS_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".sh", ".php", ".py", ".js", ".vbs", ".msi", ".dll"
}


class MediaService:
    """
    In-memory / repository service for Phase 4 Media Intelligence and Biometric Privacy Gate.
    """

    def __init__(self):
        self.media_assets: Dict[str, Dict[str, Any]] = {}
        self.processing_jobs: Dict[str, Dict[str, Any]] = {}
        self.face_enrollments: Dict[str, Dict[str, Any]] = {}  # keyed by student_id
        self.face_embeddings: Dict[str, List[float]] = {}  # keyed by enrollment_id (Internal Only)
        self.media_faces: Dict[str, Dict[str, Any]] = {}  # keyed by face_id
        self.face_reports: Dict[str, Dict[str, Any]] = {}  # keyed by report_id
        self.audit_log: List[Dict[str, Any]] = []

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
    # 1. Media Assets Ingestion Boundary
    # --------------------------------------------------------------------------

    def ingest_media_asset(self, payload: MediaAssetCreate, uploader_id: str) -> MediaAssetResponse:
        # 1. Validate MIME
        mime = payload.mime_type.lower().strip()
        if mime not in ALLOWED_MEDIA_MIME:
            raise BadRequestException(f"Unsupported media MIME type: '{payload.mime_type}'. Supported: JPEG, PNG, WEBP, MP4, WEBM, PDF.")

        # 2. Validate Size
        rule = ALLOWED_MEDIA_MIME[mime]
        if payload.file_size > rule["max_bytes"]:
            raise BadRequestException(f"Media exceeds maximum allowed size for {rule['type']} ({rule['max_bytes'] // (1024 * 1024)}MB).")

        # 3. Prevent Path Traversal & Executable Extensions
        filename = payload.original_filename.lower()
        if ".." in filename or "/" in filename or "\\" in filename:
            raise BadRequestException("Original filename contains illegal path traversal characters.")

        for ext in DANGEROUS_EXTENSIONS:
            if filename.endswith(ext):
                raise BadRequestException(f"Dangerous executable extension '{ext}' is prohibited.")

        # 4. Check Google Drive ID format
        clean_drive_id = payload.google_drive_file_id.strip()
        if len(clean_drive_id) < 5:
            raise BadRequestException("Invalid Google Drive immutable File ID.")

        # Check duplicate drive file
        for existing in self.media_assets.values():
            if existing.get("google_drive_file_id") == clean_drive_id:
                raise ConflictException("Media asset with this Google Drive file ID is already registered.")

        asset_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        asset = {
            "id": asset_id,
            "event_id": payload.event_id,
            "media_type": rule["type"],
            "title": payload.title or payload.original_filename,
            "original_filename": payload.original_filename,
            "mime_type": mime,
            "file_size": payload.file_size,
            "checksum": payload.checksum or hashlib.sha256(clean_drive_id.encode()).hexdigest(),
            "google_drive_file_id": clean_drive_id,
            "google_drive_folder_id": payload.google_drive_folder_id,
            "visibility": payload.visibility,
            "processing_status": "UPLOADED",
            "width": payload.width,
            "height": payload.height,
            "duration_seconds": payload.duration_seconds,
            "uploaded_by": uploader_id,
            "created_at": now,
            "updated_at": now,
        }
        self.media_assets[asset_id] = asset

        # Enqueue initial processing job (idempotent)
        job_id = str(uuid.uuid4())
        self.processing_jobs[job_id] = {
            "id": job_id,
            "media_asset_id": asset_id,
            "job_type": "FACE_DETECTION" if rule["type"] == "PHOTO" else "KEYFRAME_SAMPLING",
            "status": "QUEUED",
            "attempts": 0,
            "started_at": None,
            "completed_at": None,
            "error_message": None,
            "created_at": now,
        }

        self._record_audit(
            action="MEDIA_ASSET_INGESTED",
            actor_id=uploader_id,
            resource_type="media_asset",
            resource_id=asset_id,
            details={"drive_id": clean_drive_id, "mime": mime, "event_id": payload.event_id},
        )

        return MediaAssetResponse(**asset)

    def list_event_media(self, event_id: str) -> List[MediaAssetResponse]:
        results = [
            MediaAssetResponse(**a)
            for a in self.media_assets.values()
            if a.get("event_id") == event_id and a.get("visibility") != "HIDDEN"
        ]
        return results

    def get_media_asset(self, asset_id: str) -> MediaAssetResponse:
        asset = self.media_assets.get(asset_id)
        if not asset:
            raise NotFoundException("Media asset not found.")
        return MediaAssetResponse(**asset)

    # --------------------------------------------------------------------------
    # 2. Biometric Consent & Enrollment (Strictly Opt-In)
    # --------------------------------------------------------------------------

    def get_student_enrollment(self, student_id: str) -> Optional[FaceEnrollmentResponse]:
        rec = self.face_enrollments.get(student_id)
        if not rec:
            return None
        return FaceEnrollmentResponse(**rec)

    def register_face_enrollment(self, student_id: str, payload: FaceEnrollmentCreate) -> FaceEnrollmentResponse:
        if not payload.confirm_opt_in:
            raise BadRequestException("Explicit opt-in confirmation is required for biometric face discovery enrollment.")

        now = datetime.now(timezone.utc)
        existing = self.face_enrollments.get(student_id)

        if existing and existing.get("status") == "ACTIVE":
            raise ConflictException("Active biometric enrollment already exists for this student.")

        enrollment_id = existing["id"] if existing else str(uuid.uuid4())

        record = {
            "id": enrollment_id,
            "student_id": student_id,
            "consent_version": payload.consent_version,
            "consented_at": now,
            "withdrawn_at": None,
            "status": "ACTIVE",
            "model_version": "arcface-r100-v1",
            "created_at": existing["created_at"] if existing else now,
            "updated_at": now,
        }
        self.face_enrollments[student_id] = record

        # Generate synthetic reference vector (512-d normalized float array) strictly internal
        import math
        seed = int(hashlib.sha256(student_id.encode()).hexdigest()[:8], 16)
        vec = [(math.sin(seed + i)) for i in range(512)]
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        normalized_vec = [x / norm for x in vec]
        self.face_embeddings[enrollment_id] = normalized_vec

        self._record_audit(
            action="BIOMETRIC_CONSENT_GRANTED",
            actor_id=student_id,
            resource_type="face_enrollment",
            resource_id=enrollment_id,
            details={"consent_version": payload.consent_version},
        )

        return FaceEnrollmentResponse(**record)

    def withdraw_face_enrollment(self, student_id: str) -> FaceEnrollmentResponse:
        existing = self.face_enrollments.get(student_id)
        if not existing or existing.get("status") != "ACTIVE":
            raise NotFoundException("No active biometric enrollment found for this student.")

        now = datetime.now(timezone.utc)
        enrollment_id = existing["id"]

        existing["status"] = "WITHDRAWN"
        existing["withdrawn_at"] = now
        existing["updated_at"] = now

        # Cryptographic Hard Erasure of vector data
        if enrollment_id in self.face_embeddings:
            del self.face_embeddings[enrollment_id]

        # Disassociate / unlink pre-existing matches for this student
        for face in self.media_faces.values():
            if face.get("matched_student_id") == student_id:
                face["matched_student_id"] = None
                face["confidence"] = None

        self._record_audit(
            action="BIOMETRIC_CONSENT_WITHDRAWN",
            actor_id=student_id,
            resource_type="face_enrollment",
            resource_id=enrollment_id,
            details={"embeddings_purged": True},
        )

        return FaceEnrollmentResponse(**existing)

    # --------------------------------------------------------------------------
    # 3. Event-Scoped Face Discovery
    # --------------------------------------------------------------------------

    def search_event_faces(
        self,
        event_id: str,
        student_id: str,
        authorized_student_events: List[str]
    ) -> FaceSearchResponse:
        """
        Event-scoped face search.
        Requires:
        1. Active biometric consent.
        2. Student participation in target event_id.
        """
        enrollment = self.face_enrollments.get(student_id)
        if not enrollment or enrollment.get("status") != "ACTIVE":
            raise PermissionDeniedException("Biometric face search requires active opt-in consent. Enroll at /v1/me/face-enrollment.")

        # Event Scoping Guard
        if event_id not in authorized_student_events and "GLOBAL" not in authorized_student_events:
            raise PermissionDeniedException(f"Access denied: Student was not an authorized participant in event '{event_id}'.")

        # Query media faces strictly inside event_id
        matches: List[FaceSearchMatchItem] = []
        for face in self.media_faces.values():
            # Check event scope
            asset = self.media_assets.get(face.get("media_asset_id"))
            if not asset or asset.get("event_id") != event_id:
                continue

            # Check if matched to this student and not disputed
            if face.get("matched_student_id") == student_id:
                # Check if currently disputed
                face_id = face.get("id")
                is_disputed = any(
                    r.get("media_face_id") == face_id and r.get("status") == "OPEN"
                    for r in self.face_reports.values()
                )
                if is_disputed:
                    continue  # Hide from discovery pending review

                conf = face.get("confidence", 0.85)
                tier = "HIGH" if conf >= 0.85 else ("MEDIUM" if conf >= 0.70 else "LOW")

                matches.append(FaceSearchMatchItem(
                    media_asset_id=asset["id"],
                    title=asset.get("title"),
                    original_filename=asset.get("original_filename"),
                    google_drive_file_id=asset.get("google_drive_file_id"),
                    confidence_tier=tier,
                    similarity_score=round(conf, 3),
                    created_at=asset["created_at"],
                ))

        self._record_audit(
            action="FACE_SEARCH_PERFORMED",
            actor_id=student_id,
            resource_type="event",
            resource_id=event_id,
            details={"matches_returned": len(matches)},
        )

        return FaceSearchResponse(
            event_id=event_id,
            student_id=student_id,
            total_matches=len(matches),
            matches=matches,
        )

    # --------------------------------------------------------------------------
    # 4. "Not Me" Dispute Workflow
    # --------------------------------------------------------------------------

    def report_face_dispute(self, media_id: str, student_id: str, payload: FaceReportCreate) -> FaceReportResponse:
        asset = self.media_assets.get(media_id)
        if not asset:
            raise NotFoundException("Media asset not found.")

        # Find matching face record if any
        matching_face_id = None
        for face in self.media_faces.values():
            if face.get("media_asset_id") == media_id and face.get("matched_student_id") == student_id:
                matching_face_id = face.get("id")
                break

        report_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        report = {
            "id": report_id,
            "student_id": student_id,
            "media_asset_id": media_id,
            "media_face_id": matching_face_id,
            "report_type": payload.report_type,
            "description": payload.description,
            "status": "OPEN",
            "reviewed_by": None,
            "reviewed_at": None,
            "resolution_notes": None,
            "created_at": now,
        }
        self.face_reports[report_id] = report

        self._record_audit(
            action="FACE_MATCH_REPORTED",
            actor_id=student_id,
            resource_type="face_match_report",
            resource_id=report_id,
            details={"media_id": media_id, "report_type": payload.report_type},
        )

        return FaceReportResponse(**report)

    def list_face_reports(self, status: Optional[str] = None) -> List[FaceReportResponse]:
        results = []
        for r in self.face_reports.values():
            if not status or r.get("status") == status:
                results.append(FaceReportResponse(**r))
        return results

    def resolve_face_dispute(self, report_id: str, admin_id: str, payload: FaceReportResolve) -> FaceReportResponse:
        report = self.face_reports.get(report_id)
        if not report:
            raise NotFoundException("Face match report not found.")

        now = datetime.now(timezone.utc)
        report["status"] = payload.status
        report["resolution_notes"] = payload.resolution_notes
        report["reviewed_by"] = admin_id
        report["reviewed_at"] = now

        # If confirmed disputed, disassociate the face match
        if payload.status == "RESOLVED_DISPUTED" and report.get("media_face_id"):
            face = self.media_faces.get(report["media_face_id"])
            if face:
                face["matched_student_id"] = None
                face["confidence"] = None

        self._record_audit(
            action="FACE_MATCH_DISPUTE_RESOLVED",
            actor_id=admin_id,
            resource_type="face_match_report",
            resource_id=report_id,
            details={"status": payload.status, "notes": payload.resolution_notes},
        )

        return FaceReportResponse(**report)


# Global singleton service
media_service = MediaService()
