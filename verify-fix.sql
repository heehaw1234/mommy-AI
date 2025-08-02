-- Test if the trigger and function are working properly
-- Run this to verify the fix

-- 1. Check that the function was updated successfully
SELECT 
    routine_name,
    'Function updated successfully' as status,
    routine_definition LIKE '%EXCEPTION%' as has_error_handling
FROM information_schema.routines 
WHERE routine_name = 'create_profile_for_user'
AND routine_schema = 'public';

-- 2. Verify the trigger is still active
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    'Trigger is active' as status
FROM information_schema.triggers 
WHERE trigger_name = 'create_profile_trigger';

-- 3. Check current Profiles table structure to ensure compatibility
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;
