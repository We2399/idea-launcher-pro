-- Allow employees to create tasks assigned to themselves (for reporting verbally assigned work)
-- This supplements the existing management and admin policies

-- Drop the old restrictive policy for management
DROP POLICY IF EXISTS "Management can create tasks" ON public.tasks;

-- Create new policies:
-- 1. Management/HR/Admin can create tasks and assign to anyone
CREATE POLICY "Management and admin can create tasks"
ON public.tasks
FOR INSERT
WITH CHECK (
  (is_management(auth.uid()) OR is_administrator(auth.uid())) 
  AND auth.uid() = assigned_by
);

-- 2. Employees can create tasks assigned to themselves (for reporting completed verbal tasks)
CREATE POLICY "Employees can create self-assigned tasks"
ON public.tasks
FOR INSERT
WITH CHECK (
  auth.uid() = assigned_to 
  AND auth.uid() = assigned_by
);