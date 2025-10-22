-- Fix profile data mismatches

-- Update roxon1985@gmail.com to correct name (Wilson Roxon, HR Admin)
UPDATE public.profiles
SET 
  first_name = 'Wilson',
  last_name = 'Roxon',
  department = 'Operations',
  position = 'HR Manager',
  employee_id = 'EMP-HR-001',
  updated_at = now()
WHERE user_id = '1b8f8196-a41f-4982-b400-adc801a59fc2';

-- Create missing profile for yuengigi@yahoo.com (John Wong, Employee)
INSERT INTO public.profiles (
  user_id,
  employee_id,
  first_name,
  last_name,
  email,
  department,
  position,
  profile_completed
)
VALUES (
  '38055959-48c7-45fe-9255-903754aeb26c',
  'EMP-102',
  'John',
  'Wong',
  'yuengigi@yahoo.com',
  'General',
  'Employee',
  false
)
ON CONFLICT (user_id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  employee_id = EXCLUDED.employee_id;