# AIML Club OCT — Connect
## Testing Strategy

Version: 1.0

## 1. Testing Pyramid

```text
        E2E
       /   \
   Integration
     /       \
   Unit / Component
```

Use the highest level only when it adds value.

## 2. Unit Tests

Test:

- business rules
- certificate ID generation
- eligibility rules
- permission checks
- data normalization
- validation
- search utilities
- date handling

## 3. Component Tests

Test:

- forms
- tables
- filters
- dialogs
- navigation
- certificate cards
- galleries
- permission-aware controls

## 4. Integration Tests

Test:

- database operations
- API authorization
- Tally sync
- Sheets sync
- Drive integration
- certificate generation
- background jobs

## 5. E2E Tests

Critical flows:

### Event

```text
Create event
→ Drive folders
→ Registration
→ Participant
→ Attendance
→ Media
→ Certificate
```

### Student

```text
Login
→ Events
→ Personal attendance
→ Memories
→ Certificates
→ Verification
```

### Admin

```text
Login
→ Permissions
→ Event management
→ Import
→ Audit
```

## 6. Security Testing

Test:

- unauthorized access
- horizontal privilege escalation
- vertical privilege escalation
- IDOR
- private media exposure
- export authorization
- webhook verification
- rate limiting
- file upload abuse

## 7. Privacy Testing

Verify:

- private data not returned publicly
- face embeddings inaccessible
- consent respected
- deleted/withdrawn biometric data not used
- public feedback respects consent
- sitemap excludes private records

## 8. Media Testing

Test:

- large images
- large videos
- corrupt files
- unsupported types
- duplicate files
- interrupted uploads
- Drive failures
- processing retry

## 9. Certificate Testing

Test:

- field placement
- special characters
- long names
- Unicode
- QR generation
- verification
- revocation
- replacement
- duplicate generation

## 10. Migration Testing

Test:

- duplicate students
- missing enrollment numbers
- conflicting phone/email
- malformed dates
- legacy certificates
- missing Drive files

## 11. Responsive Testing

Minimum:

- small Android phone
- large Android phone
- tablet
- laptop
- large desktop

## 12. Accessibility Testing

Test:

- keyboard
- screen reader
- contrast
- focus
- reduced motion
- labels
- error messages

## 13. Performance Testing

Measure:

- initial page load
- public event page
- gallery loading
- search
- admin tables
- API latency
- large upload behavior
- worker throughput

## 14. Regression

Every major feature must have regression coverage for existing functionality.

## 15. CI

CI should eventually run:

```text
Lint
Typecheck
Unit tests
Component tests
Build
Security/dependency checks
```

E2E can run on pull requests and/or protected branches depending on execution cost.

## 16. Release Criteria

Do not release if:

- critical security tests fail
- private data leaks
- certificate verification fails
- migration counts do not reconcile
- production build fails
- major mobile navigation is broken
