# AIML Club OCT — Connect
## Security & Privacy Specification

Version: 1.0

## 1. Security Objective

Protect:

- student identity
- contact information
- attendance
- certificates
- private media
- biometric data
- administrative records
- integration credentials

## 2. Security Principles

- Least privilege
- Defense in depth
- Secure defaults
- Explicit authorization
- Data minimization
- Auditability
- Encryption in transit
- Secure secret management
- Privacy by design

## 3. Authentication

Use a supported authentication provider such as Supabase Auth.

Support as appropriate:

- email/password or magic link
- Google OAuth
- session management
- logout
- account recovery
- MFA for privileged users

## 4. Authorization

Authorization is server-side.

Use:

- RBAC
- event scope
- resource visibility
- RLS where applicable

Never trust client-provided role values.

## 5. Secrets

Never commit:

- API keys
- OAuth secrets
- Google credentials
- service account keys
- database passwords
- JWT signing secrets

Use environment secrets/secret manager.

`.env.example` may contain variable names but never real secrets.

## 6. Personal Data

Minimize collection.

Only collect data required for:

- registration
- event operations
- communication
- certificates
- authorized media
- club administration

## 7. Biometric Data

Face matching requires explicit opt-in.

Requirements:

- explain purpose
- explain retention
- record consent version
- allow withdrawal
- protect embeddings
- restrict access
- delete according to retention/withdrawal policy

Do not use biometric data for unrelated purposes.

## 8. Face Search Safety

The system must not provide public "identify this person" functionality.

Allowed model:

```text
Authenticated student
+
their enrolled biometric reference
+
authorized club media
→
personal discovery
```

## 9. Media Privacy

Every media asset must have a visibility policy.

Example:

```text
PUBLIC
EVENT_MEMBERS
TEAM_ONLY
ADMIN_ONLY
HIDDEN
```

Private media must not be exposed through:

- search
- sitemap
- public URLs
- predictable file paths
- client-side prefetch
- public Drive permissions

## 10. Certificate Privacy

Public verification should expose only necessary information.

Do not expose:

- phone
- email
- private attendance
- internal database IDs

## 11. Data Retention

Define retention before production.

Categories:

- student records
- event records
- media
- certificates
- feedback
- biometric embeddings
- temporary processing files
- audit logs

Do not create indefinite retention by accident.

## 12. Deletion

Deletion must distinguish:

- user-visible removal
- soft deletion
- legal/operational retention
- permanent deletion

Sensitive deletion actions should be audited.

## 13. Audit Logs

Log:

- login/security events
- permission changes
- data exports
- biometric changes
- certificate changes
- media deletion
- integration changes
- administrative edits

Do not log passwords, access tokens, raw embeddings, or unnecessary personal data.

## 14. API Security

Use:

- schema validation
- rate limits
- authentication
- authorization
- secure headers
- CORS policy
- request size limits
- file type validation
- malware scanning where appropriate

## 15. File Security

Do not trust:

- filename
- MIME type supplied by client
- extension
- metadata

Validate uploads.

Use safe storage and processing pipelines.

## 16. Export Security

Participant/export features are sensitive.

Require:

- explicit permission
- filters
- audit log
- reasonable limits

Prefer generated files with controlled access rather than exposing database dumps.

## 17. Admin Security

Privileged accounts should support:

- MFA
- session expiry
- re-authentication for sensitive actions
- audit trail

## 18. Incident Response

Create a basic operational process:

```text
Detect
→ Contain
→ Investigate
→ Recover
→ Document
→ Prevent recurrence
```

## 19. Dependency Security

Use:

- lockfiles
- dependency updates
- vulnerability scanning
- minimal dependencies

Do not add packages simply because they simplify one small UI feature.

## 20. Privacy UX

Create a privacy center where appropriate.

Students should be able to understand:

- what data is stored
- why it is used
- what is public
- face enrollment status
- withdrawal/deletion options
