# AIML Club OCT — Connect
## Product Requirements Document (PRD)

Version: 1.0  
Status: Master Product Specification  
Repository: `UmeshCode1/Connect-AiML-Club-OCT`

---

## 1. Product Identity

Product name:

**AIML Club OCT — Connect**

Organization:

**AI & Machine Learning Club, Oriental College of Technology, Bhopal**

Purpose:

Connect is the unified digital platform for the club's events, participants, memories, certificates, communication, projects, research, learning resources, and institutional legacy.

Connect is not a replacement for the existing public website. It is the operational and member-facing platform that extends the existing AIML Club OCT digital ecosystem.

Primary domains:

- `aimlcluboct.in` — existing public website
- `app.aimlcluboct.in` — Connect student/member/participant application
- `admin.aimlcluboct.in` — administration
- `api.aimlcluboct.in` — backend API

Existing subdomains such as `voice.aimlcluboct.in` and `social.aimlcluboct.in` must remain functional.

---

## 2. Product Goals

Connect must:

1. Centralize event operations.
2. Integrate the club's existing Tally and Google Sheets workflows.
3. Use Google Drive as the primary large-media/document storage layer.
4. Give students a personal space for registrations, attendance history, photos, videos, and certificates.
5. Provide event teams with operational tools.
6. Provide administrators with secure management, analytics, permissions, and audit logs.
7. Provide AI-assisted photo discovery through opt-in face enrollment.
8. Eventually support video moment discovery.
9. Generate and verify certificates.
10. Provide a structured Chronicle/newsletter system.
11. Preserve the club's history through a Journey/Legacy module.
12. Provide Projects, Research, and Learning sections.
13. Provide high-quality public SEO surfaces without exposing private student data.
14. Work as a responsive web application and installable PWA.
15. Maintain a clean API/backend boundary so future Android/iOS applications can use the same services.

---

## 3. Non-Goals

The first release must not attempt to:

- Replace the existing public website.
- Replace Tally entirely.
- Replace Google Sheets for every operational workflow.
- Replace Google Drive as large-file storage.
- Build a Canva API integration.
- Build an unofficial WhatsApp automation system.
- Automatically publish AI-generated content without human approval.
- Publicly identify unknown people through face recognition.
- Store duplicate copies of every media asset for each student.
- Create thousands of SEO pages for private participant records.

---

## 4. Product Principles

### 4.1 One product, modular architecture

Users should experience one coherent platform even though the implementation contains separate services/modules.

### 4.2 Event-centric model

An Event is the primary operational object. Participants, attendance, media, certificates, feedback, reports, documents, and activities reference the canonical Event.

### 4.3 Source-of-truth separation

- Application database = structured application truth.
- Google Drive = large-file storage.
- Tally = registration/input layer where used.
- Google Sheets = club-friendly operational layer.
- Application UI = unified experience.

### 4.4 Privacy by design

Sensitive student data, attendance, biometric data, and internal records are private by default.

### 4.5 Human approval for consequential actions

Certificate issuance, content publication, data deletion, permission changes, and other sensitive operations require appropriate authorization.

---

## 5. User Types

### Public visitor

Can view public events, journey, chronicle, projects, research, learning resources, team information, and certificate verification.

### Student / participant

Can:

- Authenticate.
- View profile.
- View event registrations.
- View personal attendance.
- Access eligible certificates.
- Access authorized personal/event media.
- Enroll/withdraw from face matching where supported.
- Submit feedback.
- Search public content.

### Club team member

Can perform assigned event/team operations according to role and event scope.

### Event manager

Can manage assigned events, participants, attendance, volunteers, documents, and event operations.

### Media manager

Can upload/process/manage event media within authorized scope.

### Certificate manager

Can manage templates, eligibility, generation, issuance, revocation, replacement, and verification records.

### Content manager

Can manage public pages, Chronicle, Journey, Projects, Research, and Learning content.

### Club administrator

Has broad operational control according to assigned permissions.

### Super administrator

Full platform administration, security, configuration, integrations, and recovery privileges.

