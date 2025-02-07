/*
  # Fix user creation trigger

  1. Changes
    - Simplifies the trigger function to basic functionality
    - Adds proper error handling
    - Ensures atomic operations
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create simplified trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Simple insert with basic validation
  IF NEW.raw_user_meta_data->>'username' IS NULL THEN
    RAISE EXCEPTION 'Username is required';
  END IF;

  IF NEW.raw_user_meta_data->>'role' NOT IN ('student', 'teacher') THEN
    RAISE EXCEPTION 'Role must be either student or teacher';
  END IF;

  INSERT INTO public.profiles (
    id,
    username,
    role
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'role'
  );

  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();