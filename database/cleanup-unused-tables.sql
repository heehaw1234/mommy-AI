-- 🗑️ Cleanup Script for Unused Learning Tables
-- Run this in your Supabase SQL editor to remove unused tables

-- WARNING: This will permanently delete these tables and all their data
-- Make sure you have a backup if you want to restore them later

-- Drop unused learning and interaction tables
-- First drop the dependent view, then the tables
DROP VIEW IF EXISTS public.user_learning_analytics CASCADE;
DROP TABLE IF EXISTS public.user_interactions CASCADE;
DROP TABLE IF EXISTS public.learning_profiles CASCADE;

-- Note: user_learning_analytics was a view (not a table) that depended on user_interactions
-- We've now removed both the view and the underlying table

-- These tables/views are now safe to remove because:
-- 1. user_learning_analytics: A view that was built on user_interactions data
-- 2. user_interactions: Only used in taskAIService.ts (which is leftover from removed AI task system)
-- 3. learning_profiles: Not referenced anywhere in current codebase
-- 4. Your app now only uses: Profiles (for personality) and Tasks (for manual task management)

-- After running this, your database will only contain the tables you actually use:
-- ✅ Profiles (user personality settings)
-- ✅ Tasks (manual task management)
