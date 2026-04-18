-- Household Calendar Database Schema

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
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

-- RLS Policies (allow all for now - household app)
CREATE POLICY "Allow all on members" ON members
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all on events" ON events
  FOR ALL USING (true) WITH CHECK (true);

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

-- Insert sample members
INSERT INTO members (name, email, color) VALUES
  ('Member 1', 'member1@household.local', 'member-1'),
  ('Member 2', 'member2@household.local', 'member-2'),
  ('Member 3', 'member3@household.local', 'member-3')
ON CONFLICT (email) DO NOTHING;
