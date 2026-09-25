# Security & Privacy Guidelines

## Security Foundation
1. **Zero Secret Commits**: No API keys, Google credentials, or passwords committed. `.env` is ignored; `.env.example` provides documentation.
2. **Server-Side Authorization**: Frontend route guards are UX only. FastAPI dependencies enforce action permissions.
3. **Biometric Privacy**:
   - Strictly opt-in face enrollment.
   - Vectors are never exposed to public clients.
   - No public face identification tools.
4. **Data Minimization**: Public verification endpoints omit student contact numbers, email addresses, and personal attendance statistics.
5. **Audit Logging**: Sensitive changes (role grants, certificate actions, data exports) write immutable records to `audit_logs`.
