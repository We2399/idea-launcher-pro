-- Create tasks table for task management between employers and employees
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID NOT NULL,
  assigned_by UUID NOT NULL,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cash control table for expense management
CREATE TABLE public.cash_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  type TEXT NOT NULL CHECK (type IN ('request', 'expense', 'reimbursement')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT NOT NULL,
  receipt_url TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tasks
CREATE POLICY "Users can view tasks assigned to them" 
ON public.tasks 
FOR SELECT 
USING (auth.uid() = assigned_to);

CREATE POLICY "Users can view tasks they assigned" 
ON public.tasks 
FOR SELECT 
USING (auth.uid() = assigned_by);

CREATE POLICY "Managers can create tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (is_manager(auth.uid()) AND auth.uid() = assigned_by);

CREATE POLICY "Assigned users can update task status" 
ON public.tasks 
FOR UPDATE 
USING (auth.uid() = assigned_to);

CREATE POLICY "Task creators can update their tasks" 
ON public.tasks 
FOR UPDATE 
USING (auth.uid() = assigned_by);

CREATE POLICY "HR admins can manage all tasks" 
ON public.tasks 
FOR ALL 
USING (is_hr_admin(auth.uid()));

-- Create RLS policies for cash transactions
CREATE POLICY "Users can view their own transactions" 
ON public.cash_transactions 
FOR SELECT 
USING (auth.uid() = employee_id);

CREATE POLICY "Users can create their own requests" 
ON public.cash_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Users can update their pending transactions" 
ON public.cash_transactions 
FOR UPDATE 
USING (auth.uid() = employee_id AND status = 'pending');

CREATE POLICY "Managers can view team transactions" 
ON public.cash_transactions 
FOR SELECT 
USING (is_manager(auth.uid()) AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = cash_transactions.employee_id 
  AND profiles.manager_id = auth.uid()
));

CREATE POLICY "Managers can approve team transactions" 
ON public.cash_transactions 
FOR UPDATE 
USING (is_manager(auth.uid()) AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = cash_transactions.employee_id 
  AND profiles.manager_id = auth.uid()
));

CREATE POLICY "HR admins can manage all transactions" 
ON public.cash_transactions 
FOR ALL 
USING (is_hr_admin(auth.uid()));

-- Add updated_at triggers
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cash_transactions_updated_at
BEFORE UPDATE ON public.cash_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();