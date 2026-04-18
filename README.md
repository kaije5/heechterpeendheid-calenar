# Heechterpeendheid Calenar

A neo-brutalist shared calendar for households. Built with Next.js, TypeScript, and Supabase.

## Features

- **Shared calendar view** for up to 3 household members
- **Color-coded events** by member
- **Neo-brutalist design** - paper textures, thick borders, bold typography
- **Mobile-first** - works perfectly on iPhones
- **PWA support** - add to home screen
- **MCP integration** - Claude Code can query and modify calendar
- **Apple OAuth** - sign in with Apple ID

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth with Apple OAuth
- **MCP:** Model Context Protocol SDK

## Quick Start

### 1. Clone and Install

```bash
cd heechterpeendheid-calenar
npm install
```

### 2. Set up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Get your project URL and anon key from Settings > API
3. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Fill in your Supabase credentials

### 3. Run Database Schema

In Supabase SQL Editor, run the contents of `database/schema.sql`

This creates:
- `members` table (3 default members)
- `events` table with foreign key
- Row Level Security policies

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## MCP Server Setup

To use Claude Code with your calendar, add this MCP server to your Claude Code configuration:

Create `~/.claude/mcp-servers/household-calendar.json`:

```json
{
  "mcpServers": {
    "heechterpeendheid-calenar": {
      "command": "node",
      "args": ["/path/to/heechterpeendheid-calenar/dist/mcp/server.js"],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "your-supabase-url",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key"
      }
    }
  }
}
```

Build the MCP server first:

```bash
npm run build
```

### MCP Tools Available

- `list_events` - Get events for a date range
- `create_event` - Add new event
- `update_event` - Modify existing event
- `delete_event` - Remove event
- `get_members` - List household members
- `get_member_schedule` - Get events for specific member
- `find_free_slots` - Find dates when everyone is free

### MCP Resources

- `calendar://today` - Today's events
- `calendar://week` - This week's events
- `calendar://members` - Household members list

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables from `.env.local`
4. Deploy

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

## Design System

### Colors

- **Paper White:** `#f5f3ef` - Background
- **Paper Cream:** `#faf8f3` - Card backgrounds
- **Ink Black:** `#0a0a0a` - Text and borders
- **Primary Red:** `#ff2d2d` - Member 1
- **Primary Blue:** `#0066ff` - Member 2
- **Member Green:** `#00cc66` - Member 3
- **Primary Yellow:** `#ffd700` - Accent/highlight

### Typography

- **Font:** Space Mono (monospace)
- **Headings:** All caps, tight tracking, heavy weight
- **Body:** Regular weight, generous line height

### Components

- **Buttons:** Thick borders (4px), hard shadow, uppercase text
- **Cards:** Thick borders, hard shadow (8px offset)
- **Calendar Grid:** 2px gaps between cells, heavy outer border

## Project Structure

```
heechterpeendheid-calenar/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── globals.css   # Neo-brutalist styles
│   │   ├── layout.tsx    # Root layout with fonts
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   │   ├── Calendar.tsx  # Main calendar component
│   │   └── EventModal.tsx # Event create/edit modal
│   ├── lib/              # Utilities
│   │   └── supabase.ts   # Supabase client + CRUD
│   ├── mcp/              # MCP server
│   │   └── server.ts     # MCP server implementation
│   └── types/            # TypeScript types
│       └── index.ts
├── database/
│   └── schema.sql        # Database schema
├── public/
│   └── manifest.json     # PWA manifest
└── .env.example          # Environment template
```

## Next Steps

- [ ] Add Apple OAuth provider in Supabase
- [ ] Add iOS push notifications
- [ ] Add recurring events
- [ ] Add ICS import/export
- [ ] Add activity feed

## License

MIT
