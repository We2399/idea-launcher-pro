-- Create user profiles table with proper structure
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  manager_id UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('employee', 'manager', 'hr_admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create leave types table
CREATE TABLE public.leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  max_days_per_year INTEGER NOT NULL DEFAULT 0,
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leave balances table
CREATE TABLE public.leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id) ON DELETE CASCADE,
  total_days INTEGER NOT NULL DEFAULT 0,
  used_days INTEGER NOT NULL DEFAULT 0,
  remaining_days INTEGER NOT NULL DEFAULT 0,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, leave_type_id, year)
);

-- Create leave requests table
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested INTEGER NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit logs table for security tracking
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.user_roles WHERE user_roles.user_id = $1 LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_manager(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = $1 AND role IN ('manager', 'hr_admin')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_hr_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = $1 AND role = 'hr_admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "HR admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_hr_admin(auth.uid()));

CREATE POLICY "HR admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.is_hr_admin(auth.uid()));

CREATE POLICY "Managers can view their team profiles" ON public.profiles
  FOR SELECT USING (
    public.is_manager(auth.uid()) AND 
    manager_id = auth.uid()
  );

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "HR admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.is_hr_admin(auth.uid()));

-- RLS Policies for leave_types
CREATE POLICY "All authenticated users can view leave types" ON public.leave_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "HR admins can manage leave types" ON public.leave_types
  FOR ALL USING (public.is_hr_admin(auth.uid()));

-- RLS Policies for leave_balances
CREATE POLICY "Users can view their own balances" ON public.leave_balances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "HR admins can view all balances" ON public.leave_balances
  FOR SELECT USING (public.is_hr_admin(auth.uid()));

CREATE POLICY "HR admins can manage balances" ON public.leave_balances
  FOR ALL USING (public.is_hr_admin(auth.uid()));

-- RLS Policies for leave_requests
CREATE POLICY "Users can view their own requests" ON public.leave_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own requests" ON public.leave_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their pending requests" ON public.leave_requests
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    status = 'pending'
  );

CREATE POLICY "Managers can view team requests" ON public.leave_requests
  FOR SELECT USING (
    public.is_manager(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = leave_requests.user_id 
      AND profiles.manager_id = auth.uid()
    )
  );

CREATE POLICY "Managers can approve team requests" ON public.leave_requests
  FOR UPDATE USING (
    public.is_manager(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = leave_requests.user_id 
      AND profiles.manager_id = auth.uid()
    )
  );

CREATE POLICY "HR admins can manage all requests" ON public.leave_requests
  FOR ALL USING (public.is_hr_admin(auth.uid()));

-- RLS Policies for audit_logs
CREATE POLICY "HR admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_hr_admin(auth.uid()));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at
  BEFORE UPDATE ON public.leave_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, employee_id, first_name, last_name, email, department, position)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'employee_id', 'EMP' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'department', 'General'),
    COALESCE(NEW.raw_user_meta_data ->> 'position', 'Employee')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default leave types
INSERT INTO public.leave_types (name, description, max_days_per_year, requires_approval) VALUES
  ('Annual Leave', 'Paid vacation days', 25, true),
  ('Sick Leave', 'Medical leave for illness', 10, false),
  ('Personal Leave', 'Personal time off', 5, true),
  ('Maternity Leave', 'Maternity leave', 90, true),
  ('Paternity Leave', 'Paternity leave', 14, true),
  ('Emergency Leave', 'Emergency situations', 3, false);