/*
  # Add trigger for automatic profile creation

  1. Changes
    - Creates a trigger to automatically create profiles when users sign up
    - Ensures profile data is properly synchronized with auth.users
    - Fixes the issue of missing profile data

  2. Security
    - Trigger runs with security definer permissions
    - Safely handles user metadata
*/

-- Create the function that will handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'username'),
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      (NEW.raw_user_meta_data->>'role'),
      'student'
    )
  );
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();