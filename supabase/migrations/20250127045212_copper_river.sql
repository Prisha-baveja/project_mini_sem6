/*
  # Fix profile policies to prevent recursion

  1. Changes
    - Completely redesign profile policies to prevent recursion
    - Add materialized role view for efficient role checks
    - Simplify access patterns

  2. Security
    - Maintain RLS security
    - Prevent any possible recursion
    - Keep role-based access control
*/

-- First, create a materialized view for caching user roles
CREATE MATERIALIZED VIEW IF NOT EXISTS user_roles AS
SELECT id, role FROM profiles;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_id ON user_roles(id);

-- Function to refresh the view
CREATE OR REPLACE FUNCTION refresh_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_roles;
  RETURN NULL;
END;
$$;

-- Trigger to keep the view updated
CREATE TRIGGER refresh_user_roles_trigger
AFTER INSERT OR UPDATE OR DELETE ON profiles
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_user_roles();

-- Drop existing policies
DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
DROP POLICY IF EXISTS "Allow profile reading" ON profiles;
DROP POLICY IF EXISTS "Allow profile updates" ON profiles;

-- Create new, simplified policies
CREATE POLICY "profiles_insert_policy"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "profiles_select_policy"
  ON profiles FOR SELECT
  USING (
    -- Users can always read their own profile
    auth.uid() = id
    OR 
    -- Teachers can read all profiles (using materialized view)
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.id = auth.uid()
      AND user_roles.role = 'teacher'
    )
  );

CREATE POLICY "profiles_update_policy"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Refresh the view initially
REFRESH MATERIALIZED VIEW user_roles;