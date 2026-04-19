-- Migration: add_username_column
-- Add username column to members table and update auth function

-- Add username column to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS username TEXT UNIQUE NOT NULL DEFAULT '';

-- Update existing rows to have username from email (before @)
UPDATE members SET username = split_part(email, '@', 1) WHERE username = '';

-- Remove the default now that it's populated
ALTER TABLE members ALTER COLUMN username DROP DEFAULT;

-- Function to auto-create member on auth signup (updated for username)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_color TEXT;
  user_count INTEGER;
  user_name TEXT;
BEGIN
  -- Count existing members to assign color
  SELECT COUNT(*) INTO user_count FROM members;

  -- Assign color based on count (cycles through member-1, member-2, member-3)
  CASE (user_count % 3)
    WHEN 0 THEN assigned_color := 'member-1';
    WHEN 1 THEN assigned_color := 'member-2';
    ELSE assigned_color := 'member-3';
  END CASE;

  -- Extract username from email (before @) if available
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Insert new member with both username and email
  INSERT INTO members (id, username, name, email, color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    user_name,
    NEW.email,
    assigned_color
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
