# AIML Club OCT — Connect
## Data Migration Specification

Version: 1.0

## 1. Objective

Migrate existing AIML Club OCT data into Connect without losing historical information, creating duplicate students, or corrupting event relationships.

Potential legacy sources:

- Google Sheets
- Tally responses
- Existing Drive folders
- Existing certificate records
- Existing event records
- Existing member/team lists
- CSV/XLSX exports
- Existing website content

Migration must be reversible and auditable.

## 2. Migration Principle

Never import legacy data directly into production tables.

Use:

```text
Source
  ↓
Raw/Staging
  ↓
Normalize
  ↓
Validate
  ↓
Deduplicate
  ↓
Map IDs
  ↓
Review
  ↓
Production
```

## 3. Migration Order

Recommended order:

1. Students
2. Team memberships
3. Events
4. Event participants
5. Attendance
6. Media metadata
7. Certificates
8. Feedback
9. Projects
10. Research
11. Journey
12. Chronicle
13. Documents/resources

## 4. Student Deduplication

Potential matching keys:

1. Enrollment number
2. Verified email
3. Verified phone
4. Name + batch + department
5. Manual review

Never merge records solely because names match.

Create a migration conflict when identity is uncertain.

## 5. Stable IDs

Generate Connect IDs for imported records.

Examples:

```text
STU-000184
EVT-APTIFY-2026
AIML26-APT-000184
```

Preserve external IDs:

```text
source = GOOGLE_SHEETS
source_record_id = ...
```

## 6. Legacy Drive Migration

Do not immediately move existing Drive files.

First:

- inventory folders
- identify events
- map folder IDs
- identify duplicates
- identify orphaned files
- classify media
- record permissions

Then connect existing folders to Connect.

Migration should prefer referencing existing files rather than copying them.

## 7. Tally Migration

Import historical Tally responses into staging.

Map:

```text
Tally field
    ↓
normalized field
    ↓
student/event participation
```

Preserve the original Tally response ID.

## 8. Google Sheets Migration

Sheets are often manually edited.

Before import:

- freeze a source copy
- record sheet name
- record import timestamp
- inspect headers
- normalize dates
- normalize enrollment numbers
- normalize phone/email
- identify duplicates
- identify missing values

## 9. Certificate Migration

Historical certificates should retain:

- existing certificate ID
- recipient
- event
- issue date
- original Drive file
- status if known
- migration source

If an old certificate has no verification record, create a legacy verification record only after administrative validation.

Do not invent historical certificate IDs.

## 10. Migration Reports

Every migration should produce:

```text
records read
records created
records updated
records skipped
duplicates
conflicts
errors
unmapped records
```

Export a migration report.

## 11. Dry Run

Every significant migration must support dry-run mode.

Example:

```text
DRY RUN

Students:
500 source
472 matched
18 new
7 conflicts
3 invalid
```

No production writes during dry run.

## 12. Rollback

Migration batches should be identifiable.

Store:

```text
migration_batch_id
```

Where safe, imported records can be rolled back by batch.

Do not delete historical data automatically during rollback.

## 13. Acceptance

Migration is complete only after:

- counts reconcile
- sample records are verified
- Drive references work
- certificates resolve
- event participants reconcile
- conflicts are resolved
- migration report is archived
