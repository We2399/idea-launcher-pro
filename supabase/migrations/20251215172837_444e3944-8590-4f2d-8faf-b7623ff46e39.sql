-- Clear all test data in correct order (respecting foreign keys)
-- This preserves all schema, RLS policies, functions, and triggers

-- First, clear tables with foreign key dependencies
DELETE FROM public.payroll_notifications;
DELETE FROM public.payroll_line_items;
DELETE FROM public.payroll_records;
DELETE FROM public.leave_requests;
DELETE FROM public.leave_balances;
DELETE FROM public.leave_allocations;
DELETE FROM public.cash_transactions;
DELETE FROM public.chat_messages;
DELETE FROM public.tasks;
DELETE FROM public.document_comments;
DELETE FROM public.document_storage;
DELETE FROM public.profile_documents;
DELETE FROM public.profile_change_requests;
DELETE FROM public.employee_invitations;
DELETE FROM public.organization_members;
DELETE FROM public.employee_work_schedules;
DELETE FROM public.employee_recurring_allowances;
DELETE FROM public.audit_logs;

-- Clear user roles
DELETE FROM public.user_roles;

-- Clear profiles
DELETE FROM public.profiles;

-- Clear organizations
DELETE FROM public.organizations;

-- Reset first_admin_created setting so first new user becomes admin
UPDATE public.system_settings 
SET setting_value = '{"admin_created": false}'::jsonb
WHERE setting_key = 'first_admin_created';