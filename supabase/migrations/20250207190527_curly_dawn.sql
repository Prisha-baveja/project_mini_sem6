/*
  # Add classes functionality

  1. New Tables
    - `classes`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamptz)

  2. Changes to existing tables
    - Add `class_id` to questions table
    - Update questions policies

  3. Security
    - Enable RLS on classes table
    - Add policies for teachers to manage their classes
    - Add policies for students to view classes
*/

-- Create classes table and questions table
CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES profiles NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add class_id to questions
ALTER TABLE questions 
ADD COLUMN class_id uuid REFERENCES classes;

ALTER TABLE questions ALTER COLUMN category SET DEFAULT 'General';

ALTER TABLE classes
ADD COLUMN join_code VARCHAR(8) UNIQUE;


-- Classes policies
CREATE POLICY "Teachers can create classes"
  ON classes FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'teacher'
  ));

CREATE POLICY "Teachers can update their own classes"
  ON classes FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can view their own classes"
  ON classes FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

-- Update questions policies
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
    AND
    EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = class_id
      AND classes.created_by = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_classes_created_by ON classes(created_by);
CREATE INDEX idx_questions_class_id ON questions(class_id);