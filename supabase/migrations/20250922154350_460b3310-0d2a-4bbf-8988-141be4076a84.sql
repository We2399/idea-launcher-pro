-- Fix data synchronization between auth.users and profiles
-- This migration will sync names and improve the trigger function

-- First, create a function to sync profile data from auth.users
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  auth_user_data json;
BEGIN
  -- Get the auth user data (this function runs with elevated privileges)
  SELECT 
    json_build_object(
      'first_name', COALESCE(NULLIF(trim(raw_user_meta_data ->> 'first_name'), ''), 'Unknown'),
      'last_name', COALESCE(NULLIF(trim(raw_user_meta_data ->> 'last_name'), ''), 'User'),
      'email', email
    )
  INTO auth_user_data
  FROM auth.users 
  WHERE id = target_user_id;

  -- Update the profile with auth data if it exists
  IF auth_user_data IS NOT NULL THEN
    UPDATE public.profiles 
    SET 
      first_name = auth_user_data ->> 'first_name',
      last_name = auth_user_data ->> 'last_name',
      email = auth_user_data ->> 'email',
      updated_at = now()
    WHERE user_id = target_user_id;
  END IF;
END;
$$;

-- Improve the handle_new_user() trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  emp_id TEXT;
  safe_first_name TEXT;
  safe_last_name TEXT;
  safe_department TEXT;
  safe_position TEXT;
BEGIN
  -- Generate employee ID if not provided
  emp_id := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data ->> 'employee_id'), ''), 
    'EMP' || substr(replace(NEW.id::text, '-', ''), 1, 8)
  );
  
  -- Safely extract and clean metadata with proper fallbacks
  safe_first_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'first_name'), ''), 'Unknown');
  safe_last_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'last_name'), ''), 'User');
  safe_department := COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'department'), ''), 'General');
  safe_position := COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'position'), ''), 'Employee');
  
  BEGIN
    -- Insert profile with cleaned data from auth.users
    INSERT INTO public.profiles (
      user_id, 
      employee_id, 
      first_name, 
      last_name, 
      email, 
      department, 
      position
    )
    VALUES (
      NEW.id,
      emp_id,
      safe_first_name,
      safe_last_name,
      NEW.email,
      safe_department,
      safe_position
    );
    
    -- Insert user role with validation
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      NEW.id, 
      CASE 
        WHEN NEW.raw_user_meta_data ->> 'role' IN ('employee', 'manager', 'hr_admin') 
        THEN (NEW.raw_user_meta_data ->> 'role')::app_role
        ELSE 'employee'::app_role
      END
    );
    
    RAISE LOG 'Successfully created profile and role for user %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the specific error but don't prevent user creation
    RAISE WARNING 'Error in handle_new_user for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    -- Still return NEW to allow user creation to succeed
  END;
  
  RETURN NEW;
END;
$$;

-- Create a function to sync all existing profiles with auth data
CREATE OR REPLACE FUNCTION public.sync_all_profiles()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  profile_record RECORD;
  sync_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  -- Loop through all profiles and sync with auth data
  FOR profile_record IN 
    SELECT user_id, first_name, last_name 
    FROM public.profiles 
  LOOP
    BEGIN
      -- Sync this profile
      PERFORM public.sync_profile_from_auth(profile_record.user_id);
      sync_count := sync_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE WARNING 'Failed to sync profile for user %: %', profile_record.user_id, SQLERRM;
    END;
  END LOOP;
  
  RETURN format('Sync completed. Successfully synced: %s profiles. Errors: %s', sync_count, error_count);
END;
$$;

-- Run the one-time sync to fix existing data
SELECT public.sync_all_profiles();