---

## 6. Core Modules

1. Authentication
2. Student Profiles
3. Team Management
4. Events
5. Participants
6. Attendance
7. Volunteers
8. Media
9. Face Matching
10. Video Moments
11. Certificates
12. Certificate Verification
13. Feedback
14. Chronicle
15. Journey
16. Projects
17. Research
18. Learning
19. Documents
20. Tasks
21. Communications
22. Analytics
23. Search
24. Integrations
25. Audit Logs
26. System Administration

---

## 7. Event Requirements

Each Event must support:

- Title
- Slug
- Event type
- Description
- Cover image
- Start/end date
- Venue
- Registration status
- Capacity
- Organizers
- Speakers
- Judges
- Volunteers
- Participants
- Attendance
- Teams
- Photos
- Videos
- Certificates
- Feedback
- Documents
- Resources
- Announcements
- Tasks
- Analytics
- Report
- Publication state

Event lifecycle:

`DRAFT → PLANNING → REGISTRATION_OPEN → REGISTRATION_CLOSED → LIVE → COMPLETED → MEDIA_PROCESSING → CERTIFICATES → ARCHIVED`

The implementation may allow controlled transitions rather than arbitrary status changes.

---

## 8. Registration Requirements

Supported sources:

- Tally
- Google Sheets
- Manual entry
- CSV
- XLSX
- Existing club members
- Walk-in registration

Import flow:

`UPLOAD → VALIDATE → PREVIEW → CONFLICT REVIEW → CONFIRM → IMPORT`

Every imported record must retain its source information.

Example source values:

- `TALLY`
- `GOOGLE_SHEETS`
- `MANUAL`
- `CSV`
- `XLSX`
- `CLUB_MEMBER`
- `WALK_IN`

---

## 9. Student and Participation Model

A person/student is not the same thing as their participation in an event.

Required conceptual relationship:

`Student 1 ──── N EventParticipation N ──── 1 Event`

EventParticipation stores event-specific information such as:

- Registration status
- Attendance
- Event role
- Team
- Result
- Certificate eligibility
- Certificate
- Registration source
- Check-in/check-out
- Notes

This prevents duplicated student records.

---

## 10. Attendance

Authentication must never automatically equal attendance.

Attendance must support:

- Check-in
- Check-out
- Timestamp
- Source
- Authorized correction
- Audit trail

Possible check-in sources:

- QR
- Admin/manual
- Authorized team member
- Future kiosk/device

Attendance records should support both:

1. Event participants.
2. Club/team members assigned to an event.

---

## 11. Media Requirements

Media types:

- PHOTO
- VIDEO
- DOCUMENT
- POSTER
- CERTIFICATE
- OTHER

Each media asset should reference:

- Event
- Google Drive file ID
- Media type
- File metadata
- Processing state
- Visibility
- Uploaded by
- Created timestamp
- Optional checksum/hash

Processing states may include:

`UPLOADED → QUEUED → PROCESSING → PROCESSED`

Failure states must preserve enough information for retry.

---

## 12. Photo Discovery

The platform should support:

1. Event media upload.
2. Background face detection.
3. Face embedding generation.
4. Vector storage.
5. Student opt-in enrollment.
6. Similarity search.
7. Result ranking.
8. Gallery display.
9. False-match reporting.

Do not duplicate a photo for each matching student.

A photo can reference many matched students.

Students who do not enroll in face matching must still have alternative gallery access where authorized.

---

## 13. Video Discovery

Future capability:

Student face enrollment → search → matching videos → timestamped moments.

Store:

- Video asset
- Face reference
- Timestamp
- Confidence/quality metadata
- Processing version

Do not analyze every frame unless required. Prefer sampling and tracking.

---

## 14. Certificate Requirements

Certificate workflow:

`TEMPLATE → CONFIGURE → PREVIEW → GENERATE → REVIEW → ISSUE → VERIFY`

Certificate types:

- Participation
- Completion
- Winner
- Runner-up
- Volunteer
- Speaker
- Organizer
- Custom

