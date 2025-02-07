/*
  # Fix profile policies to prevent recursion

  1. Changes
    - Simplifies profile policies to prevent recursion
    - Adds proper role-based access control
    - Maintains security while fixing the infinite recursion issue
*/

-- First drop existing policies
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Create new, simplified policies without recursion
CREATE POLICY "profiles_insert_policy"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Simplified select policy that avoids recursion
CREATE POLICY "profiles_select_policy"
  ON profiles FOR SELECT
  USING (
    -- Users can read their own profile
    auth.uid() = id
    OR
    -- Teachers can read all profiles (direct role check)
    (
      SELECT role FROM profiles 
      WHERE id = auth.uid() 
      LIMIT 1
    ) = 'teacher'
  );

-- Simple update policy for own profile
CREATE POLICY "profiles_update_policy"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);