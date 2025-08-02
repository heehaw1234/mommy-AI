-- Get the full definition of the problematic function
SELECT 
    routine_name,
    routine_definition as full_function_code
FROM information_schema.routines 
WHERE routine_schema = 'public'
    AND routine_name = 'create_profile_for_user';

-- Also get the update function for reference
SELECT 
    routine_name,
    routine_definition as full_function_code
FROM information_schema.routines 
WHERE routine_schema = 'public'
    AND routine_name = 'update_updated_at_column';

-- Get details about the create_profile_trigger
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement,
    action_condition
FROM information_schema.triggers 
WHERE trigger_name = 'create_profile_trigger';
