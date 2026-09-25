# AIML Club OCT — Connect
## Domain Architecture

Version: 1.0

---

## 1. Domain Philosophy

The system should model club operations and history, not merely website pages.

The primary domains are:

```text
Identity
Events
People
Attendance
Media
Certificates
Content
Knowledge
Communications
Integrations
Administration
```

---

## 2. Identity Domain

Entities:

- Account
- StudentProfile
- TeamMembership
- TeamRole
- Permission
- Scope

Responsibilities:

- Authentication mapping
- Student identity
- Team membership
- Authorization

Must not own:

- Event attendance
- Media
- Certificates

Those belong to their own domains.

---

## 3. Event Domain

Event is the core operational aggregate.

Entities:

- Event
- EventParticipation
- EventRole
- VolunteerAssignment
- EventTask
- EventAnnouncement
- EventDocument

Event owns operational context.

Example:

```text
Event
 ├── Participants
 ├── Attendance
 ├── Volunteers
 ├── Tasks
 ├── Documents
 └── Announcements
```

---

## 4. People Domain

Student identity is global.

A student may participate in many events:

```text
Student
 ├── Aptify 2.0
 ├── SNAPCODE
 ├── Workshop
 └── Hackathon
```

Do not create a new student entity for every event.

---

## 5. Attendance Domain

Attendance is event-specific.

```text
Student
   ↓
EventParticipation
   ↓
Attendance
```

Attendance must support:

- participant attendance
- team member attendance
- check-in
- check-out
- corrections
- audit

---

## 6. Media Domain

Media represents club-created digital assets.

Types:

- Photo
- Video
- Document
- Poster
- Certificate
- Other

Media can belong to an Event or another content entity.

Actual large files remain in Google Drive.

---

## 7. Face Discovery Domain

Face discovery is a specialized capability of Media + Identity.

It should not become the identity system.

Relationship:

```text
Student
  ↓
Opt-in FaceEnrollment
  ↓
FaceEmbedding

Media
  ↓
MediaFace
  ↓
Matching
```

The domain's responsibility is discovery, not public identity inference.

---

## 8. Certificate Domain

Certificates represent credentials earned/issued through club activity.

Entities:

- CertificateTemplate
- Certificate
- Verification
- GenerationJob

Certificate lifecycle:

```text
ELIGIBLE
  ↓
GENERATED
  ↓
REVIEW
  ↓
ISSUED
  ↓
VALID
```

Alternative:

```text
VALID
  ↓
REVOKED
```

or:

```text
VALID
  ↓
REPLACED
```

---

## 9. Content Domain

Public storytelling and communication.

Entities:

- ChronicleEntry
- JourneyMilestone
- Announcement
- PublicPage

Content has publication lifecycle:

```text
DRAFT
→ REVIEW
→ APPROVED
→ PUBLISHED
→ ARCHIVED
```

---

## 10. Knowledge Domain

Entities:

- Project
- ProjectMember
- ResearchItem
- LearningResource
- DatasetReference
- RepositoryReference

Knowledge should link to events where appropriate.

Example:

```text
Workshop
   ↓
Learning Resource

Hackathon
   ↓
Project

Research Event
   ↓
Research Item
```

---

## 11. Communication Domain

Channels:

- In-app
- Email
- Official WhatsApp Business integration in future
- Public announcements

The audience model should be reusable.

Example:

```text
Audience:
Aptify 2.0 Participants

Channel:
Email

Template:
Event Photos Available
```

Do not create a separate audience system for every communication channel.

---

## 12. Integration Domain

External systems:

- Tally
- Google Sheets
- Google Drive
- Email provider
- Future official WhatsApp Business API

Integration domain owns:

- connection state
- sync
- source mapping
- conflict detection
- integration logs

It does not become the source of truth for core application entities.

---

## 13. Administration Domain

Responsibilities:

- Configuration
- Roles
- Permissions
- Audit
- Feature flags
- Retention
- System health
- Integration configuration

Only privileged roles can access.

---

## 14. Analytics Domain

Analytics should be derived from canonical domain data.

Examples:

Events:

- registrations
- attendance
- attendance rate
- certificates

Community:

- active members
- event participation
- volunteer activity

Media:

- photos
- videos
- processing status

Certificates:

- generated
- issued
- revoked

Do not manually maintain analytics counters if they can be safely derived.

Cached aggregates may be used for performance.

---

## 15. Domain Relationships

```text
IDENTITY
    │
    ├───────────────┐
    ▼               ▼
PEOPLE            TEAM
    │
    ▼
EVENTS
    │
    ├── PARTICIPATION
    ├── ATTENDANCE
    ├── VOLUNTEERS
    ├── MEDIA
    ├── CERTIFICATES
    ├── FEEDBACK
    ├── DOCUMENTS
    └── TASKS
         │
         ├── CHRONICLE
         └── JOURNEY

MEDIA
    └── FACE DISCOVERY
         │
         ▼
      STUDENT

KNOWLEDGE
    ├── PROJECTS
    ├── RESEARCH
    └── LEARNING

INTEGRATIONS
    ├── TALLY
    ├── SHEETS
    └── DRIVE
```

---

## 16. Source of Truth

Canonical ownership:

| Data | Source of Truth |
|---|---|
| Student identity | Connect DB |
| Event | Connect DB |
| Participation | Connect DB |
| Attendance | Connect DB |
| Certificate record | Connect DB |
| Certificate file | Google Drive |
| Event photo/video | Google Drive |
| Media metadata | Connect DB |
| Tally response | Tally + synchronized reference |
| Operational spreadsheet | Google Sheets + synchronized reference |
| Chronicle | Connect DB |
| Journey | Connect DB |
| Project | Connect DB |
| Research | Connect DB |

---

## 17. Avoiding Circular Ownership

Do not make:

```text
Tally → owns Student
Sheets → owns Event
Drive → owns Certificate
```

Instead:

```text
Connect DB
   ↓
canonical structured record

External tools
   ↓
integrated sources/storage
```

---

## 18. Event as Integration Anchor

External data should usually resolve to an internal Event ID.

Example:

```text
Tally Form
    ↓
tally_form_id
    ↓
EventIntegration
    ↓
Event ID
```

This avoids relying on event names that may change.

---

## 19. Public Content Projection

Public website data should be a projection of approved domain data.

Example:

```text
Event
  ↓
Published Event Projection
  ↓
Public Website
```

Private participant fields must never leak into public projections.

---

## 20. Lifecycle Ownership

Event lifecycle:

```text
Draft
Planning
Registration Open
Registration Closed
Live
Completed
Media Processing
Certificates
Archived
```

Chronicle lifecycle:

```text
Draft
Review
Approved
Published
Archived
```

Certificate lifecycle:

```text
Generated
Review
Issued
Valid
Revoked/Replaced
```

---

## 21. Domain Rule

When adding a new feature, ask:

1. Which domain owns it?
2. What canonical entity does it reference?
3. What permission controls it?
4. Is the data public or private?
5. Does it need an audit trail?
6. Is it stored in DB or external storage?
7. Can it reuse an existing entity?

Do not create isolated feature tables without answering these questions.
