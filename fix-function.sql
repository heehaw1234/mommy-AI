-- CREATE OR REPLACE the problematic function with a working version
CREATE OR REPLACE FUNCTION public.create_profile_for_user()
RETURNS trigger AS $$
BEGIN
  -- Create a profile for the new user with safe defaults
  INSERT INTO public.Profiles (
    id,
    number,
    created_at,
    updated_at,
    mommy_lvl,
    ai_personality
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, 'Unknown'), -- Use phone if available, otherwise 'Unknown'
    NOW(),
    NOW(),
    0, -- Default mommy level
    0  -- Default AI personality
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW; -- Still allow user creation to succeed
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
