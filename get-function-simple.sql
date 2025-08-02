-- Simple query to get the problematic function code
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'create_profile_for_user' 
AND routine_schema = 'public';

-- Alternative way to get function definition
SELECT pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_profile_for_user'
AND n.nspname = 'public';

-- Check if the function exists at all
SELECT 
    routine_name,
    routine_type,
    'Function exists' as status
FROM information_schema.routines 
WHERE routine_name = 'create_profile_for_user';
