import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConfirmPayrollRequest {
  payroll_record_id: string;
  employee_notes?: string;
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

    const body: ConfirmPayrollRequest = await req.json();
    const { payroll_record_id, employee_notes } = body;

    // Fetch the payroll record
    const { data: payrollRecord, error: fetchError } = await supabase
      .from('payroll_records')
      .select('*')
      .eq('id', payroll_record_id)
      .single();

    if (fetchError || !payrollRecord) {
      throw new Error('Payroll record not found');
    }

    // Verify user is the employee
    if (payrollRecord.user_id !== user.id) {
      throw new Error('You can only confirm your own payroll');
    }

    if (payrollRecord.status !== 'sent_to_employee') {
      throw new Error('Payroll is not ready for confirmation');
    }

    // Update payroll record
    const { data: updatedRecord, error: updateError } = await supabase
      .from('payroll_records')
      .update({
        confirmed_by_employee: true,
        employee_confirmed_at: new Date().toISOString(),
        employee_notes: employee_notes || null,
        status: 'confirmed',
      })
      .eq('id', payroll_record_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Notify HR admins
    const { data: hrAdmins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'hr_admin');

    // Notify creator
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .single();

    const employeeName = profile ? `${profile.first_name} ${profile.last_name}` : 'Employee';
    const notificationMessage = `${employeeName} has confirmed receipt of payroll for ${payrollRecord.month}/${payrollRecord.year}`;

    const notifications = [
      {
        payroll_record_id,
        notification_type: 'employee_confirmed',
        sent_to: payrollRecord.created_by,
        message: notificationMessage,
      },
    ];

    if (hrAdmins) {
      hrAdmins.forEach((admin) => {
        if (admin.user_id !== payrollRecord.created_by) {
          notifications.push({
            payroll_record_id,
            notification_type: 'employee_confirmed',
            sent_to: admin.user_id,
            message: notificationMessage,
          });
        }
      });
    }

    await supabase.from('payroll_notifications').insert(notifications);

    console.log('Payroll confirmed successfully:', payroll_record_id);

    return new Response(
      JSON.stringify({ success: true, payroll_record: updatedRecord }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error confirming payroll:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
