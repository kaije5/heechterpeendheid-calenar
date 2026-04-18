# CI/CD Setup

## CI/CD Pipeline

The pipeline runs on every push to main and pull requests:

### Stages:
1. **Lint** - ESLint checks
2. **Test** - Jest unit tests with coverage
3. **Build** - Docker image build and push to GitHub Container Registry
4. **E2E** - Playwright end-to-end tests
5. **Deploy** - Deploy to Vercel

### Required GitHub Secrets

| Secret | How to get |
|--------|-----------|
| `VERCEL_TOKEN` | Vercel Dashboard > Settings > Tokens |
| `VERCEL_ORG_ID` | Vercel Project Settings > General > Organization ID |
| `VERCEL_PROJECT_ID` | Vercel Project Settings > General > Project ID |
| `SUPABASE_ACCESS_TOKEN` | Supabase Dashboard > Account > Access Tokens |
| `SUPABASE_PROJECT_ID` | From Supabase project URL |

### Docker Image

Built images are pushed to GitHub Container Registry:
- `ghcr.io/kaije5/heechterpeendheid-calenar:latest`
- `ghcr.io/kaije5/heechterpeendheid-calenar:<sha>`

## Database Migrations

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
3. Paste contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run**

After this, GitHub Actions will handle future migrations automatically.
