-- Add RLS policy to allow employees to delete their own pending leave requests
CREATE POLICY "Users can delete their pending leave requests" 
ON public.leave_requests 
FOR DELETE 
USING (auth.uid() = user_id AND status = 'pending');