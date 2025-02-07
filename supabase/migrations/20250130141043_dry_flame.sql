/*
  # Fix signup and profile creation process

  1. Changes
    - Drops and recreates the user creation trigger with better error handling
    - Ensures profile creation happens correctly
    - Adds proper validation for required fields
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved trigger function with validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  username_val text;
  role_val text;
BEGIN
  -- Get values from metadata with validation
  username_val := NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), '');
  role_val := NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), '');
  
  -- Validate required fields
  IF username_val IS NULL THEN
    RAISE EXCEPTION 'Username is required';
  END IF;
  
  IF role_val IS NULL THEN
    RAISE EXCEPTION 'Role is required';
  END IF;
  
  -- Validate role value
  IF role_val NOT IN ('student', 'teacher') THEN
    RAISE EXCEPTION 'Invalid role. Must be either student or teacher';
  END IF;

  -- Insert profile with validated data
  INSERT INTO public.profiles (
    id,
    username,
    role,
    current_session,
    created_at
  ) VALUES (
    NEW.id,
    username_val,
    role_val,
    NULL,
    now()
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Username already exists';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create profile: %', SQLERRM;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();