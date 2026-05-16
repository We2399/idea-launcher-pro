CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  emp_id TEXT;
  safe_first_name TEXT;
  safe_last_name TEXT;
  safe_department TEXT;
  safe_position TEXT;
  is_first_admin BOOLEAN;
  user_role app_role;
  is_employer BOOLEAN;
  org_name TEXT;
  org_type organization_type;
  industry_type_val TEXT;
  new_org_id UUID;
  invitation_code_input TEXT;
  invitation_record RECORD;
BEGIN
  SELECT COALESCE((setting_value->>'admin_created')::boolean, false) 
  INTO is_first_admin
  FROM system_settings WHERE setting_key = 'first_admin_created';
  
  is_employer := COALESCE((NEW.raw_user_meta_data ->> 'is_employer')::boolean, false);
  org_name := NULLIF(trim(NEW.raw_user_meta_data ->> 'organization_name'), '');
  org_type := COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'organization_type'), '')::organization_type, 'individual'::organization_type);
  industry_type_val := COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'industry_type'), ''), 'household');
  invitation_code_input := NULLIF(trim(NEW.raw_user_meta_data ->> 'invitation_code'), '');
  
  IF NOT is_first_admin THEN
    user_role := 'administrator'; emp_id := NULL;
  ELSIF is_employer THEN
    user_role := 'hr_admin'; emp_id := NULL;
  ELSE
    user_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'employee'::app_role);
    emp_id := 'EMP' || substr(replace(NEW.id::text, '-', ''), 1, 8);
  END IF;
  
  safe_first_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'first_name'), ''), 'Unknown');
  safe_last_name := COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'last_name'), ''), 'User');
  safe_department := COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'department'), ''), 'General');
  safe_position := COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'position'), ''), 'Employee');
  
  IF is_employer AND is_first_admin THEN
    INSERT INTO public.organizations (name, owner_id, organization_type, subscription_tier, max_employees, industry_type)
    VALUES (COALESCE(org_name, safe_first_name || ' ' || safe_last_name), NEW.id, org_type,
      CASE WHEN org_type = 'individual' THEN 'free'::subscription_tier ELSE 'mini'::subscription_tier END,
      CASE WHEN org_type = 'individual' THEN 1 ELSE 5 END, industry_type_val)
    RETURNING id INTO new_org_id;
    
    INSERT INTO public.profiles (user_id, first_name, last_name, email, is_employer, organization_id)
    VALUES (NEW.id, safe_first_name, safe_last_name, NEW.email, true, new_org_id);
    
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (new_org_id, NEW.id, 'owner');
    
  ELSIF invitation_code_input IS NOT NULL AND is_first_admin THEN
    SELECT * INTO invitation_record FROM public.employee_invitations
    WHERE lower(invitation_code) = lower(invitation_code_input)
      AND status = 'pending' AND expires_at > now();
    
    IF invitation_record.id IS NOT NULL THEN
      INSERT INTO public.profiles (user_id, employee_id, first_name, last_name, email, department, position, organization_id, is_employer)
      VALUES (NEW.id, emp_id, safe_first_name, safe_last_name, NEW.email, safe_department, safe_position, invitation_record.organization_id, false);
      
      INSERT INTO public.organization_members (organization_id, user_id, role, invited_by)
      VALUES (invitation_record.organization_id, NEW.id, 'member', invitation_record.created_by);
      
      -- Code remains 'pending' so it can be reused by other testers/employees until it expires.
      -- Only record the most recent acceptance for traceability.
      UPDATE public.employee_invitations 
      SET accepted_by = NEW.id, accepted_at = now()
      WHERE id = invitation_record.id;
    ELSE
      INSERT INTO public.profiles (user_id, employee_id, first_name, last_name, email, department, position)
      VALUES (NEW.id, emp_id, safe_first_name, safe_last_name, NEW.email, safe_department, safe_position);
    END IF;
  ELSE
    IF user_role = 'administrator' THEN
      INSERT INTO public.profiles (user_id, first_name, last_name, email)
      VALUES (NEW.id, safe_first_name, safe_last_name, NEW.email);
    ELSE
      INSERT INTO public.profiles (user_id, employee_id, first_name, last_name, email, department, position)
      VALUES (NEW.id, emp_id, safe_first_name, safe_last_name, NEW.email, safe_department, safe_position);
    END IF;
  END IF;
  
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, user_role);
  
  IF user_role = 'administrator' THEN
    UPDATE system_settings SET setting_value = '{"admin_created": true}'::jsonb, updated_by = NEW.id
    WHERE setting_key = 'first_admin_created';
  END IF;
  
  RETURN NEW;
END;
$function$;