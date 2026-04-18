-- Migration: 001_initial_schema
-- Create members and events tables with auth integration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Members table - linked to auth.users
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL CHECK (color IN ('member-1', 'member-2', 'member-3')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_all_day BOOLEAN DEFAULT true,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for members
CREATE POLICY "Users can view all members" ON members
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own member profile" ON members
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own member profile" ON members
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- RLS Policies for events
CREATE POLICY "Users can view all events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own events" ON events
  FOR INSERT WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Users can update their own events" ON events
  FOR UPDATE USING (auth.uid() = member_id);

CREATE POLICY "Users can delete their own events" ON events
  FOR DELETE USING (auth.uid() = member_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create member on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_color TEXT;
  user_count INTEGER;
BEGIN
  -- Count existing members to assign color
  SELECT COUNT(*) INTO user_count FROM members;

  -- Assign color based on count (cycles through member-1, member-2, member-3)
  CASE (user_count % 3)
    WHEN 0 THEN assigned_color := 'member-1';
    WHEN 1 THEN assigned_color := 'member-2';
    ELSE assigned_color := 'member-3';
  END CASE;

  -- Insert new member
  INSERT INTO public.members (id, name, email, color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New Member'),
    NEW.email,
    assigned_color
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create member on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
