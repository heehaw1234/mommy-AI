-- ===================================================================
-- GET FULL FUNCTION DEFINITIONS
-- Run this AFTER the first script to get complete function code
-- ===================================================================

-- 1. GET ALL FUNCTION DEFINITIONS (FULL CODE)
SELECT 
    routine_name as function_name,
    '--- FUNCTION: ' || routine_name || ' ---' as separator,
    routine_definition as full_function_code
FROM information_schema.routines 
WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
    AND routine_name NOT LIKE 'pg_%'
ORDER BY routine_name;

-- 2. SPECIFIC CHECK FOR COMMON TRIGGER FUNCTION NAMES
-- (These are typical names used in Supabase projects)
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
    AND routine_name IN (
        'handle_new_user',
        'create_profile_for_new_user', 
        'on_auth_user_created',
        'auto_create_profile',
        'new_user_profile'
    );

-- 3. CHECK FOR AUTH HOOKS (if they exist)
-- Note: This might fail if you don't have access to auth schema
-- but try it anyway
SELECT 
    'AUTH HOOKS' as type,
    id,
    hook_table_id,
    hook_name,
    created_at
FROM auth.hooks
WHERE hook_name LIKE '%user%' OR hook_name LIKE '%profile%';

-- 4. CHECK AUTH SCHEMA PERMISSIONS
SELECT 
    'AUTH SCHEMA ACCESS' as check_type,
    has_schema_privilege('auth', 'USAGE') as can_access_auth_schema;
