# AIML CLUB OCT — CONNECT
## Production Deployment Runbook (`DEPLOYMENT_RUNBOOK.md`)

Version: 1.0  
Release: `v1.6.0`  
Last Updated: 2026-10-01  
Target Repositories & Environments:
- Monorepo: `UmeshCode1/Connect-AiML-Club-OCT`
- Supabase Project Ref: `sslkenwxjqwwzcgafghm` (Region `ap-southeast-1`)

---

### 1. Architectural Overview & Domain Mapping

Connect is an ecosystem of applications operating on dedicated subdomains. The root institutional domain is strictly preserved:

```text
                  aimlcluboct.in
                        │
      [Preserved Existing Club Website — DO NOT ALTER]
                        │
    ┌───────────────────┼───────────────────┐
    ▼                   ▼                   ▼
app.aimlcluboct.in   admin.aimlcluboct.in  api.aimlcluboct.in
 (apps/web)          (apps/admin)          (apps/api)
  Vercel               Vercel               Render / ASGI
```

| Component | Target Domain | Host / Provider | Source Directory | Framework / Runtime |
| :--- | :--- | :--- | :--- | :--- |
| **Existing Site** | `aimlcluboct.in` | Existing Vercel | *External / Intact* | *Do Not Modify* |
| **Student Web PWA** | `app.aimlcluboct.in` | Vercel Project A | `apps/web` | Next.js 15 (App Router) |
| **Admin Portal** | `admin.aimlcluboct.in` | Vercel Project B | `apps/admin` | Next.js 15 (App Router) |
| **Backend API** | `api.aimlcluboct.in` | Render (or ASGI Container) | `apps/api` | FastAPI (Python 3.12+) |
| **Database** | Supabase Cloud | Supabase | `supabase/` | PostgreSQL with `pg_trgm`, RLS |

---

### 2. Vercel Project A: Student/Member Web App (`apps/web`)

1. **Create New Project in Vercel Dashboard**:
   - Link repository: `UmeshCode1/Connect-AiML-Club-OCT`
   - **Project Name**: `connect-web` (or `connect-aiml-app`)
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click *Edit* and select `apps/web`.
   - Ensure the option *"Include files outside of the Root Directory in the Build Step"* is checked (needed to access `@connect/*` workspace packages).
2. **Build & Development Settings**:
   - **Build Command**: Default (`next build` / `npm run build`)
   - **Output Directory**: Default (`.next`)
   - **Install Command**: Default (`npm install`)
3. **Domain Configuration**:
   - Navigate to **Settings $\rightarrow$ Domains**.
   - Add domain: `app.aimlcluboct.in`.
   - Verify CNAME record points to `cname.vercel-dns.com`.
4. **Environment Variables**:
   - `NEXT_PUBLIC_APP_URL`: `https://app.aimlcluboct.in`
   - `NEXT_PUBLIC_API_URL`: `https://api.aimlcluboct.in`
   - `NEXT_PUBLIC_MAIN_SITE_URL`: `https://aimlcluboct.in`
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://sslkenwxjqwwzcgafghm.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `<SUPABASE_ANON_KEY>`

---

### 3. Vercel Project B: Admin Management Portal (`apps/admin`)

1. **Create New Project in Vercel Dashboard**:
   - Link repository: `UmeshCode1/Connect-AiML-Club-OCT`
   - **Project Name**: `connect-admin`
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click *Edit* and select `apps/admin`.
   - Ensure *"Include files outside of the Root Directory in the Build Step"* is checked.
2. **Build & Development Settings**:
   - **Build Command**: Default (`next build` / `npm run build`)
   - **Output Directory**: Default (`.next`)
   - **Install Command**: Default (`npm install`)
3. **Domain Configuration**:
   - Navigate to **Settings $\rightarrow$ Domains**.
   - Add domain: `admin.aimlcluboct.in`.
   - Verify CNAME record points to `cname.vercel-dns.com`.
