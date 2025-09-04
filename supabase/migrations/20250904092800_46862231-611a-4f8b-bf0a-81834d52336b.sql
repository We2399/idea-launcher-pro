-- Add foreign key constraints to establish proper relationships

-- Add foreign key from leave_requests to profiles
ALTER TABLE public.leave_requests 
ADD CONSTRAINT fk_leave_requests_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key from leave_requests to leave_types
ALTER TABLE public.leave_requests 
ADD CONSTRAINT fk_leave_requests_leave_type_id 
FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id) ON DELETE RESTRICT;

-- Add foreign key from leave_balances to profiles
ALTER TABLE public.leave_balances 
ADD CONSTRAINT fk_leave_balances_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key from leave_balances to leave_types
ALTER TABLE public.leave_balances 
ADD CONSTRAINT fk_leave_balances_leave_type_id 
FOREIGN KEY (leave_type_id) REFERENCES public.leave_types(id) ON DELETE RESTRICT;

-- Add foreign key from profiles to profiles (manager relationship)
ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_manager_id 
FOREIGN KEY (manager_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- Add foreign key from approved_by in leave_requests to profiles
ALTER TABLE public.leave_requests 
ADD CONSTRAINT fk_leave_requests_approved_by 
FOREIGN KEY (approved_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- Create some sample leave types if they don't exist
INSERT INTO public.leave_types (name, description, max_days_per_year, requires_approval) 
VALUES 
  ('Annual Leave', 'Yearly vacation days', 25, true),
  ('Sick Leave', 'Medical leave', 10, false),
  ('Personal Leave', 'Personal time off', 5, true)
ON CONFLICT DO NOTHING;