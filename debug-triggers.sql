-- Query to find all triggers in your Supabase database
-- Run this in your Supabase SQL Editor

-- 1. Find all triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'public' OR trigger_schema = 'auth'
ORDER BY event_object_table, trigger_name;

-- 2. Find all functions that might be trigger functions
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 3. Look for auth-related triggers specifically
SELECT 
    t.trigger_name,
    t.event_object_table,
    t.action_statement,
    p.prosrc as function_definition
FROM information_schema.triggers t
LEFT JOIN pg_proc p ON p.proname = REPLACE(REPLACE(t.action_statement, 'EXECUTE FUNCTION ', ''), '()', '')
WHERE t.trigger_schema IN ('public', 'auth')
ORDER BY t.event_object_table;

-- 4. Check for any functions that reference 'Profiles' table
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_definition ILIKE '%profiles%'
ORDER BY routine_name;
