-- Create employee work schedules table for rest days
CREATE TABLE public.employee_work_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  monday BOOLEAN NOT NULL DEFAULT true,
  tuesday BOOLEAN NOT NULL DEFAULT true,
  wednesday BOOLEAN NOT NULL DEFAULT true,
  thursday BOOLEAN NOT NULL DEFAULT true,
  friday BOOLEAN NOT NULL DEFAULT true,
  saturday BOOLEAN NOT NULL DEFAULT false,
  sunday BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.employee_work_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies for work schedules
CREATE POLICY "HR admins can manage all work schedules" 
ON public.employee_work_schedules 
FOR ALL 
USING (is_hr_admin(auth.uid()));

CREATE POLICY "Users can view their own work schedule" 
ON public.employee_work_schedules 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create public holidays table
CREATE TABLE public.public_holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'US',
  year INTEGER NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.public_holidays ENABLE ROW LEVEL SECURITY;

-- Create policies for public holidays
CREATE POLICY "All authenticated users can view public holidays" 
ON public.public_holidays 
FOR SELECT 
USING (true);

CREATE POLICY "HR admins can manage public holidays" 
ON public.public_holidays 
FOR ALL 
USING (is_hr_admin(auth.uid()));

-- Add trigger for updated_at columns
CREATE TRIGGER update_employee_work_schedules_updated_at
BEFORE UPDATE ON public.employee_work_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_public_holidays_updated_at
BEFORE UPDATE ON public.public_holidays
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();