-- ===================================================================
-- COMPREHENSIVE TRIGGER AND FUNCTION DETECTION SCRIPT
-- Run this in your Supabase SQL Editor to find the problematic trigger
-- ===================================================================

-- 1. FIND ALL TRIGGERS ON AUTH.USERS TABLE (Most likely culprit)
SELECT 
    'AUTH.USERS TRIGGERS' as section,
    trigger_name,
    action_timing || ' ' || string_agg(event_manipulation, ', ') as trigger_event,
    action_statement as function_called
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
    AND trigger_schema = 'auth'
GROUP BY trigger_name, action_timing, action_statement
ORDER BY trigger_name;

-- 2. FIND ALL TRIGGERS ON PUBLIC TABLES
SELECT 
    'PUBLIC TABLE TRIGGERS' as section,
    event_object_table as table_name,
    trigger_name,
    action_timing || ' ' || string_agg(event_manipulation, ', ') as trigger_event,
    action_statement as function_called
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
GROUP BY event_object_table, trigger_name, action_timing, action_statement
ORDER BY event_object_table, trigger_name;

-- 3. FIND ALL CUSTOM FUNCTIONS (Potential trigger functions)
SELECT 
    'CUSTOM FUNCTIONS' as section,
    routine_name as function_name,
    routine_type,
    CASE 
        WHEN length(routine_definition) > 200 
        THEN left(routine_definition, 200) || '...[TRUNCATED]'
        ELSE routine_definition 
    END as function_code_preview
FROM information_schema.routines 
WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
    AND routine_name NOT LIKE 'pg_%'
ORDER BY routine_name;

-- 4. LOOK FOR FUNCTIONS THAT MENTION 'PROFILES' OR 'USER'
SELECT 
    'PROFILE/USER RELATED FUNCTIONS' as section,
    routine_name as function_name,
    CASE 
        WHEN length(routine_definition) > 300 
        THEN left(routine_definition, 300) || '...[TRUNCATED]'
        ELSE routine_definition 
    END as function_code
FROM information_schema.routines 
WHERE routine_schema = 'public'
    AND (
        routine_definition ILIKE '%profiles%' 
        OR routine_definition ILIKE '%new_user%'
        OR routine_definition ILIKE '%auth.users%'
        OR routine_definition ILIKE '%handle%user%'
    )
ORDER BY routine_name;

-- 5. CHECK FOR AUTH HOOKS (Supabase-specific)
SELECT 
    'AUTH HOOKS CHECK' as section,
    'Run this to check for auth hooks:' as note,
    'SELECT * FROM auth.hooks;' as query_to_run;

-- 6. DETAILED TRIGGER-FUNCTION MAPPING
SELECT 
    'TRIGGER-FUNCTION MAPPING' as section,
    t.trigger_name,
    t.event_object_table,
    t.action_statement,
    CASE 
        WHEN t.action_statement LIKE '%EXECUTE FUNCTION%' 
        THEN regexp_replace(t.action_statement, '.*EXECUTE FUNCTION ([^(]+).*', '\1')
        ELSE 'Unknown function'
    END as extracted_function_name
FROM information_schema.triggers t
WHERE t.trigger_schema IN ('public', 'auth')
ORDER BY t.event_object_table, t.trigger_name;
