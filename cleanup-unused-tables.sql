-- Cleanup script for unused database tables
-- These tables were identified as no longer being used in the application

-- Drop user_interactions table (only referenced in removed taskAIService.ts)
DROP TABLE IF EXISTS user_interactions;

-- Drop learning_profiles table (not referenced anywhere in the codebase)
DROP TABLE IF EXISTS learning_profiles;

-- Verify remaining tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
