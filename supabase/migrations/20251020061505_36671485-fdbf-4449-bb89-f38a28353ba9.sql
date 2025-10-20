-- Phase 1: Drop all policies that depend on is_manager()

-- Drop policies on cash_transactions
DROP POLICY IF EXISTS "Managers can approve team transactions" ON cash_transactions;
DROP POLICY IF EXISTS "Managers can view team transactions" ON cash_transactions;

-- Drop policies on employee_work_schedules
DROP POLICY IF EXISTS "Managers and HR admins can manage work schedules" ON employee_work_schedules;

-- Drop policies on leave_allocations
DROP POLICY IF EXISTS "Managers can create allocations" ON leave_allocations;
DROP POLICY IF EXISTS "Managers can view team allocations" ON leave_allocations;

-- Drop policies on leave_requests
DROP POLICY IF EXISTS "Managers can update team requests for senior approval" ON leave_requests;
DROP POLICY IF EXISTS "Managers can view team requests" ON leave_requests;

-- Drop policies on profile_change_requests
DROP POLICY IF EXISTS "Managers can approve profile changes" ON profile_change_requests;
DROP POLICY IF EXISTS "Managers can view team change requests" ON profile_change_requests;

-- Drop policies on profile_documents
DROP POLICY IF EXISTS "Managers can view team documents" ON profile_documents;

-- Drop policies on profiles
DROP POLICY IF EXISTS "Managers can view their team profiles" ON profiles;

-- Drop policies on public_holidays
DROP POLICY IF EXISTS "Managers and HR admins can manage public holidays" ON public_holidays;

-- Drop policies on tasks
DROP POLICY IF EXISTS "Managers can create tasks" ON tasks;

-- Drop storage policy
DROP POLICY IF EXISTS "Managers can view team profile documents" ON storage.objects;

-- Phase 2: Update Role Enum
ALTER TYPE app_role RENAME TO app_role_old;
CREATE TYPE app_role AS ENUM ('employee', 'hr_admin', 'administrator');
ALTER TABLE user_roles ALTER COLUMN role TYPE app_role USING role::text::app_role;
DROP TYPE app_role_old;

-- Phase 3: Make profiles columns nullable for administrator/hr_admin
ALTER TABLE profiles ALTER COLUMN employee_id DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN department DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN position DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN first_name DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN last_name DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- Phase 4: Create new functions

-- Create is_management() function (replaces is_manager)
CREATE OR REPLACE FUNCTION public.is_management(user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = $1 AND role IN ('hr_admin', 'administrator')
  );
$$;

-- Update is_administrator() to check only 'administrator' role
CREATE OR REPLACE FUNCTION public.is_administrator(user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = $1 AND role = 'administrator'
  );
$$;

-- Update is_senior_management() to check both roles
CREATE OR REPLACE FUNCTION public.is_senior_management(user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = $1 AND role IN ('hr_admin', 'administrator')
  );
$$;

-- Phase 5: Drop is_manager() function
DROP FUNCTION IF EXISTS public.is_manager(uuid);

-- Phase 6: Create new RLS policies with is_management()

-- cash_transactions policies
CREATE POLICY "Management can approve team transactions"
ON cash_transactions FOR UPDATE TO authenticated
USING (is_management(auth.uid()) AND (EXISTS ( SELECT 1 FROM profiles WHERE profiles.user_id = cash_transactions.employee_id AND profiles.manager_id = auth.uid())));

CREATE POLICY "Management can view team transactions"
ON cash_transactions FOR SELECT TO authenticated
USING (is_management(auth.uid()) AND (EXISTS ( SELECT 1 FROM profiles WHERE profiles.user_id = cash_transactions.employee_id AND profiles.manager_id = auth.uid())));

-- employee_work_schedules policies
CREATE POLICY "Management can manage work schedules"
ON employee_work_schedules FOR ALL TO authenticated
USING (is_management(auth.uid()));

-- leave_allocations policies
CREATE POLICY "Management can create allocations"
ON leave_allocations FOR INSERT TO authenticated
WITH CHECK (is_management(auth.uid()) AND auth.uid() = allocated_by);

CREATE POLICY "Management can view team allocations"
ON leave_allocations FOR SELECT TO authenticated
USING (is_management(auth.uid()) AND (EXISTS ( SELECT 1 FROM profiles WHERE profiles.user_id = leave_allocations.user_id AND profiles.manager_id = auth.uid())));

-- leave_requests policies
CREATE POLICY "Management can update team requests"
ON leave_requests FOR UPDATE TO authenticated
USING (is_management(auth.uid()) AND (EXISTS ( SELECT 1 FROM profiles WHERE profiles.user_id = leave_requests.user_id AND profiles.manager_id = auth.uid())));

CREATE POLICY "Management can view team requests"
ON leave_requests FOR SELECT TO authenticated
USING (is_management(auth.uid()) AND (EXISTS ( SELECT 1 FROM profiles WHERE profiles.user_id = leave_requests.user_id AND profiles.manager_id = auth.uid())));

