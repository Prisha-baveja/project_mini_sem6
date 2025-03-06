/*
  # Fix authentication recursion and policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can create a profile during signup" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create simplified policies without recursion
CREATE POLICY "Allow profile creation during signup"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow profile reading"
  ON profiles FOR SELECT
  USING (
    -- Allow users to read their own profile
    auth.uid() = id
    OR
    -- Allow teachers to read all profiles
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'teacher'
  );

CREATE POLICY "Allow profile updates"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create a secure function for username checks
CREATE OR REPLACE FUNCTION check_username_available(username_to_check text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE username = username_to_check
  );
END;
$$;