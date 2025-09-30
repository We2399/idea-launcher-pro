-- Update RLS policies to allow managers to manage public holidays and work schedules

-- Drop existing restrictive policies for public_holidays
DROP POLICY IF EXISTS "HR admins can manage public holidays" ON public.public_holidays;

-- Create new policies allowing managers to manage public holidays
CREATE POLICY "Managers and HR admins can manage public holidays" 
ON public.public_holidays 
FOR ALL 
USING (is_manager(auth.uid()));

-- Drop existing restrictive policies for employee_work_schedules
DROP POLICY IF EXISTS "HR admins can manage all work schedules" ON public.employee_work_schedules;

-- Create new policies allowing managers to manage work schedules
CREATE POLICY "Managers and HR admins can manage work schedules" 
ON public.employee_work_schedules 
FOR ALL 
USING (is_manager(auth.uid()));