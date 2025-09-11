-- Update the handle_new_user trigger to handle better defaults and validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Generate employee ID if not provided
  DECLARE
    emp_id TEXT;
  BEGIN
    emp_id := COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data ->> 'employee_id'), ''), 
      'EMP' || substr(NEW.id::text, 1, 8)
    );
    
    -- Insert profile with better default handling
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
      COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'first_name'), ''), 'Unknown'),
      COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'last_name'), ''), 'User'),
      NEW.email,
      COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'department'), ''), 'General'),
      COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'position'), ''), 'Employee')
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
    
    RETURN NEW;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
  END;
END;
$$;