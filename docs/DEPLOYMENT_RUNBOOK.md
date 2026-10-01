# AIML CLUB OCT — CONNECT
## Production Deployment Runbook (`DEPLOYMENT_RUNBOOK.md`)

Version: 2.0  
Release: `v1.6.0`  
Last Updated: 2026-10-01  
Target Repositories & Environments:
- Monorepo: `UmeshCode1/Connect-AiML-Club-OCT`
- Database: Supabase PostgreSQL `sslkenwxjqwwzcgafghm` (Region `ap-southeast-1`, Migration `000009` applied)
- Production API Host: **Microsoft Azure Container Apps** (Azure for Students subscription)
- Production Frontend Hosts: **Vercel** (`apps/web` and `apps/admin`)

---

### 1. Architectural Overview & Domain Mapping

Connect is an ecosystem of applications operating on dedicated subdomains. The root institutional domain is strictly preserved and must never be altered or redirected:

```text
                  aimlcluboct.in
                        │
      [Preserved Existing Club Website — DO NOT ALTER]
                        │
    ┌───────────────────┼───────────────────┐
    ▼                   ▼                   ▼
app.aimlcluboct.in   admin.aimlcluboct.in  api.aimlcluboct.in
 (apps/web)          (apps/admin)          (apps/api)
  Vercel (Proj A)     Vercel (Proj B)       Azure Container Apps
```

| Component | Target Domain | Host / Provider | Source Directory | Framework / Runtime |
| :--- | :--- | :--- | :--- | :--- |
| **Existing Site** | `aimlcluboct.in` | Existing Vercel | *External / Intact* | *Do Not Modify* |
| **Student Web PWA** | `app.aimlcluboct.in` | Vercel Project A | `apps/web` | Next.js 15 (App Router) |
| **Admin Portal** | `admin.aimlcluboct.in` | Vercel Project B | `apps/admin` | Next.js 15 (App Router) |
| **Backend API** | `api.aimlcluboct.in` | Azure Container Apps | `apps/api` | FastAPI (Python 3.12+ ASGI) |
| **Database** | Supabase Cloud | Supabase | `supabase/` | PostgreSQL with `pg_trgm`, RLS |

*(Note: Render deployment via `render.yaml` is deprecated in favor of Azure Container Apps under the Azure for Students subscription).*

---

### 2. Primary Backend API Deployment: Microsoft Azure Container Apps

The FastAPI backend is packaged using the production `Dockerfile` and deployed on Azure Container Apps with scale-to-zero to minimize consumption of student credits.

#### A. Azure Resource Planning & Sizing (Cost Safe)
- **Subscription**: Azure for Students ($100 credit)
- **Resource Group**: `rg-aimlclub-connect-prod`
- **Location**: `centralindia` (or `southeastasia` / nearest region)
- **Container Registry**: `acrconnectaimlclub` (SKU: `Basic`, ~$0.16/day)
- **Container Apps Environment**: `cae-aimlclub-connect-prod` (Consumption Workload Profile — includes 180,000 vCPU-seconds and 360,000 GiB-seconds free per month)
- **Container App Sizing**:
  - CPU: `0.25 vCPU`
  - Memory: `0.5 GiB RAM`
  - Min Replicas: `0` (Scales to zero when idle = 0 compute charge!)
  - Max Replicas: `3` (Protects against runaway cost during traffic spikes)

#### B. Step-by-Step Azure Provisioning & Deployment Commands

```bash
# 1. Log in to Azure
az login

# 2. Register required resource providers
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights
az provider register --namespace Microsoft.ContainerRegistry

# 3. Create Resource Group
az group create --name rg-aimlclub-connect-prod --location centralindia

# 4. Create Azure Container Registry (Basic SKU)
az acr create \
  --resource-group rg-aimlclub-connect-prod \
  --name acrconnectaimlclub \
  --sku Basic \
  --admin-enabled true

# 5. Build and Push the Container Image directly in Azure (no local Docker required!)
az acr build \
  --registry acrconnectaimlclub \
  --image connect-aimlclub-api:v1.6.0 \
  . \
  -f Dockerfile

# 6. Create Azure Container Apps Environment (Consumption Plan)
az containerapp env create \
  --name cae-aimlclub-connect-prod \
  --resource-group rg-aimlclub-connect-prod \
  --location centralindia

# 7. Create the Azure Container App with Production Configuration
az containerapp create \
  --name aca-connect-api \
  --resource-group rg-aimlclub-connect-prod \
  --environment cae-aimlclub-connect-prod \
  --image acrconnectaimlclub.azurecr.io/connect-aimlclub-api:v1.6.0 \
  --target-port 8000 \
  --ingress external \
  --cpu 0.25 \
  --memory 0.5Gi \
  --min-replicas 0 \
  --max-replicas 3 \
  --registry-server acrconnectaimlclub.azurecr.io \
  --secrets \
    database-url="<YOUR_SUPABASE_DATABASE_URL>" \
    supabase-anon-key="<YOUR_SUPABASE_ANON_KEY>" \
    supabase-jwt-secret="<YOUR_SUPABASE_JWT_SECRET>" \
    secret-key="<YOUR_RANDOM_SECRET_KEY>" \
  --env-vars \
    ENVIRONMENT=production \
    PORT=8000 \
    PYTHONPATH=/app \
    SUPABASE_URL=https://sslkenwxjqwwzcgafghm.supabase.co \
    CORS_ORIGINS="https://app.aimlcluboct.in,https://admin.aimlcluboct.in,https://aimlcluboct.in" \
    DATABASE_URL=secretref:database-url \
    SUPABASE_ANON_KEY=secretref:supabase-anon-key \
    SUPABASE_JWT_SECRET=secretref:supabase-jwt-secret \
    SECRET_KEY=secretref:secret-key
```

