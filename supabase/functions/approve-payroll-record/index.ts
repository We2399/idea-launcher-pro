import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApprovePayrollRequest {
  payroll_record_id: string;
  action: 'approve' | 'reject';
  rejection_reason?: string;
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

    // Check if user is Administrator
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleData?.role !== 'administrator') {
      throw new Error('Only Administrators can approve payroll records');
    }

    const body: ApprovePayrollRequest = await req.json();
    const { payroll_record_id, action, rejection_reason } = body;

    // Fetch the payroll record
    const { data: payrollRecord, error: fetchError } = await supabase
      .from('payroll_records')
      .select('*, profiles!payroll_records_user_id_fkey(first_name, last_name)')
      .eq('id', payroll_record_id)
      .single();

    if (fetchError || !payrollRecord) {
      throw new Error('Payroll record not found');
    }

    if (payrollRecord.status !== 'pending_admin_approval') {
      throw new Error('Payroll record is not pending approval');
    }

    let updateData: any = {
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    };

    let notificationMessage = '';

    if (action === 'approve') {
      updateData.status = 'sent_to_employee';
      updateData.sent_to_employee_at = new Date().toISOString();
      notificationMessage = `Your payroll for ${payrollRecord.month}/${payrollRecord.year} has been approved and sent. Please confirm receipt.`;

      // Notify employee
      await supabase.from('payroll_notifications').insert({
        payroll_record_id,
        notification_type: 'payment_sent',
        sent_to: payrollRecord.user_id,
        message: notificationMessage,
      });
    } else if (action === 'reject') {
      updateData.status = 'rejected';
      updateData.dispute_resolution_notes = rejection_reason;
      notificationMessage = `Payroll for ${payrollRecord.month}/${payrollRecord.year} was not approved. Reason: ${rejection_reason}`;

      // Notify HR admin who created it
      await supabase.from('payroll_notifications').insert({
        payroll_record_id,
        notification_type: 'rejected',
        sent_to: payrollRecord.created_by,
        message: notificationMessage,
      });
    }

    // Update payroll record
    const { data: updatedRecord, error: updateError } = await supabase
      .from('payroll_records')
      .update(updateData)
      .eq('id', payroll_record_id)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log(`Payroll record ${action}d successfully:`, payroll_record_id);

    return new Response(
      JSON.stringify({ success: true, payroll_record: updatedRecord }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error approving payroll record:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
