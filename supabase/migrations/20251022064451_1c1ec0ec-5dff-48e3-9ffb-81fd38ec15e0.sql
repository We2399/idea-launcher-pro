-- Phase 1.1: Core Security Functions and Account Updates

-- 1. Create is_senior_position function to detect Manager/HR positions
CREATE OR REPLACE FUNCTION public.is_senior_position(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = $1 
    AND (position ILIKE '%Manager%' OR position ILIKE '%HR%')
  );
$$;

-- 2. Update accounts: wilson to administrator, roxon to HR Manager
DO $$
DECLARE
  wilson_user_id uuid;
  roxon_user_id uuid;
BEGIN
  -- Get wilson's user_id
  SELECT id INTO wilson_user_id FROM auth.users WHERE email = 'wilson@pandaglobal.com';
  
  -- Get roxon's user_id  
  SELECT id INTO roxon_user_id FROM auth.users WHERE email = 'roxon1985@gmail.com';

  -- Update wilson to administrator role
  IF wilson_user_id IS NOT NULL THEN
    UPDATE public.user_roles 
    SET role = 'administrator' 
    WHERE user_id = wilson_user_id;
    
    -- Ensure no employee_id for control account
    UPDATE public.profiles 
    SET employee_id = NULL 
    WHERE user_id = wilson_user_id;
  END IF;

  -- Update roxon's position to HR Manager and ensure no employee_id
  IF roxon_user_id IS NOT NULL THEN
    UPDATE public.profiles 
    SET position = 'HR Manager', 
        employee_id = NULL 
    WHERE user_id = roxon_user_id;
    
    -- Ensure hr_admin role
    UPDATE public.user_roles 
    SET role = 'hr_admin' 
    WHERE user_id = roxon_user_id;
  END IF;
END $$;

-- 3. Update profiles RLS policy to lock position field after initial setup
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profile excluding position" ON public.profiles;

-- Recreate policy for initial setup (allows all fields)
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (
  (auth.uid() = user_id) AND (
    (profile_completed IS FALSE) OR 
    (profile_completed IS NULL) OR 
    (initial_setup_completed_at IS NULL)
  )
)
WITH CHECK (
  auth.uid() = user_id
);

-- New policy: Users can update their completed profile (EXCLUDING position field)
CREATE POLICY "Users can update profile excluding position" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() = user_id AND 
  profile_completed IS TRUE
)
WITH CHECK (
  auth.uid() = user_id AND
  -- Position cannot be changed by user - must match existing value
  (position IS NOT DISTINCT FROM (SELECT position FROM profiles WHERE user_id = auth.uid()))
);