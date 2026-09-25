# Face Search Worker

## Purpose
Biometric face discovery worker for consented student memories.

## Responsibilities (Future Phase 6)
- Face detection in processed event photographs
- Feature embedding generation (512-dimension vector)
- Vector indexing in PostgreSQL `pgvector`
- Opt-in consent enforcement
- Student false-match processing and biometric deletion requests

## Critical Privacy Safeguards
- Strictly opt-in: no embeddings generated without verified consent record
- Never expose raw vectors to the client
- Never use for public identification or surveillance
- Awaiting Phase 6 activation
