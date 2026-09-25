# AIML Club OCT — Connect
## Deployment Specification

Version: 1.0

## 1. Environments

Maintain:

```text
Development
Staging
Production
```

## 2. Domains

```text
aimlcluboct.in
app.aimlcluboct.in
admin.aimlcluboct.in
api.aimlcluboct.in
```

Existing club subdomains remain intact.

## 3. Frontend

Preferred deployment:

- Vercel or existing approved platform.

Requirements:

- environment variables
- preview deployments
- production deployment
- HTTPS
- domain configuration
- caching

## 4. API

Possible deployment:

- Render
- Google Cloud Run
- another approved container/server platform

Requirements:

- HTTPS
- health endpoint
- environment secrets
- logs
- restart policy
- worker connectivity

## 5. Workers

Worker responsibilities:

- face processing
- video processing
- certificate generation
- imports
- sync
- notifications

Workers must be independently restartable.

## 6. Database

Supabase/PostgreSQL.

Production requirements:

- backups
- RLS
- migrations
- indexes
- monitoring
- least-privilege access

## 7. Environment Variables

Maintain:

```text
.env.example
```

Never commit actual secrets.

Separate:

```text
development
staging
production
```

## 8. Deployment Flow

```text
Feature branch
    ↓
Pull request
    ↓
CI
    ↓
Review
    ↓
Staging
    ↓
Smoke tests
    ↓
Production
```

## 9. Database Migrations

Never manually modify production schema without a tracked migration.

Migration files must be versioned.

Before destructive migration:

- backup
- test
- review
- migration plan

## 10. Health Checks

API should provide:

```text
/health
/ready
```

Health should distinguish:

- application alive
- dependencies ready

Do not expose sensitive diagnostic information publicly.

## 11. Monitoring

Monitor:

- uptime
- API errors
- database errors
- worker failures
- queue backlog
- Drive failures
- authentication failures
- storage usage

## 12. Rollback

Application rollback:

- redeploy previous known-good version.

Database rollback:

- use forward migration where possible.
- restore backup only when necessary.

Never assume database rollback is automatically safe.

## 13. Production Checklist

Before release:

- domain configured
- HTTPS active
- secrets configured
- RLS enabled
- admin MFA configured where supported
- backups verified
- Drive connection tested
- Tally integration tested
- email tested
- certificate verification tested
- sitemap/robots checked
- private routes protected
- monitoring active

## 14. Disaster Recovery

Define:

- RPO
- RTO
- database recovery
- credential rotation
- Drive recovery
- critical media recovery

Do not rely on a single administrator's local machine as the only recovery source.
