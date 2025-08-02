-- Proper trigger function that won't fail
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
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
    COALESCE(NEW.phone, 'Unknown'),
    NOW(),
    NOW(),
    0,
    0
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE LOG 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (run only if you don't have one)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
