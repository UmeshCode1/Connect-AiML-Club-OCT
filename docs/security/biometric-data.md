# AIML CLUB OCT — CONNECT
## Security & Biometric Data Governance (Phase 4)

### 1. Mandatory Biometric Principles
Under the institutional governance of the AI & Machine Learning Club, Oriental College of Technology, Bhopal, student biometric privacy is paramount:
1. **Never a Surveillance System**: The platform does NOT identify unknown people in public spaces.
2. **Opt-in by Design**: Biometric vectors are generated only after explicit, affirmative, versioned consent.
3. **Event Boundary Enforcement**: Photo discovery queries are restricted to events where the student had an authorized participation record.
4. **Permanent Erasure**: Consent revocation immediately purges stored embeddings from database storage.
5. **Human in the Loop**: Students can dispute any match using the "Not Me" workflow, triggering administrative review and unlinking.

---

### 2. Threat Model & Mitigations Matrix

| Threat Category | Potential Impact | Security Mitigation | Audit Evidence |
| :--- | :--- | :--- | :--- |
| **Vector Inversion** | Reconstruction of facial likeness from mathematical array | Vectors never exposed via API or UI; storage restricted to backend `pgvector` with RLS. | `SECURITY_ALERT` |
| **Cross-Event Leakage** | Profiling student attendance across unauthorized events | Backend SQL enforces `event_participations` INNER JOIN on target `event_id`. | `FACE_SEARCH_PERFORMED` |
| **Adversarial Ingestion** | Path traversal or malware injection via media files | MIME validation, size caps (50MB/500MB), filename sanitation against `.exe`, `..`. | `MEDIA_UPLOAD_REJECTED` |
| **Mass Identification** | Automated batch queries matching unknown faces | No public face matching endpoint; requests require student session or elevated `MEDIA_MANAGER`. | `UNAUTHORIZED_ACCESS_ATTEMPT` |
| **Revoked Consent Bypass** | Indexing previously consented students after withdrawal | Queries check `face_enrollments.status = 'ACTIVE'` in real-time before ranking. | `CONSENT_VIOLATION_BLOCKED` |

---

### 3. Model & Versioning Specifications
- **Reference Model**: `arcface-r100-v1` / `facenet-512-v1`
- **Embedding Dimension**: 512-dimensional normalized floating point vector
- **Similarity Metric**: Cosine Similarity (`1 - cosine_distance`)
- **Configured Thresholds**:
  - `HIGH`: Similarity ≥ 0.85
  - `MEDIUM`: 0.70 ≤ Similarity < 0.85
  - `UNRESOLVED / UNMATCHED`: Similarity < 0.70 (stored as anonymous face detection with `matched_student_id = NULL`)

---

### 4. Audit Log Specifications
All biometric actions trigger immutable audit records in `audit_logs`:
- `BIOMETRIC_CONSENT_GRANTED`: Records `student_id`, `consent_version`, timestamp.
- `BIOMETRIC_CONSENT_WITHDRAWN`: Records `student_id`, withdrawal timestamp, vector purge status.
- `FACE_SEARCH_PERFORMED`: Records `student_id`, `event_id`, match count.
- `FACE_MATCH_REPORTED`: Records `student_id`, `media_id`, dispute reason.
- `FACE_MATCH_DISPUTE_RESOLVED`: Records `admin_id`, `report_id`, resolution notes, unlinking outcome.
