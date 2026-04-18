# CI/CD Setup

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
