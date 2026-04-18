# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose organization, name it "heechterpeendheid-calenar"
4. Set database password (save this!)
5. Choose region closest to you
6. Click "Create new project" (takes ~2 minutes)

## 2. Get API Credentials

1. In project dashboard, go to **Project Settings** (gear icon)
2. Click **API** in left sidebar
3. Copy these values:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. Configure Environment Variables

Create `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

## 4. Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Paste contents of `database/schema.sql`
4. Click **Run**

This creates:
- `members` table with 3 default members
- `events` table with foreign keys
- Row Level Security policies
- Auto-updated timestamps

## 5. (Optional) Apple OAuth Setup

For Sign in with Apple:

1. Go to **Authentication** → **Providers**
2. Find Apple, click **Enable**
3. Configure Apple Developer credentials:
   - Service ID
   - Key ID
   - Private Key
   - Team ID

Without this, the app works with mock data (no auth required).

## 6. Test Connection

Start dev server:

```bash
npm run dev
```

Open http://localhost:3000

Calendar should load with 3 mock members ready to add events.

## Troubleshooting

**"Supabase URL is required" error:**
- Check `.env.local` exists with correct values
- Restart dev server after creating env file

**"relation 'members' does not exist":**
- Run schema.sql in SQL Editor
- Verify tables created in **Database** → **Tables**

**Events not persisting:**
- Check browser console for errors
- Verify RLS policies enabled in **Authentication** → **Policies**

## Deploy to Production

1. Push code to GitHub
2. Connect repo to Vercel
3. Add same env variables in Vercel project settings
4. Deploy!
