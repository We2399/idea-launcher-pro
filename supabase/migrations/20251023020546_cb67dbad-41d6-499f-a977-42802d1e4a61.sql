-- Fix all three user accounts

-- 1. Fix Wilson Roxon (wilson@panda-global.com) - Administrator
-- Update user role from employee to administrator
UPDATE public.user_roles
SET role = 'administrator'
WHERE user_id = '7a7fa94d-0e06-4a7c-bbe4-347794d9a9a1';

-- Remove employee_id from Wilson Roxon's profile
UPDATE public.profiles
SET 
  employee_id = NULL,
  updated_at = now()
WHERE user_id = '7a7fa94d-0e06-4a7c-bbe4-347794d9a9a1';

-- 2. Fix John Wong (yuengigi@yahoo.com) - Employee
-- Insert or update user role to employee
INSERT INTO public.user_roles (user_id, role)
VALUES ('38055959-48c7-45fe-9255-903754aeb26c', 'employee')
ON CONFLICT (user_id, role) DO NOTHING;

-- Update John Wong's employee profile position
UPDATE public.profiles
SET 
  position = 'HR Admin',
  department = 'HR',
  updated_at = now()
WHERE user_id = '38055959-48c7-45fe-9255-903754aeb26c';

-- 3. Fix John Wong (roxon1985@gmail.com) - HR Admin
-- Fix name capitalization, remove employee_id, update department and position
UPDATE public.profiles
SET 
  first_name = 'John',
  last_name = 'Wong',
  employee_id = NULL,
  department = 'HR',
  position = 'HR Admin',
  updated_at = now()
WHERE user_id = '1b8f8196-a41f-4982-b400-adc801a59fc2';