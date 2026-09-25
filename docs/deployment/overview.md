# Deployment Architecture Overview

## Subdomain Map
- `aimlcluboct.in`: Existing public website (remains untouched).
- `app.aimlcluboct.in`: Student/member application (`apps/web`).
- `admin.aimlcluboct.in`: Administration dashboard (`apps/admin`).
- `api.aimlcluboct.in`: Backend FastAPI service (`apps/api`).
- Existing subdomains (`voice.aimlcluboct.in`, `social.aimlcluboct.in`): Unmodified.

## Environments
- **Development**: Local services on ports 3000 (web), 3001 (admin), 8000 (api).
- **Staging**: Internal preview builds.
- **Production**: Vercel/Cloud Run/Supabase.
