# Integrations Architecture

## Overview
Connect extends and standardizes the club's existing tools rather than forcing premature replacement.

## 1. Tally Forms
- Primary entry point for event registrations and participant feedback.
- Submissions ingested via webhook into staging tables.
- Source records preserve `source = 'TALLY'` and `source_record_id`.

## 2. Google Sheets
- Operational tabular data layer used by club executives.
- Two-way synchronization adapter with conflict review center.
- Does not bypass data validation.

## 3. Google Drive
- Storage layer for all event photography, video recordings, certificates, and documents.
- Managed by immutable Google Drive folder and file IDs.
- Structure:
  - `AIML CLUB MEDIA/<Year>/<Event Name>/Photos`
  - `AIML CLUB MEDIA/<Year>/<Event Name>/Videos`
  - `AIML CLUB MEDIA/<Year>/<Event Name>/Certificates`
  - `AIML CLUB MEDIA/<Year>/<Event Name>/Documents`
  - `AIML CLUB MEDIA/<Year>/<Event Name>/Resources`

## 4. Email & Messaging
- Transactional notifications via approved provider templates.
- Mass emails handled via background workers.
- WhatsApp Business API reserved for future official integration.
