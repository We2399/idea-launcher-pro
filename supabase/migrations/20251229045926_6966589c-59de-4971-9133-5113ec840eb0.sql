-- Add admin acknowledgment tracking for completed tasks
ALTER TABLE public.tasks 
ADD COLUMN admin_acknowledged_at timestamp with time zone DEFAULT NULL,
ADD COLUMN admin_acknowledged_by uuid DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.tasks.admin_acknowledged_at IS 'When admin acknowledged/noted the task completion';
COMMENT ON COLUMN public.tasks.admin_acknowledged_by IS 'Which admin acknowledged the task completion';