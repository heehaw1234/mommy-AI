-- Student Profiles table for dynamic motivation coaching
-- Run this in your Supabase SQL editor

-- Updated simple working version with all required columns
CREATE TABLE IF NOT EXISTS "StudentProfiles" (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    stress_level INTEGER DEFAULT 0,
    learning_style TEXT DEFAULT 'visual',
    learning_pattern JSONB DEFAULT '{}',
    motivation_level INTEGER DEFAULT 5,
    course_load INTEGER DEFAULT 4,
    exam_period BOOLEAN DEFAULT false,
    semester_week INTEGER DEFAULT 8,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "StudentProfiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_policy" ON "StudentProfiles" 
    USING (auth.uid() = user_id);

CREATE INDEX idx_student_user ON "StudentProfiles"(user_id);