-- Add special policy to prevent hr_admin self-approval
CREATE POLICY "HR admins cannot approve own requests"
ON leave_requests FOR UPDATE TO authenticated
USING (NOT (auth.uid() = user_id AND is_hr_admin(auth.uid()) AND status IN ('pending', 'senior_approved')));

-- profile_change_requests policies
CREATE POLICY "Management can approve profile changes"
ON profile_change_requests FOR UPDATE TO authenticated
USING (is_management(auth.uid()));

CREATE POLICY "Management can view team change requests"
ON profile_change_requests FOR SELECT TO authenticated
USING (is_management(auth.uid()) AND (EXISTS ( SELECT 1 FROM profiles p WHERE p.user_id = profile_change_requests.user_id AND p.manager_id = auth.uid())));

-- profile_documents policies
CREATE POLICY "Management can view team documents"
ON profile_documents FOR SELECT TO authenticated
USING (is_management(auth.uid()) AND (EXISTS ( SELECT 1 FROM profiles WHERE profiles.user_id = profile_documents.user_id AND profiles.manager_id = auth.uid())));

-- profiles policies
CREATE POLICY "Management can view their team profiles"
ON profiles FOR SELECT TO authenticated
USING (is_management(auth.uid()) AND manager_id = auth.uid());

-- public_holidays policies
CREATE POLICY "Management can manage public holidays"
ON public_holidays FOR ALL TO authenticated
USING (is_management(auth.uid()));

-- tasks policies
CREATE POLICY "Management can create tasks"
ON tasks FOR INSERT TO authenticated
WITH CHECK (is_management(auth.uid()) AND auth.uid() = assigned_by);

-- storage policy for profile documents
CREATE POLICY "Management can view team profile documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'profile-documents' AND is_management(auth.uid()) AND (storage.foldername(name))[1] IN (
  SELECT user_id::text FROM profiles WHERE manager_id = auth.uid()
));

-- user_roles - add policy for administrator to manage roles
CREATE POLICY "Only administrator can update roles"
ON user_roles FOR UPDATE TO authenticated
USING (is_administrator(auth.uid()));

-- Phase 7: Create first_admin_created system setting
INSERT INTO system_settings (setting_key, setting_value, updated_by)
SELECT 
  'first_admin_created',
  '{"admin_created": false}'::jsonb,
  (SELECT id FROM auth.users LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM system_settings WHERE setting_key = 'first_admin_created'
);

-- Phase 8: Update handle_new_user() trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  emp_id TEXT;
  safe_first_name TEXT;
  safe_last_name TEXT;
  safe_department TEXT;
  safe_position TEXT;
  is_first_user BOOLEAN;
  user_role app_role;
BEGIN
  -- Check if first user (administrator)
  SELECT COALESCE((setting_value->>'admin_created')::boolean, false) 
  INTO is_first_user
  FROM system_settings WHERE setting_key = 'first_admin_created';
  
  -- Determine role
  IF NOT is_first_user THEN
    user_role := 'administrator';
    emp_id := NULL;
  ELSE
    user_role := COALESCE(
      (NEW.raw_user_meta_data ->> 'role')::app_role,
      'employee'::app_role
    );
    emp_id := COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data ->> 'employee_id'), ''), 
      'EMP' || substr(replace(NEW.id::text, '-', ''), 1, 8)
    );
  END IF;
  
  safe_first_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'first_name'), ''), 'Unknown');
  safe_last_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'last_name'), ''), 'User');
  safe_department := COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'department'), ''), 'General');
  safe_position := COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'position'), ''), 'Employee');
  
  BEGIN
    -- Insert profile based on role
    IF user_role = 'administrator' THEN
      INSERT INTO public.profiles (user_id, first_name, last_name, email)
      VALUES (NEW.id, safe_first_name, safe_last_name, NEW.email);
    ELSE
      INSERT INTO public.profiles (
        user_id, employee_id, first_name, last_name, email, department, position
      )
      VALUES (
        NEW.id, emp_id, safe_first_name, safe_last_name, NEW.email,
        safe_department, safe_position
      );
    END IF;
    
    -- Insert user role
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, user_role);
    
    -- Mark first admin as created
    IF user_role = 'administrator' THEN
      UPDATE system_settings 
      SET setting_value = '{"admin_created": true}'::jsonb, updated_by = NEW.id
      WHERE setting_key = 'first_admin_created';
    END IF;
    
    RAISE LOG 'Successfully created profile and role for user %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
  END;
  
  RETURN NEW;
END;
$$;

-- Phase 9: Data Migration - Convert JOHN WONG to hr_admin
UPDATE profiles 
SET 
  employee_id = NULL, department = NULL, position = NULL,
  phone_number = NULL, home_address = NULL, date_of_birth = NULL,
  marital_status = NULL, emergency_contact_name = NULL, 
  emergency_contact_phone = NULL, id_number = NULL, 
  passport_number = NULL, visa_number = NULL,
  cash_balance = 0, profile_completed = false, 
  initial_setup_completed_at = NULL, manager_id = NULL
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'roxon1985@gmail.com');

-- Delete JOHN WONG's leave balance records
DELETE FROM leave_balances 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'roxon1985@gmail.com');