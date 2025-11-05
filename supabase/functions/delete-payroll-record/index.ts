import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is HR admin or administrator
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || !['hr_admin', 'administrator'].includes(userRole.role)) {
      return new Response(
        JSON.stringify({ error: 'Only HR Admins and Administrators can delete payroll records' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { payroll_id } = await req.json();

    if (!payroll_id) {
      return new Response(
        JSON.stringify({ error: 'payroll_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check payroll status - only allow deleting draft/pending
    const { data: payroll } = await supabase
      .from('payroll_records')
      .select('status')
      .eq('id', payroll_id)
      .single();

    if (!payroll) {
      return new Response(
        JSON.stringify({ error: 'Payroll record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['draft', 'pending_admin_approval'].includes(payroll.status)) {
      return new Response(
        JSON.stringify({ error: 'Can only delete draft or pending payroll records' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Deleting payroll record ${payroll_id} with status ${payroll.status}`);

    // Delete line items first (foreign key dependency)
    const { error: lineItemsError } = await supabase
      .from('payroll_line_items')
      .delete()
      .eq('payroll_record_id', payroll_id);

    if (lineItemsError) {
      console.error('Error deleting line items:', lineItemsError);
      throw lineItemsError;
    }

    // Delete notifications
    const { error: notificationsError } = await supabase
      .from('payroll_notifications')
      .delete()
      .eq('payroll_record_id', payroll_id);

    if (notificationsError) {
      console.error('Error deleting notifications:', notificationsError);
      throw notificationsError;
    }

    // Delete payroll record
    const { error: deleteError } = await supabase
      .from('payroll_records')
      .delete()
      .eq('id', payroll_id);

    if (deleteError) {
      console.error('Error deleting payroll record:', deleteError);
      throw deleteError;
    }

    console.log('Payroll record deleted successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in delete-payroll-record:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
