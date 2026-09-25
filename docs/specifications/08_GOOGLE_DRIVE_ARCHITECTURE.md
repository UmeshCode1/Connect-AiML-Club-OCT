# AIML Club OCT — Connect
## Google Drive Architecture

Version: 1.0

---

## 1. Purpose

Google Drive is the primary large-file storage layer for Connect.

It should store:

- Event photos
- Event videos
- Certificates
- Posters
- Documents
- Resources
- Reports
- Other large media

Connect remains the structured source of truth.

---

## 2. Core Rule

Never identify a Drive folder by its name.

Always store the immutable Google Drive folder ID.

Bad:

```text
/AIML CLUB MEDIA/2026/Aptify 2.0/Photos
```

Good:

```text
google_drive_folder_id:
1AbCdEf...
```

Folder names can change.

IDs are the stable reference.

---

## 3. Root Structure

Recommended:

```text
AIML CLUB MEDIA/
│
├── 2025/
│   ├── Event Name/
│   │   ├── Photos/
│   │   ├── Videos/
│   │   ├── Certificates/
│   │   ├── Documents/
│   │   └── Resources/
│
├── 2026/
│   ├── Aptify 2.0/
│   │   ├── Photos/
│   │   ├── Videos/
│   │   ├── Certificates/
│   │   ├── Documents/
│   │   └── Resources/
│   │
│   └── SNAPCODE 2026/
│       ├── Photos/
│       ├── Videos/
│       ├── Certificates/
│       ├── Documents/
│       └── Resources/
│
└── SYSTEM/
    ├── Certificate Templates/
    ├── Brand Assets/
    ├── Reports/
    └── Imports/
```

Exact folder placement may be adjusted to the existing Drive organization.

---

## 4. Event Folder Creation

When an event is created:

```text
Create Event
     ↓
Create Event Root Folder
     ↓
Create Standard Subfolders
     ↓
Save Drive IDs
     ↓
Return event creation result
```

Standard folders:

```text
Photos
Videos
Certificates
Documents
Resources
```

---

## 5. Database Mapping

Recommended table:

```text
drive_folders

id
event_id
folder_type
google_drive_folder_id
created_at
```

Example:

```text
EVENT_ROOT → 1abc...
PHOTOS     → 2def...
VIDEOS     → 3ghi...
CERTIFICATES → 4jkl...
DOCUMENTS  → 5mno...
RESOURCES  → 6pqr...
```

---

## 6. Drive as Storage, Not Database

Do not store important application state only in Drive filenames.

Bad:

```text
APTIFY_2026_StudentName_PRESENT_CERTIFICATE_FINAL.pdf
```

Good:

```text
Drive file
    ↓
media_asset / certificate record
    ↓
structured metadata in PostgreSQL
```

Filename is presentation metadata.

Database is application metadata.

---

## 7. Upload Architecture

For large files:

```text
Browser
   ↓
API requests upload session
   ↓
Authorized Drive upload
   ↓
Google Drive
   ↓
Media record
   ↓
Processing queue
```

Avoid routing multi-gigabyte videos through the API server unnecessarily.

---

## 8. Large Uploads

Support:

- Resumable uploads
- Progress
- Retry
- Cancellation
- Failed upload recovery

Never assume a 10GB+ upload completes in one HTTP request.

---

## 9. Media Processing

After upload:

```text
Drive file
   ↓
MediaAsset
   ↓
Processing Job
   ↓
Photo/Video analysis
   ↓
Metadata update
```

The original file should remain unchanged.

---

## 10. Photo Processing

For photos:

```text
Drive
 ↓
Download/stream as permitted
 ↓
Decode
 ↓
Quality check
 ↓
Face detection
 ↓
Embedding
 ↓
Database index
```

Processing outputs should not create unnecessary duplicate originals.

---

## 11. Video Processing

For videos:

```text
Drive
 ↓
Metadata extraction
 ↓
Key-frame sampling
 ↓
Face detection/tracking
 ↓
Embedding
 ↓
VideoMoment records
```

Store timestamps, not separate video copies.

---

## 12. Certificate Storage

Generated certificates should be stored in:

```text
<Event Root>/Certificates/
```

Example:

```text
Aptify 2.0/
└── Certificates/
    ├── Participation/
    ├── Winners/
    ├── Volunteers/
    └── Speakers/
```

Subfolders are optional; the database remains authoritative.

---

