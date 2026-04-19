# CI/CD Setup

## CI/CD Pipeline

Complete pipeline runs on every push to main:

```
PR:     lint → test
MAIN:   lint → test → e2e → migrate → deploy
```

### Stages:
1. **Lint** - ESLint checks (PR + main)
2. **Test** - Jest unit tests with coverage (PR + main)
3. **E2E** - Playwright matrix (chromium, firefox, webkit, mobile-chrome) (main only)
4. **Migrate** - Supabase database migrations (main only)
5. **Deploy** - Vercel builds and deploys (main only)

### Required GitHub Secrets

| Secret | How to get |
|--------|-----------|
| `VERCEL_TOKEN` | Vercel Dashboard > Settings > Tokens |
| `VERCEL_ORG_ID` | Vercel Project Settings > General > Organization ID |
| `VERCEL_PROJECT_ID` | Vercel Project Settings > General > Project ID |
| `SUPABASE_ACCESS_TOKEN` | Supabase Dashboard > Account > Access Tokens |
| `SUPABASE_PROJECT_ID` | From Supabase project URL |

## Database Migrations

Migrations run automatically after E2E tests pass and before deployment.

### First-time setup:

Migrations automatically apply on push to main when files in `supabase/migrations/` change.

### Required GitHub Secrets

Set these in your GitHub repository (Settings > Secrets and variables > Actions):

| Secret | How to get |
|--------|-----------|
| `SUPABASE_ACCESS_TOKEN` | Supabase Dashboard > Account > Access Tokens > Generate New Token |
| `SUPABASE_PROJECT_ID` | `sgbzmsuvqqwvwejghppv` (from your Supabase URL) |

### How to set secrets:

1. Go to https://github.com/kaije5/heechterpeendheid-calenar/settings/secrets/actions
2. Click **New repository secret**
3. Add `SUPABASE_ACCESS_TOKEN`
4. Add `SUPABASE_PROJECT_ID` = `sgbzmsuvqqwvwejghppv`

### First-time migration

Since tables don't exist yet, manually run the migration:

1. Go to https://app.supabase.io/project/sgbzmsuvqqwvwejghppv
2. Open **SQL Editor**
3. Paste contents of `supabase/migrations/20260419000000_initial_schema.sql`
4. Click **Run**

After this, GitHub Actions will handle future migrations automatically.
