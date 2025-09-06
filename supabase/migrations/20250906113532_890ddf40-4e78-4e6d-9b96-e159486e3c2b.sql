-- Update role hierarchy and approval workflows
-- Add delegation system and dual approval mechanism

-- First, let's add fields to support dual approval workflows
ALTER TABLE public.leave_requests 
ADD COLUMN senior_management_approved_by uuid,
ADD COLUMN senior_management_approved_at timestamp with time zone,
ADD COLUMN administrator_approved_by uuid,
ADD COLUMN administrator_approved_at timestamp with time zone,
ADD COLUMN delegation_active boolean DEFAULT false;

-- Add leave allocation table for tracking leave entitlements
CREATE TABLE public.leave_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  leave_type_id uuid NOT NULL,
  allocated_days integer NOT NULL DEFAULT 0,
  year integer NOT NULL,
  allocated_by uuid NOT NULL,
  senior_management_approved_by uuid,
  senior_management_approved_at timestamp with time zone,
  administrator_approved_by uuid,
  administrator_approved_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT leave_allocations_status_check CHECK (status IN ('pending', 'senior_approved', 'approved', 'rejected'))
);

-- Enable RLS on leave_allocations
ALTER TABLE public.leave_allocations ENABLE ROW LEVEL SECURITY;

-- Add system settings table for delegation management
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  updated_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for leave_allocations
CREATE POLICY "HR Admins can manage all allocations" 
ON public.leave_allocations 
FOR ALL 
USING (is_hr_admin(auth.uid()));

CREATE POLICY "Managers can view team allocations" 
ON public.leave_allocations 
FOR SELECT 
USING (is_manager(auth.uid()) AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = leave_allocations.user_id 
  AND profiles.manager_id = auth.uid()
));

CREATE POLICY "Managers can create allocations" 
ON public.leave_allocations 
FOR INSERT 
WITH CHECK (is_manager(auth.uid()) AND auth.uid() = allocated_by);

CREATE POLICY "Users can view their own allocations" 
ON public.leave_allocations 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policies for system_settings
CREATE POLICY "HR Admins can manage system settings" 
ON public.system_settings 
FOR ALL 
USING (is_hr_admin(auth.uid()));

CREATE POLICY "All authenticated users can view system settings" 
ON public.system_settings 
FOR SELECT 
USING (true);

-- Update leave_requests policies to support dual approval
DROP POLICY IF EXISTS "Managers can approve team requests" ON public.leave_requests;

CREATE POLICY "Managers can update team requests for senior approval" 
ON public.leave_requests 
FOR UPDATE 
USING (is_manager(auth.uid()) AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = leave_requests.user_id 
  AND profiles.manager_id = auth.uid()
));

-- Create functions for the new approval workflow
CREATE OR REPLACE FUNCTION public.is_administrator(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = $1 AND role = 'hr_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_senior_management(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = $1 AND role IN ('manager', 'hr_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.has_delegation_rights(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    (SELECT (setting_value->>'delegation_active')::boolean 
     FROM public.system_settings 
     WHERE setting_key = 'senior_management_delegation'), 
    false
  ) AND is_senior_management($1);
$$;

-- Insert default delegation setting
INSERT INTO public.system_settings (setting_key, setting_value, updated_by)
VALUES ('senior_management_delegation', '{"delegation_active": false}'::jsonb, 
        (SELECT user_id FROM public.user_roles WHERE role = 'hr_admin' LIMIT 1))
ON CONFLICT (setting_key) DO NOTHING;

-- Add triggers for updated_at
CREATE TRIGGER update_leave_allocations_updated_at
  BEFORE UPDATE ON public.leave_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();