## 13. Certificate Filename

Use stable human-readable filenames.

Example:

```text
AIML26-APT-000184.pdf
```

Avoid putting unnecessary personal data into filenames.

---

## 14. Documents

Event documents may include:

- Permission letters
- Event proposals
- Budgets
- Posters
- Speaker details
- Attendance exports
- Event reports
- Feedback reports

Store Drive file ID in the database.

---

## 15. Resource Files

Resources may include:

- Slides
- Notes
- Datasets
- Code archives
- Workshop material
- Reference documents

Visibility should be controlled by the application.

---

## 16. Drive Permissions

Do not expose the entire Drive folder publicly simply because one event has public photos.

Application-level visibility must remain separate from raw Drive organization.

Where necessary, use:

- Authorized access
- Controlled sharing
- Proxy/signed access patterns
- Public copies only for intentionally public assets

Never expose service-account credentials.

---

## 17. Public Media

A public event gallery should expose only media marked:

```text
visibility = PUBLIC
```

A private participant gallery may expose:

```text
visibility = EVENT_MEMBERS
```

The API must enforce this.

---

## 18. Folder Synchronization

Initial principle:

**Connect is the source of truth for organization. Drive is storage.**

If someone manually changes a Drive folder:

- Do not silently rewrite the database.
- Detect discrepancy where practical.
- Show sync status.
- Offer controlled reconciliation.

Future feature:

```text
Drive Sync Center
```

with:

- missing folder
- moved file
- renamed folder
- inaccessible file
- duplicate
- orphaned asset

---

## 19. Orphan Detection

An orphaned Drive file is a file that exists in the managed Drive area but has no corresponding Connect media/document/certificate record.

Periodic detection should identify:

```text
ORPHANED
MISSING
INACCESSIBLE
DUPLICATE
```

Do not automatically delete orphaned files.

---

## 20. Duplicate Detection

For uploaded media, compute a checksum where practical.

Example:

```text
SHA-256
```

If the same file already exists:

```text
Existing media found.
```

Allow admin to:

- reuse existing asset
- create separate record
- ignore duplicate

Avoid copying a 2GB video unnecessarily.

---

## 21. Storage Dashboard

Admin should eventually see:

```text
Google Drive

Total Storage
Used
Available

Photos
Videos
Certificates
Documents
Other

Largest Events
```

Per-event:

```text
Aptify 2.0
Photos: 4.2 GB
Videos: 8.7 GB
Certificates: 120 MB
Documents: 45 MB
Total: 13.1 GB
```

Values should be derived from actual metadata where possible.

---

## 22. Retention

Define retention policies for:

- Temporary processing files
- Failed processing artifacts
- Imported temporary files
- Old reports
- Face embeddings
- Event media

Do not delete originals merely to reduce database size.

---

## 23. Backup

Google Drive storage is not a complete backup strategy.

Critical structured data must have independent database backups.

For irreplaceable media, define a separate backup/archival policy.

At minimum:

```text
Database backup
+
Configuration backup
+
Critical media backup/archival strategy
```

---

## 24. Security

Never expose:

- Google OAuth refresh tokens
- Service account private keys
- Internal Drive credentials
- Server-side API keys

Keep credentials server-side.

Rotate secrets according to operational policy.

---

## 25. Drive API Rules

Use least-privilege access.

Do not request broader Google permissions than necessary.

Cache stable IDs.

Handle:

- permission errors
- deleted files
- moved files
- rate limits
- quota errors
- expired credentials
- network failures

Use retries with exponential backoff where safe.

---

## 26. Drive Failure Behavior

If Drive is temporarily unavailable:

The application should remain usable for operations that do not require Drive.

Example:

```text
Event management → works
Participant management → works
Attendance → works

Media upload → queued/retry
Certificate upload → queued/retry
```

Do not make the entire application unavailable because Drive has a temporary error.

---

## 27. Integration Health

Admin integration page should show:

```text
Google Drive
Connected
Last successful sync
Last error
Storage information
```

Actions:

```text
Test Connection
Sync
Reconcile
View Errors
```

---

## 28. Drive Architecture Rule

The correct mental model is:

```text
CONNECT
= application + metadata + permissions + relationships

GOOGLE DRIVE
= large-file storage

POSTGRESQL
= structured source of truth

AI WORKERS
= processing

TALLY / SHEETS
= external input/operational integrations
```

Do not reverse these responsibilities.
