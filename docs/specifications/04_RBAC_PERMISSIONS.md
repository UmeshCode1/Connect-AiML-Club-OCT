# AIML Club OCT — Connect
## RBAC & Permissions Specification

Version: 1.0

---

## 1. Authorization Model

Connect uses layered authorization:

```text
Authentication
      ↓
Account
      ↓
Global Role
      ↓
Event/Resource Scope
      ↓
Permission
      ↓
Action
```

A user must satisfy all applicable authorization layers.

Do not implement authorization as a frontend-only feature.

The backend/API is the final authorization boundary.

---

## 2. Core Roles

### SUPER_ADMIN

Full platform control.

Typical capabilities:

- System configuration
- All users
- All events
- All integrations
- Security settings
- Permission management
- Audit logs
- Data recovery

### CLUB_ADMIN

Operational club administration.

Typical capabilities:

- Events
- Participants
- Attendance
- Team
- Media
- Certificates
- Feedback
- Chronicle
- Journey
- Reports

### EVENT_MANAGER

Can manage assigned events.

### MEDIA_MANAGER

Can manage media and processing for assigned events.

### CERTIFICATE_MANAGER

Can manage certificate workflows.

### CONTENT_MANAGER

Can manage public content.

### VOLUNTEER

Limited event-scoped operational access.

### VIEWER

Read-only access to explicitly permitted resources.

---

## 3. Permission Naming

Use:

`module.action`

Examples:

```text
events.view
events.create
events.update
events.delete
events.publish

participants.view
participants.create
participants.import
participants.update
participants.export

attendance.view
attendance.mark
attendance.correct

media.view
media.upload
media.process
media.delete

certificates.view
certificates.generate
certificates.issue
certificates.revoke
certificates.reissue

feedback.view
feedback.publish
feedback.export

chronicle.create
chronicle.update
chronicle.approve
chronicle.publish

journey.create
journey.update
journey.publish

integrations.view
integrations.sync
integrations.configure

audit.view
```

---

## 4. Permission Matrix

| Permission | Super Admin | Club Admin | Event Manager | Media Manager | Certificate Manager | Content Manager | Volunteer | Viewer |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| events.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | scoped | scoped |
| events.create | ✓ | ✓ | ✓ | — | — | — | — | — |
| events.update | ✓ | ✓ | ✓ | — | — | scoped | — | — |
| events.delete | ✓ | ✓ | — | — | — | — | — | — |
| events.publish | ✓ | ✓ | ✓ | — | — | ✓ | — | — |
| participants.view | ✓ | ✓ | ✓ | scoped | scoped | — | scoped | — |
| participants.import | ✓ | ✓ | ✓ | — | — | — | — | — |
| participants.update | ✓ | ✓ | ✓ | — | — | — | scoped | — |
| participants.export | ✓ | ✓ | ✓ | — | scoped | — | — | — |
| attendance.view | ✓ | ✓ | ✓ | — | — | — | scoped | — |
| attendance.mark | ✓ | ✓ | ✓ | — | — | — | scoped | — |
| attendance.correct | ✓ | ✓ | ✓ | — | — | — | — | — |
| media.view | ✓ | ✓ | ✓ | ✓ | scoped | scoped | scoped | scoped |
| media.upload | ✓ | ✓ | ✓ | ✓ | — | — | scoped | — |
| media.process | ✓ | ✓ | — | ✓ | — | — | — | — |
| media.delete | ✓ | ✓ | — | ✓ | — | — | — | — |
| certificates.view | ✓ | ✓ | scoped | scoped | ✓ | — | — | own |
| certificates.generate | ✓ | ✓ | — | — | ✓ | — | — | — |
| certificates.issue | ✓ | ✓ | — | — | ✓ | — | — | — |
| certificates.revoke | ✓ | ✓ | — | — | ✓ | — | — | — |
| feedback.view | ✓ | ✓ | ✓ | — | — | ✓ | — | — |
| feedback.publish | ✓ | ✓ | — | — | — | ✓ | — | — |
| chronicle.* | ✓ | ✓ | — | — | — | ✓ | — | — |
| journey.* | ✓ | ✓ | — | — | — | ✓ | — | — |
| projects.* | ✓ | ✓ | — | — | — | ✓ | — | — |
| research.* | ✓ | ✓ | — | — | — | ✓ | — | — |
| learning.* | ✓ | ✓ | — | — | — | ✓ | — | — |
| integrations.view | ✓ | ✓ | — | — | — | — | — | — |
| integrations.sync | ✓ | ✓ | — | — | — | — | — | — |
| integrations.configure | ✓ | ✓ | — | — | — | — | — | — |
| audit.view | ✓ | ✓ | — | — | — | — | — | — |

`*` means the appropriate CRUD/publish permissions for that module.

---

## 5. Event Scope

A role can be limited to specific events.

Example:

```text
User:
    Daksh

Global role:
    EVENT_MANAGER

Assigned events:
    Aptify 2.0
    SNAPCODE 2026

Result:
    Daksh can manage those events,
    but cannot automatically manage every event.
```

Scope types:

- GLOBAL
- EVENT
- MODULE
- SELF

---

## 6. Self Scope

Some permissions are naturally restricted to the authenticated user.

Examples:

```text
profile.view → SELF
certificates.view → SELF
attendance.view → SELF
participation.view → SELF
authorized_memories.view → SELF
```

Do not allow users to change their own role or permission scope.

---

## 7. Sensitive Permissions

Require elevated authorization:

```text
face_enrollment.view
face_embedding.delete
certificate.issue
certificate.revoke
participant.export
feedback.export
audit.view
integration.configure
permission.manage
user.suspend
```

---

## 8. Approval Rules

Sensitive operations should support approval where appropriate.

Example:

```text
Certificate:
GENERATED
    ↓
REVIEW
    ↓
APPROVED
    ↓
ISSUED
```

Content:

```text
DRAFT
    ↓
REVIEW
    ↓
APPROVED
    ↓
PUBLISHED
```

Do not allow ordinary contributors to bypass approval through a frontend API call.

---

## 9. Role Assignment

Only authorized administrators may:

- Create roles
- Modify role permissions
- Assign privileged roles
- Remove privileged roles
- Change event scope

Every permission change must generate an audit record.

---

## 10. RLS / Backend Authorization

Use PostgreSQL/Supabase RLS as a second authorization layer where appropriate.

The application backend must also enforce authorization.

Never rely exclusively on:

- hidden UI buttons,
- client-side route guards,
- frontend role checks.

---

## 11. Authorization Decision

Every protected request should conceptually resolve:

```text
Can actor X
perform action Y
on resource Z
within scope S?
```

Example:

```text
Actor:
EVENT_MANAGER

Action:
media.delete

Resource:
Photo from Aptify 2.0

Scope:
Aptify 2.0

Decision:
ALLOW
```

Same actor:

```text
Resource:
Photo from unrelated event

Decision:
DENY
```

---

## 12. Denial Behavior

Return appropriate authorization errors.

Typical:

- `401 Unauthorized` — not authenticated.
- `403 Forbidden` — authenticated but not authorized.
- `404 Not Found` — use when exposing resource existence would itself reveal protected information.

Do not leak private resource existence through error messages.

---

## 13. Audit Requirements

Log:

- Role assignment
- Permission change
- Scope change
- User suspension
- Sensitive exports
- Certificate issue/revoke
- Biometric deletion
- Media deletion
- Integration changes

---

## 14. Security Rule

Permissions must be additive and explicit.

Avoid rules such as:

```text
if admin:
    allow everything
```

except for the actual `SUPER_ADMIN` role.

Even Club Admin should have a defined permission set.
