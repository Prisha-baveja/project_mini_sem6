/*
  # Fix quiz creation and permissions

  1. Changes
    - Updates quiz policies to ensure teachers can create quizzes
    - Adds proper validation for quiz data
    - Ensures proper relationships between tables
*/

-- Drop existing quiz policies to recreate them
DROP POLICY IF EXISTS "Teachers can create quizzes" ON quizzes;
DROP POLICY IF EXISTS "Teachers can update their own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Everyone can read quizzes" ON quizzes;

-- Create improved quiz policies
CREATE POLICY "quiz_create_policy"
  ON quizzes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "quiz_read_policy"
  ON quizzes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "quiz_update_policy"
  ON quizzes FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

  CREATE POLICY "Teachers can delete their own quizzes"
  ON quizzes FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

-- Add validation trigger for quiz data
CREATE OR REPLACE FUNCTION validate_quiz()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate title
  IF NEW.title IS NULL OR length(trim(NEW.title)) < 1 THEN
    RAISE EXCEPTION 'Quiz title is required';
  END IF;

  -- Validate time limit
  IF NEW.time_limit IS NULL OR NEW.time_limit < 1 OR NEW.time_limit > 180 THEN
    RAISE EXCEPTION 'Time limit must be between 1 and 180 minutes';
  END IF;

  -- Validate difficulty
  IF NEW.difficulty NOT IN ('easy', 'medium', 'hard') THEN
    RAISE EXCEPTION 'Invalid difficulty level';
  END IF;

  -- Validate questions array
  IF NEW.questions IS NULL OR jsonb_array_length(NEW.questions) < 1 THEN
    RAISE EXCEPTION 'Quiz must have at least one question';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for quiz validation
DROP TRIGGER IF EXISTS validate_quiz_trigger ON quizzes;
CREATE TRIGGER validate_quiz_trigger
  BEFORE INSERT OR UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION validate_quiz();