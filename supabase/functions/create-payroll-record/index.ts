import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LineItem {
  item_type: 'bonus' | 'allowance' | 'other' | 'deduction';
  category: string;
  description: string;
  amount: number;
}

interface CreatePayrollRequest {
  employee_id: string;
  month: number;
  year: number;
  base_salary?: number;
  currency?: string;
  line_items: LineItem[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is HR Admin or Administrator
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = roleData?.role === 'administrator';
    const isHR = roleData?.role === 'hr_admin';

    if (!isAdmin && !isHR) {
      throw new Error('Only HR Admins and Administrators can create payroll records');
    }

    const body: CreatePayrollRequest = await req.json();
    const { employee_id, month, year, line_items } = body;

    // Fetch employee's base salary and recurring allowances
    const { data: profile } = await supabase
      .from('profiles')
      .select('base_monthly_salary, salary_currency')
      .eq('user_id', employee_id)
      .single();

    const { data: recurringAllowances } = await supabase
      .from('employee_recurring_allowances')
      .select('*')
      .eq('user_id', employee_id)
      .eq('is_active', true);

    // Use provided base_salary and currency or fall back to profile values
    const base_salary = body.base_salary !== undefined 
      ? Number(body.base_salary) 
      : (Number(profile?.base_monthly_salary) || 0);
    const currency = body.currency || profile?.salary_currency || 'USD';
    let total_bonuses = 0;
    let total_allowances = 0;
    let total_others = 0;
    let total_deductions = 0;

    // Add recurring allowances to line items
    const allLineItems = [...line_items];
    if (recurringAllowances && recurringAllowances.length > 0) {
      recurringAllowances.forEach((allowance) => {
        allLineItems.push({
          item_type: 'allowance',
          category: allowance.allowance_type,
          description: allowance.description || allowance.allowance_type,
          amount: Number(allowance.amount),
        });
      });
    }

    // Calculate totals from line items
    allLineItems.forEach((item) => {
      const amount = Number(item.amount);
      if (item.item_type === 'bonus') total_bonuses += amount;
      else if (item.item_type === 'allowance') total_allowances += amount;
      else if (item.item_type === 'other') total_others += amount;
      else if (item.item_type === 'deduction') total_deductions += amount;
    });

    // Determine status based on creator role
    const status = isAdmin ? 'sent_to_employee' : 'pending_admin_approval';
    const sent_to_employee_at = isAdmin ? new Date().toISOString() : null;
    const submitted_for_approval_at = isHR ? new Date().toISOString() : null;

    // Create payroll record
    const { data: payrollRecord, error: payrollError } = await supabase
      .from('payroll_records')
      .insert({
        user_id: employee_id,
        month,
        year,
        base_salary,
        total_bonuses,
        total_allowances,
        total_others,
        total_deductions,
        currency,
        status,
        created_by: user.id,
        sent_to_employee_at,
        submitted_for_approval_at,
      })
      .select()
      .single();

    if (payrollError) throw payrollError;

    // Insert line items
    if (allLineItems.length > 0) {
      const lineItemsToInsert = allLineItems.map((item) => ({
        payroll_record_id: payrollRecord.id,
        ...item,
      }));

      const { error: lineItemsError } = await supabase
        .from('payroll_line_items')
        .insert(lineItemsToInsert);

      if (lineItemsError) throw lineItemsError;
    }

    // Create notification
    if (isAdmin) {
      // Notify employee
      await supabase.from('payroll_notifications').insert({
        payroll_record_id: payrollRecord.id,
        notification_type: 'payment_sent',
        sent_to: employee_id,
        message: `Your payroll for ${month}/${year} has been sent. Please confirm receipt.`,
      });
    } else if (isHR) {
      // Notify administrators
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'administrator');

      if (admins) {
        const notifications = admins.map((admin) => ({
          payroll_record_id: payrollRecord.id,
          notification_type: 'pending_approval',
          sent_to: admin.user_id,
          message: `Payroll for ${month}/${year} needs approval`,
        }));

        await supabase.from('payroll_notifications').insert(notifications);
      }
    }

    console.log('Payroll record created successfully:', payrollRecord.id);

    return new Response(
      JSON.stringify({ success: true, payroll_record: payrollRecord }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating payroll record:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
