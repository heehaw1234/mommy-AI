-- TEMPORARILY DISABLE the problematic trigger
-- This will allow user signup to work while we fix the issue

-- Disable the trigger
ALTER TABLE auth.users DISABLE TRIGGER create_profile_trigger;

-- To re-enable later (after fixing):
-- ALTER TABLE auth.users ENABLE TRIGGER create_profile_trigger;

-- OR completely drop the trigger if you want manual profile creation:
-- DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
