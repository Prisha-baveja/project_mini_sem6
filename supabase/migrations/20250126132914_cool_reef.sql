-- Create tables
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  username text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'teacher')),
  last_login timestamptz DEFAULT now(),
  current_session text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES profiles NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_answer text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES profiles NOT NULL,
  title text NOT NULL,
  description text,
  questions jsonb NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  time_limit integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL, -- no foreign key defined yet
  user_id uuid NOT NULL,
  score integer NOT NULL,
  answers jsonb NOT NULL,
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_attempts 
ADD CONSTRAINT quiz_attempts_quiz_id_fkey 
FOREIGN KEY (quiz_id) 
REFERENCES quizzes (id)
ON DELETE CASCADE;

ALTER TABLE quizzes
ADD COLUMN category TEXT;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE questions DISABLE ROW LEVEL SECURITY;


-- Profiles policies
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Questions policies
CREATE POLICY "Teachers can create questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'teacher'
  ));

CREATE POLICY "Teachers can update their own questions"
  ON questions FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());


CREATE POLICY "Everyone can read questions"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

  -- CREATE POLICY "Teachers can delete their own questions"
  -- ON questions FOR DELETE
  -- TO authenticated
  -- USING (
  --   created_by = auth.uid() 
  --   AND EXISTS (
  --     SELECT 1 FROM profiles
  --     WHERE profiles.id = auth.uid()
  --     AND profiles.role = 'teacher'
  --   )
  -- );

--   CREATE POLICY "Teachers can delete their own questions"
-- ON questions FOR DELETE
-- TO authenticated
-- USING (
--   created_by = auth.uid()
--   AND (SELECT role FROM profiles WHERE profiles.id = auth.uid()) = 'teacher'
-- );

CREATE POLICY "Teachers can delete their own questions"
  ON questions FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Quizzes policies
-- CREATE POLICY "Teachers can create quizzes"
--   ON quizzes FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE profiles.id = auth.uid()
--       AND profiles.role = 'teacher'
--     )
--   );

DROP POLICY IF EXISTS "Teachers can create questions" ON questions;
CREATE POLICY "Teachers can create questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'teacher'
    )
    AND (
      class_id IS NULL
      OR EXISTS (
        SELECT 1 FROM classes
        WHERE classes.id = class_id
          AND classes.created_by = auth.uid()
      )
    )
  );


CREATE POLICY "Teachers can update their own quizzes"
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

CREATE POLICY "Everyone can read quizzes"
  ON quizzes FOR SELECT
  TO authenticated
  USING (true);

-- NEW: DELETE policy for quizzes:
CREATE POLICY "Teachers can delete their own quizzes"
  ON quizzes FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());


-- CREATE POLICY "Teachers can delete their own questions"
--   ON questions FOR DELETE
--   TO authenticated
--   USING (
--     true
--   );

-- Quiz attempts policies
-- CREATE POLICY "Students can create quiz attempts"
--   ON quiz_attempts FOR INSERT
--   TO authenticated
--   WITH CHECK (EXISTS (
--     SELECT 1 FROM profiles
--     WHERE profiles.id = auth.uid()
--     AND profiles.role = 'student'
--   ));

-- CREATE POLICY "Users can read their own quiz attempts"
--   ON quiz_attempts FOR SELECT
--   TO authenticated
--   USING (user_id = auth.uid());

CREATE POLICY "Students can create quiz attempts (once per quiz)"
  ON quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'student'
    )
    AND NOT EXISTS (
      SELECT 1 FROM quiz_attempts
      WHERE quiz_attempts.user_id = auth.uid()
        AND quiz_attempts.quiz_id = NEW.quiz_id
    )
  );

ALTER TABLE quiz_attempts 
DROP CONSTRAINT quiz_attempts_quiz_id_fkey, 
ADD CONSTRAINT quiz_attempts_quiz_id_fkey 
FOREIGN KEY (quiz_id) 
REFERENCES quizzes(id) 
ON DELETE CASCADE;


-- Function to check and update session
CREATE OR REPLACE FUNCTION check_and_update_session(
  user_id uuid,
  new_session text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_session text;
BEGIN
  SELECT profiles.current_session INTO current_session
  FROM profiles
  WHERE profiles.id = user_id;

  IF current_session IS NOT NULL AND current_session != new_session THEN
    RETURN false;
  END IF;

  UPDATE profiles
  SET current_session = new_session,
      last_login = now()
  WHERE id = user_id;

  RETURN true;
END;
$$;