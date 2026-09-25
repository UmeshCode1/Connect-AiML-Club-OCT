# AIML Club OCT — Connect
## Integrations Specification

Version: 1.0

## 1. Integration Philosophy

External tools remain useful.

Connect should integrate rather than unnecessarily replace:

- Tally
- Google Sheets
- Google Drive
- Email provider
- Future official WhatsApp Business Platform

The Connect database owns structured application relationships.

## 2. Integration Architecture

```text
External Provider
      ↓
Integration Adapter
      ↓
Validation / Normalization
      ↓
Sync Engine
      ↓
Connect Database
      ↓
Audit + Sync Log
```

Every integration must be isolated behind an adapter/service.

## 3. Tally

Responsibilities:

- registration forms
- feedback forms
- suggestions
- event-specific inputs

Support:

- webhook ingestion where available
- API synchronization where appropriate
- source record IDs
- sync status
- retry
- conflict detection

Never trust external input without validation.

## 4. Google Sheets

Use Sheets for club-friendly operational workflows.

Possible uses:

- participant lists
- attendance exports
- operational records
- event management
- reporting

The integration must support:

- import
- export
- synchronization
- column mapping
- validation
- conflict review

Do not assume a sheet's column order is permanent.

## 5. Google Drive

Drive is primary large-file storage.

Integration responsibilities:

- folder creation
- file metadata
- uploads
- downloads/access
- file references
- storage reporting
- reconciliation

See `08_GOOGLE_DRIVE_ARCHITECTURE.md`.

## 6. Email

Use one primary email provider initially.

Capabilities:

- transactional messages
- event announcements
- certificate notifications
- photo availability notifications
- Chronicle distribution
- admin alerts

All messages should use reusable templates.

Track:

- provider message ID
- status
- sent time
- failure reason

Do not send mass mail directly from application code without queueing.

## 7. WhatsApp

If implemented, use the official WhatsApp Business Platform/API.

Do not use:

- unofficial WhatsApp Web automation
- browser scraping
- unofficial bulk messaging tools

Support:

- approved templates
- opt-in/consent
- audience segmentation
- delivery status
- rate limits

## 8. Integration Configuration

Admin should see:

```text
Provider
Status
Last Sync
Last Successful Sync
Last Error
Connected Account
```

Never display secrets.

## 9. Webhook Security

Webhook processing must:

1. Validate provider signature where available.
2. Validate payload schema.
3. Check event ID/idempotency.
4. Store receipt.
5. Queue processing.
6. Return quickly.
7. Retry safely.

## 10. Sync States

```text
CONNECTED
SYNCING
HEALTHY
WARNING
ERROR
DISCONNECTED
```

## 11. Conflict Handling

When external data conflicts with Connect:

```text
Incoming
Existing
Source
Field
Detected At
Status
```

Admin actions:

- accept incoming
- keep existing
- manually edit
- ignore

## 12. Integration Logs

Log:

- sync started
- sync completed
- records processed
- failures
- conflicts
- provider errors

Do not log secrets or unnecessary personal data.

## 13. Integration Failure

A provider outage must not take down the entire platform.

Use:

```text
Queue
Retry
Backoff
Dead-letter/error state
Admin visibility
```

## 14. Integration Principle

External services should be replaceable.

Business logic must not be deeply coupled to a provider-specific SDK throughout the application.
