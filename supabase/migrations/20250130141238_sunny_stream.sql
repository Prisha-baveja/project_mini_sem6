/*
  # Fix signup and profile creation

  1. Changes
    - Drops and recreates profiles table with proper constraints
    - Adds better error handling in trigger function
    - Ensures atomic operations
    - Adds proper validation
*/

-- First, drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate profiles table with proper constraints
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text NOT NULL,
  role text NOT NULL,
  current_session text,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz DEFAULT now(),
  CONSTRAINT username_length CHECK (char_length(username) >= 3),
  CONSTRAINT valid_role CHECK (role IN ('student', 'teacher')),
  CONSTRAINT unique_username UNIQUE (username)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "profiles_insert_policy"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "profiles_select_policy"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "profiles_update_policy"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create improved trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  username_val text;
  role_val text;
BEGIN
  -- Extract and validate username
  username_val := trim(NEW.raw_user_meta_data->>'username');
  IF username_val IS NULL OR length(username_val) < 3 THEN
    RAISE EXCEPTION 'Username must be at least 3 characters long';
  END IF;

  -- Extract and validate role
  role_val := lower(trim(NEW.raw_user_meta_data->>'role'));
  IF role_val IS NULL OR role_val NOT IN ('student', 'teacher') THEN
    RAISE EXCEPTION 'Role must be either student or teacher';
  END IF;

  -- Insert new profile
  BEGIN
    INSERT INTO public.profiles (id, username, role)
    VALUES (NEW.id, username_val, role_val);
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'Username % is already taken', username_val;
    WHEN check_violation THEN
      RAISE EXCEPTION 'Invalid data: %', SQLERRM;
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Profile creation failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();