Certificate record must include:

- Certificate ID
- Secure verification token
- Student
- Event
- Type
- Status
- Template
- Google Drive file ID
- Issued timestamp
- Issued by

Statuses:

- `VALID`
- `REVOKED`
- `REPLACED`

QR verification URL:

`https://aimlcluboct.in/verify/{certificate-id}`

The public verification response must expose only the minimum required information.

---

## 15. Feedback

Feedback can originate from Tally/Sheets or the application.

Required fields may include:

- Student name
- Email
- Enrollment number
- Rating
- Feedback
- Suggestion
- Timestamp
- Publication consent

Publication options:

- Publish with name
- Publish anonymously
- Do not publish

Raw records remain protected.

---

## 16. Chronicle

Chronicle types:

- Weekly Update
- Monthly Digest
- Event Recap
- Annual Report
- Research Digest
- Special Edition

Content can reference canonical events, projects, media, achievements, and milestones.

AI can assist with drafting, summarization, categorization, and metadata.

Human approval is mandatory before publication.

---

## 17. Journey / Legacy

Journey is a public historical archive.

Milestone fields:

- Date
- Title
- Description
- Type
- Cover media
- Linked event
- Linked project
- External link
- Publication status

Types:

- Foundation
- Event
- Achievement
- Partnership
- Leadership
- Research
- Project
- Community milestone

Do not duplicate event data unnecessarily.

---

## 18. Projects, Research, Learning

Projects:

- Problem
- Solution
- Team
- Technology
- Repository
- Demo
- Documentation
- Status
- Related event

Research:

- Title
- Authors
- Abstract
- Methodology
- Publication
- Repository
- Dataset
- Related project/event

Learning:

- Notes
- Tutorials
- Workshop material
- Recordings
- Datasets
- Links
- Documentation

---

## 19. Search

Global search must cover:

- Students
- Events
- Certificates
- Photos
- Videos
- Projects
- Research
- Chronicle
- Journey
- Resources
- Documents
- Team

Desktop shortcut:

`Ctrl/Cmd + K`

Mobile uses a dedicated search experience.

---

## 20. Privacy and Visibility

Visibility values:

- `PUBLIC`
- `AUTHENTICATED`
- `EVENT_MEMBERS`
- `TEAM_ONLY`
- `ADMIN_ONLY`
- `HIDDEN`

Private records must never be accidentally exposed through search, APIs, static generation, sitemap, or client-side payloads.

---

## 21. PWA Requirements

Support:

- Installability
- Manifest
- Service worker
- Offline shell
- App icons
- Responsive layout
- Camera/QR support
- Network-aware UI
- Mobile navigation

Mobile is a first-class experience, not a desktop layout compressed into a small screen.

---

## 22. SEO Requirements

Public pages should support:

- Server rendering/static generation where appropriate
- Metadata
- Canonical URLs
- Sitemap
- Robots
- Open Graph
- Structured data
- Breadcrumbs
- Optimized images
- Internal linking

Do not index:

- Admin
- API
- Private dashboards
- Attendance
- Face embeddings
- Private participant records
- Private feedback

---

## 23. Success Criteria for V1

V1 is successful when an authorized club administrator can:

1. Create an event.
2. Automatically create its Drive folders.
3. Connect/import registrations.
4. Manage participants.
5. Manage event attendance.
6. Upload/index event media.
7. Allow authorized students to discover their photos.
8. Upload a certificate template.
9. Generate certificates in bulk.
10. Publish certificates to Drive.
11. Verify certificates publicly.
12. Review feedback.
13. Search platform data.
14. View event analytics.
15. Manage roles and permissions.
16. Review audit logs.

---

## 24. Quality Bar

Every feature must be:

- Secure
- Responsive
- Accessible
- Tested
- Maintainable
- Auditable when sensitive
- Consistent with the design system
- Mobile-compatible
- SEO-aware when public
- Performance-conscious

The goal is not merely "working software".

The goal is maintainable club infrastructure.
