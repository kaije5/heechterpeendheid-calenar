# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Heechterpeendheid Calenar is a neo-brutalist shared household calendar. Next.js 16 + TypeScript + Supabase with an MCP server for Claude integration.

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev                 # http://localhost:3000

# Production build
npm run build             # Output to dist/, static export

# Testing
npm run test              # Jest unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run test:e2e          # Playwright E2E tests
npm run test:e2e:ui       # Playwright UI mode

# Linting
npm run lint              # ESLint

# Database (manual migration workflow)
npm run migrate           # Shows SQL to run - copy to Supabase SQL Editor
```

## Architecture

### Data Layer: Hybrid Online/Offline

The app uses a **dual-mode data layer** in `src/lib/supabase.ts`:

1. **Production mode**: Connects to Supabase with RLS policies
2. **Development mode**: Falls back to in-memory mock data when env vars missing

```typescript
// Automatically detects Supabase configuration
if (!isSupabaseConfigured()) {
  return mockEvents.filter(...);  // In-memory fallback
}
```

**Key pattern**: Always check `isSupabaseConfigured()` before Supabase calls. This enables development without a live database.

### Database Schema (Supabase)

- **members**: Linked to `auth.users(id)` via foreign key. Auto-created on signup via trigger.
- **events**: Belongs to members. RLS policies enforce users can only modify their own events.

**Row Level Security policies** (see `supabase/migrations/`):
- Events: Users can only insert/update/delete their own events (`auth.uid() = member_id`)
- Members: Users can only update their own profile
- All users can view all events and members (shared calendar)

### MCP Server Architecture

The Model Context Protocol server (`src/mcp/server.ts`) runs as a separate process:

```
Claude Code ←→ MCP Server (stdio transport) ←→ Supabase API
                    ↓
               src/lib/supabase.ts (same code as web app)
```

**Build flow**: `npm run build` compiles the MCP server to `dist/mcp/server.js`.

**Configuration**: Add to `~/.claude/mcp-servers/heechterpeendheid-calenar.json`:
```json
{
  "mcpServers": {
    "calendar": {
      "command": "node",
      "args": ["/path/to/dist/mcp/server.js"],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "...",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": "..."
      }
    }
  }
}
```

### Offline Support

- **Service Worker**: Registers at `/sw.js` for PWA functionality
- **Sync Status**: `SyncStatusIndicator` component shows online/offline state
- **Optimistic UI**: Updates appear immediately, syncs when connection restored

### Auth Flow

1. Signup creates `auth.users` row
2. Database trigger `on_auth_user_created` auto-creates member profile
3. Color assigned cyclically: member-1 → member-2 → member-3
4. No email verification required (household use)

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | All data access - events, members, auth. Singleton client pattern. |
| `src/mcp/server.ts` | MCP server entry point. Exports `createMCPServer()`. |
| `src/types/index.ts` | Shared TypeScript interfaces |
| `supabase/migrations/` | SQL migrations - run manually in Supabase SQL Editor |
| `next.config.ts` | Static export config, CSP headers |

## Design System

Neo-brutalist style defined in `src/app/globals.css`:

- **Colors**: Paper white `#f5f3ef`, Ink black `#0a0a0a`, Red `#ff2d2d`, Blue `#0066ff`, Green `#00cc66`
- **Typography**: Space Mono (monospace), uppercase headings, tight tracking
- **Components**: 4px borders, hard shadows (8px offset), no border-radius

## Testing Patterns

### Unit Tests
- Components: `src/components/__tests__/*.test.tsx`
- Hooks: `src/hooks/__tests__/*.test.ts`
- Run: `npm run test`

### E2E Tests (Playwright)
- Located: `tests/e2e/`
- Config: `playwright.config.ts`
- Run: `npm run test:e2e`

### Test Utilities
- `jest.setup.ts` - Test environment setup
- Mock Service Worker for API mocking (if needed)

## Environment Variables

| Variable | Source | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Settings > API | Database connection |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Settings > API | Client auth key |

## Common Tasks

### Add a database migration

1. Create `supabase/migrations/002_description.sql`
2. Run `npm run migrate` to see what needs applying
3. Copy SQL output to Supabase SQL Editor
4. Execute manually

### Run single test file

```bash
npm run test -- src/components/__tests__/Calendar.test.tsx
```

### Build MCP server only

```bash
npm run build
# Output: dist/mcp/server.js
```

## Security Notes

- CSP headers configured in `next.config.ts`
- RLS policies enforced at database level
- No secrets in client bundle (only `NEXT_PUBLIC_` vars)
- Auth tokens managed by Supabase client

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):

```
PR:     lint → test → build
MAIN:   lint → test → build → e2e → deploy
```

Deployment: Static export to `dist/`, suitable for Vercel or any static host.