#### C. Custom Domain & DNS for `api.aimlcluboct.in`
1. **Retrieve Ingress FQDN**:
   ```bash
   az containerapp show --name aca-connect-api --resource-group rg-aimlclub-connect-prod --query properties.configuration.ingress.fqdn -o tsv
   # Output e.g.: aca-connect-api.wonderfulplant-xxxx.centralindia.azurecontainerapps.io
   ```
2. **Update DNS Records at Hostinger/DNS Registrar**:
   - `api.aimlcluboct.in` currently points toward Vercel Anycast.
   - Add verification TXT record:
     - **Name**: `asuid.api`
     - **Value**: Verification ID obtained from `az containerapp hostname get-verification-id`
   - Update CNAME record:
     - **Name**: `api`
     - **Target**: `<aca-connect-api-fqdn>`
3. **Bind Custom Domain & Free Managed Certificate**:
   ```bash
   az containerapp hostname bind \
     --hostname api.aimlcluboct.in \
     --name aca-connect-api \
     --resource-group rg-aimlclub-connect-prod \
     --environment cae-aimlclub-connect-prod \
     --validation-method CNAME
   ```

#### D. Azure Student Cost Control & Budget Alerts
1. In Azure Portal: Navigate to **Cost Management + Billing $\rightarrow$ Budgets**.
2. Click **Add Budget**:
   - **Name**: `aimlclub-connect-student-budget`
   - **Reset Period**: Monthly
   - **Amount**: `$10.00`
   - **Alert Conditions**: Trigger alert at 50% ($5.00), 80% ($8.00), and 100% ($10.00).
   - **Notification**: Add administrator email.
3. Scale-to-zero is configured by default (`min-replicas: 0`), ensuring zero compute charges when there is no incoming traffic.

---

### 3. Vercel Project A: Student/Member Web App (`apps/web`)

1. **Dashboard Configuration**:
   - Add New Project $\rightarrow$ Link `Connect-AiML-Club-OCT`
   - **Project Name**: `connect-web`
   - **Framework**: `Next.js`
   - **Root Directory**: `apps/web` (Enable *"Include files outside Root Directory"*)
2. **Domain Configuration**:
   - Settings $\rightarrow$ Domains $\rightarrow$ Add `app.aimlcluboct.in`.
3. **Environment Variables**:
   - `NEXT_PUBLIC_APP_URL`: `https://app.aimlcluboct.in`
   - `NEXT_PUBLIC_API_URL`: `https://api.aimlcluboct.in`
   - `NEXT_PUBLIC_MAIN_SITE_URL`: `https://aimlcluboct.in`
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://sslkenwxjqwwzcgafghm.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `<SUPABASE_ANON_KEY>`

---

### 4. Vercel Project B: Admin Management Portal (`apps/admin`)

1. **Dashboard Configuration**:
   - Add New Project $\rightarrow$ Link `Connect-AiML-Club-OCT`
   - **Project Name**: `connect-admin`
   - **Framework**: `Next.js`
   - **Root Directory**: `apps/admin` (Enable *"Include files outside Root Directory"*)
2. **Domain Configuration**:
   - Settings $\rightarrow$ Domains $\rightarrow$ Add `admin.aimlcluboct.in`.
3. **Environment Variables**:
   - `NEXT_PUBLIC_APP_URL`: `https://admin.aimlcluboct.in`
   - `NEXT_PUBLIC_API_URL`: `https://api.aimlcluboct.in`
   - `NEXT_PUBLIC_MAIN_SITE_URL`: `https://aimlcluboct.in`
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://sslkenwxjqwwzcgafghm.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `<SUPABASE_ANON_KEY>`

---

### 5. Root Domain Protection & Isolation Verification

- **URL**: `https://aimlcluboct.in`
- **Rule**: Must always serve the existing website project. Never redirect to `app` or `admin`.
- **Verification**: `curl -I https://aimlcluboct.in` $\rightarrow$ `HTTP 200 OK`.

---

### 6. Post-Deployment Verification Checklist

Once services are provisioned:
1. `GET https://api.aimlcluboct.in/health` $\rightarrow$ `200 OK`
2. `GET https://app.aimlcluboct.in/projects` $\rightarrow$ `200 OK` (renders project gallery)
3. `GET https://app.aimlcluboct.in/research` $\rightarrow$ `200 OK` (renders research catalog)
4. `GET https://app.aimlcluboct.in/learning` $\rightarrow$ `200 OK` (renders learning resources)
5. `GET https://app.aimlcluboct.in` $\rightarrow$ Press `Ctrl+K` $\rightarrow$ Global search queries `https://api.aimlcluboct.in/v1/search`
6. `GET https://aimlcluboct.in` $\rightarrow$ `200 OK` (confirms original public site remains untouched)
