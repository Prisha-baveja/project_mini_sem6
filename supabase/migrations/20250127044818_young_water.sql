/*
  # Fix authentication policies

  1. Changes
    - Add policy to allow profile creation during signup
    - Fix RLS policies for profiles table
    - Add better error handling for duplicate users

  2. Security
    - Maintain RLS while allowing necessary operations
    - Ensure proper access control for profiles
*/

-- Drop existing policies for profiles
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create new policies for profiles
CREATE POLICY "Anyone can create a profile during signup"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to safely handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'role')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;