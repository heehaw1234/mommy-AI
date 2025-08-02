-- Quick check for triggers on auth.users table
SELECT 
    trigger_name,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND trigger_schema = 'auth';

-- Also check for any triggers on Profiles table
SELECT 
    trigger_name,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'Profiles' 
AND trigger_schema = 'public';
