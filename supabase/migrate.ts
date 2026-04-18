#!/usr/bin/env tsx
/**
 * Supabase Migration Runner
 *
 * Run with: npx tsx supabase/migrate.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  console.log('Supabase Migration Runner\n');

  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration(s)\n`);

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf-8');
    console.log(`${file}:`);
    console.log(sql.substring(0, 200) + '...\n');
  }

  console.log('\nTo apply migrations, run this SQL in Supabase SQL Editor:');
  console.log('1. Go to https://app.supabase.com');
  console.log('2. Select your project');
  console.log('3. Go to SQL Editor → New Query');
  console.log('4. Paste the SQL from: supabase/migrations/001_initial_schema.sql');
  console.log('5. Click Run\n');
}

runMigrations().catch(console.error);