4. **Environment Variables**:
   - `NEXT_PUBLIC_APP_URL`: `https://admin.aimlcluboct.in`
   - `NEXT_PUBLIC_API_URL`: `https://api.aimlcluboct.in`
   - `NEXT_PUBLIC_MAIN_SITE_URL`: `https://aimlcluboct.in`
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://sslkenwxjqwwzcgafghm.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `<SUPABASE_ANON_KEY>`

---

### 4. FastAPI Backend Deployment: Render (`apps/api`)

The persistent FastAPI service runs using Uvicorn via `render.yaml` or a Render Web Service.

1. **Render Configuration Settings**:
   - **Environment**: Python 3.12+
   - **Root Directory**: `.` (Repository root)
   - **Build Command**: `pip install -r apps/api/requirements.txt`
   - **Start Command**: `uvicorn apps.api.src.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`
2. **Custom Domain on Render**:
   - In Render Dashboard: **Settings $\rightarrow$ Custom Domains**.
   - Add: `api.aimlcluboct.in`.
   - Configure DNS CNAME in Hostinger/Cloudflare for `api` subdomain to Render's onrender address.
3. **Environment Variables (Render Dashboard $\rightarrow$ Environment)**:
   - `ENVIRONMENT`: `production`
   - `PORT`: `8000` (or injected by Render)
   - `PYTHONPATH`: `.`
   - `CORS_ORIGINS`: `https://app.aimlcluboct.in,https://admin.aimlcluboct.in,https://aimlcluboct.in`
   - `DATABASE_URL`: `postgresql://postgres:[PASSWORD]@db.sslkenwxjqwwzcgafghm.supabase.co:5432/postgres`
   - `SUPABASE_URL`: `https://sslkenwxjqwwzcgafghm.supabase.co`
   - `SUPABASE_ANON_KEY`: `<SUPABASE_ANON_KEY>`
   - `SUPABASE_JWT_SECRET`: `<SUPABASE_JWT_SECRET>`
   - `SECRET_KEY`: `<STRONG_RANDOM_SECRET>`
   - `GOOGLE_DRIVE_ROOT_FOLDER_ID`: `<FOLDER_ID>`

---

### 5. CORS & Origin Isolation

Production CORS enforces strict origin whitelisting:
- Permitted Origins:
  - `https://app.aimlcluboct.in`
  - `https://admin.aimlcluboct.in`
  - `https://aimlcluboct.in`
- Wildcards (`"*"`) are strictly prohibited in authenticated production APIs.

---

### 6. Health & Liveness Checks

The API provides two endpoints:
- Liveness Probe: `GET https://api.aimlcluboct.in/health`
  - Expected Response: `200 OK`
  - Payload:
    ```json
    {
      "status": "healthy",
      "service": "AIML Club OCT — Connect API",
      "environment": "production",
      "tagline": "Innovate. Implement. Inspire."
    }
    ```
- Readiness Probe: `GET https://api.aimlcluboct.in/ready`
  - Expected Response: `200 OK`

---

### 7. Rollback Procedures

1. **Frontend / Admin Rollback**:
   - In Vercel Project Dashboard: **Deployments**.
   - Select previous successful deployment and click **Promote to Production** (instant zero-downtime rollback).
2. **Backend API Rollback**:
   - In Render Dashboard: Roll back to previous successful commit deploy.
3. **Database Rollback**:
   - Never run raw destructive SQL in production.
   - Forward migration or point-in-time recovery via Supabase console.

---

### 8. Verification & Post-Deployment Checklist

Following deployment:
1. `GET https://api.aimlcluboct.in/health` $\rightarrow$ `200 OK`.
2. `GET https://app.aimlcluboct.in/projects` $\rightarrow$ `200 OK` (renders project gallery).
3. `GET https://app.aimlcluboct.in/research` $\rightarrow$ `200 OK` (renders academic papers).
4. `GET https://app.aimlcluboct.in/learning` $\rightarrow$ `200 OK` (renders resources).
5. Open `https://app.aimlcluboct.in` and press `Ctrl+K` $\rightarrow$ Command palette opens and queries `/v1/search`.
6. `GET https://aimlcluboct.in` $\rightarrow$ `200 OK` (confirms original public site remains untouched).
