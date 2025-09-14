-- Create a security definer function to apply approved profile changes
CREATE OR REPLACE FUNCTION public.apply_approved_profile_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  field_whitelist TEXT[] := ARRAY[
    'first_name', 'last_name', 'phone_number', 'home_address', 'date_of_birth',
    'marital_status', 'emergency_contact_name', 'emergency_contact_phone',
    'id_number', 'passport_number', 'visa_number', 'department', 'position'
  ];
BEGIN
  -- Only process when status changes to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Check if field is in whitelist
    IF NEW.field_name = ANY(field_whitelist) THEN
      -- Update the profile with the new value
      EXECUTE format(
        'UPDATE public.profiles SET %I = $1, updated_at = now() WHERE user_id = $2',
        NEW.field_name
      ) USING NEW.new_value, NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically apply approved profile changes
DROP TRIGGER IF EXISTS trigger_apply_approved_profile_change ON public.profile_change_requests;
CREATE TRIGGER trigger_apply_approved_profile_change
  AFTER UPDATE ON public.profile_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_approved_profile_change();

-- Update RLS policies on profiles table to allow HR admins to update all profiles
DROP POLICY IF EXISTS "HR admins can update all profiles" ON public.profiles;
CREATE POLICY "HR admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (is_hr_admin(auth.uid()));

-- Update the existing user update policy to only allow during initial setup
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id AND (profile_completed IS FALSE OR profile_completed IS NULL));