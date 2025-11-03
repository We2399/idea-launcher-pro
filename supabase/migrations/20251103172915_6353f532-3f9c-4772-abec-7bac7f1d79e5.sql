-- Phase 1: Payroll Management System - Database Schema

-- 1.1 Extend profiles table with salary fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS base_monthly_salary NUMERIC(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS salary_currency TEXT DEFAULT 'USD';

-- 1.2 Create employee_recurring_allowances table
CREATE TABLE IF NOT EXISTS employee_recurring_allowances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  allowance_type TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3 Create payroll_records table
CREATE TABLE IF NOT EXISTS payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2000),
  
  base_salary NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_bonuses NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_allowances NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_others NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  gross_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  
  total_deductions NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  net_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  
  currency TEXT NOT NULL DEFAULT 'USD',
  
  status TEXT NOT NULL DEFAULT 'draft',
  
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  submitted_for_approval_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  sent_to_employee_at TIMESTAMPTZ,
  
  confirmed_by_employee BOOLEAN DEFAULT false,
  employee_confirmed_at TIMESTAMPTZ,
  employee_notes TEXT,
  
  disputed_by_employee BOOLEAN DEFAULT false,
  dispute_reason TEXT,
  disputed_at TIMESTAMPTZ,
  dispute_resolved_at TIMESTAMPTZ,
  dispute_resolution_notes TEXT,
  
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, month, year)
);

-- 1.4 Create payroll_line_items table
CREATE TABLE IF NOT EXISTS payroll_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_record_id UUID NOT NULL REFERENCES payroll_records(id) ON DELETE CASCADE,
  
  item_type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.5 Create payroll_notifications table
CREATE TABLE IF NOT EXISTS payroll_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_record_id UUID NOT NULL REFERENCES payroll_records(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  sent_to UUID NOT NULL,
  message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- 1.6 Enable RLS on all tables
ALTER TABLE employee_recurring_allowances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_notifications ENABLE ROW LEVEL SECURITY;

-- 1.7 RLS Policies for employee_recurring_allowances
CREATE POLICY "Employees can view their own allowances" ON employee_recurring_allowances
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "HR admins can manage all allowances" ON employee_recurring_allowances
FOR ALL USING (is_hr_admin(auth.uid()));

CREATE POLICY "Administrators can manage all allowances" ON employee_recurring_allowances
FOR ALL USING (is_administrator(auth.uid()));

-- 1.8 RLS Policies for payroll_records
CREATE POLICY "Employees can view their own payroll" ON payroll_records
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Employees can update confirmation fields" ON payroll_records
FOR UPDATE USING (
  auth.uid() = user_id 
  AND status IN ('sent_to_employee', 'disputed')
);

CREATE POLICY "HR admins can create payroll records" ON payroll_records
FOR INSERT WITH CHECK (
  is_hr_admin(auth.uid()) AND auth.uid() = created_by
);

CREATE POLICY "HR admins can view all payroll records" ON payroll_records
FOR SELECT USING (is_hr_admin(auth.uid()));

CREATE POLICY "HR admins can update payroll records" ON payroll_records
FOR UPDATE USING (is_hr_admin(auth.uid()));

CREATE POLICY "Administrators can manage all payroll records" ON payroll_records
FOR ALL USING (is_administrator(auth.uid()));

-- 1.9 RLS Policies for payroll_line_items
CREATE POLICY "Users can view line items of their payroll" ON payroll_line_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM payroll_records pr
    WHERE pr.id = payroll_line_items.payroll_record_id
    AND pr.user_id = auth.uid()
  )
);

CREATE POLICY "HR admins can manage line items" ON payroll_line_items
FOR ALL USING (is_hr_admin(auth.uid()));

CREATE POLICY "Administrators can manage line items" ON payroll_line_items
FOR ALL USING (is_administrator(auth.uid()));

-- 1.10 RLS Policies for payroll_notifications
CREATE POLICY "Users can view their own notifications" ON payroll_notifications
FOR SELECT USING (auth.uid() = sent_to);

CREATE POLICY "Users can mark notifications as read" ON payroll_notifications
FOR UPDATE USING (auth.uid() = sent_to);

CREATE POLICY "System can create notifications" ON payroll_notifications
FOR INSERT WITH CHECK (true);

-- 1.11 Create function to auto-calculate payroll totals
CREATE OR REPLACE FUNCTION calculate_payroll_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.gross_total := NEW.base_salary + NEW.total_bonuses + NEW.total_allowances + NEW.total_others;
  NEW.net_total := NEW.gross_total - NEW.total_deductions;
  RETURN NEW;
END;
$$;

-- 1.12 Create trigger to recalculate totals
DROP TRIGGER IF EXISTS recalculate_payroll_totals ON payroll_records;
CREATE TRIGGER recalculate_payroll_totals
BEFORE INSERT OR UPDATE ON payroll_records
FOR EACH ROW
EXECUTE FUNCTION calculate_payroll_totals();

-- 1.13 Create function to check overdue confirmations
CREATE OR REPLACE FUNCTION get_overdue_payroll_confirmations()
RETURNS TABLE(
  payroll_id UUID,
  employee_id UUID,
  employee_name TEXT,
  month INTEGER,
  year INTEGER,
  days_overdue INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pr.id as payroll_id,
    pr.user_id as employee_id,
    p.first_name || ' ' || p.last_name as employee_name,
    pr.month,
    pr.year,
    EXTRACT(DAY FROM NOW() - pr.sent_to_employee_at)::INTEGER as days_overdue
  FROM payroll_records pr
  JOIN profiles p ON p.user_id = pr.user_id
  WHERE pr.status = 'sent_to_employee'
    AND pr.confirmed_by_employee = false
    AND pr.disputed_by_employee = false
    AND pr.sent_to_employee_at < NOW() - INTERVAL '3 days';
$$;

-- 1.14 Create trigger for updated_at columns
CREATE TRIGGER update_employee_recurring_allowances_updated_at
BEFORE UPDATE ON employee_recurring_allowances
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_records_updated_at
BEFORE UPDATE ON payroll_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();