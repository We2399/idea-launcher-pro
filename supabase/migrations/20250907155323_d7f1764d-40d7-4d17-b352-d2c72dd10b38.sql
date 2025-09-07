-- Add profile change requests table for employee profile update approval workflow
CREATE TABLE public.profile_change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  field_name TEXT NOT NULL,
  current_value TEXT,
  new_value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for profile change requests
ALTER TABLE public.profile_change_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for profile change requests
CREATE POLICY "Users can view their own change requests" 
ON public.profile_change_requests 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = requested_by);

CREATE POLICY "Users can create their own change requests" 
ON public.profile_change_requests 
FOR INSERT 
WITH CHECK (auth.uid() = requested_by AND auth.uid() = user_id);

CREATE POLICY "Managers can approve profile changes" 
ON public.profile_change_requests 
FOR UPDATE 
USING (is_manager(auth.uid()) OR is_hr_admin(auth.uid()));

CREATE POLICY "HR admins can manage all profile change requests" 
ON public.profile_change_requests 
FOR ALL 
USING (is_hr_admin(auth.uid()));

-- Add cash balance tracking to profiles
ALTER TABLE public.profiles ADD COLUMN cash_balance DECIMAL(10,2) DEFAULT 0.00;

-- Update cash_transactions to support balance tracking
ALTER TABLE public.cash_transactions ADD COLUMN affects_balance BOOLEAN DEFAULT false;

-- Function to automatically populate leave balances from allocations
CREATE OR REPLACE FUNCTION public.populate_leave_balances()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    INSERT INTO public.leave_balances (
      user_id,
      leave_type_id,
      year,
      total_days,
      remaining_days,
      used_days
    )
    VALUES (
      NEW.user_id,
      NEW.leave_type_id,
      NEW.year,
      NEW.allocated_days,
      NEW.allocated_days,
      0
    )
    ON CONFLICT (user_id, leave_type_id, year) 
    DO UPDATE SET
      total_days = EXCLUDED.total_days,
      remaining_days = EXCLUDED.total_days - leave_balances.used_days,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to populate leave balances when allocations are approved
CREATE TRIGGER populate_leave_balances_trigger
AFTER UPDATE ON public.leave_allocations
FOR EACH ROW
EXECUTE FUNCTION public.populate_leave_balances();

-- Function to update leave balances when requests are approved
CREATE OR REPLACE FUNCTION public.update_leave_balance_on_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE public.leave_balances
    SET 
      used_days = used_days + NEW.days_requested,
      remaining_days = remaining_days - NEW.days_requested,
      updated_at = now()
    WHERE user_id = NEW.user_id 
      AND leave_type_id = NEW.leave_type_id 
      AND year = EXTRACT(year FROM NEW.created_at);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to update leave balances when requests are approved
CREATE TRIGGER update_leave_balance_on_request_trigger
AFTER UPDATE ON public.leave_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_leave_balance_on_request();

-- Add trigger for profile change requests updated_at
CREATE TRIGGER update_profile_change_requests_updated_at
BEFORE UPDATE ON public.profile_change_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();