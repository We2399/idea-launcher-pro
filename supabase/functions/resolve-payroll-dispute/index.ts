import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResolveDisputeRequest {
  payroll_record_id: string;
  action: 'revise' | 'reject_dispute';
  resolution_notes: string;
  // For revise action
  line_items?: Array<{
    item_type: string;
    category: string;
    description: string;
    amount: number;
  }>;
  base_salary?: number;
  currency?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user is HR Admin or Administrator
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || !userRole || !['hr_admin', 'administrator'].includes(userRole.role)) {
      console.error('Role verification failed:', roleError);
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: ResolveDisputeRequest = await req.json();
    const { payroll_record_id, action, resolution_notes, line_items, base_salary, currency } = body;

    if (!payroll_record_id || !action || !resolution_notes) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the payroll record
    const { data: payroll, error: fetchError } = await supabaseClient
      .from('payroll_records')
      .select('*, profiles!payroll_records_user_id_fkey(first_name, last_name)')
      .eq('id', payroll_record_id)
      .single();

    if (fetchError || !payroll) {
      console.error('Payroll fetch error:', fetchError);
      return new Response(JSON.stringify({ error: 'Payroll record not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify payroll is disputed
    if (payroll.status !== 'disputed') {
      return new Response(JSON.stringify({ error: 'Payroll is not in disputed status' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'revise') {
      // HR wants to revise the payroll
      if (!line_items || line_items.length === 0) {
        return new Response(JSON.stringify({ error: 'Line items required for revision' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Calculate totals
      let totalBonuses = 0;
      let totalAllowances = 0;
      let totalOthers = 0;
      let totalDeductions = 0;

      line_items.forEach(item => {
        const amount = Number(item.amount);
        if (item.item_type === 'bonus') totalBonuses += amount;
        else if (item.item_type === 'allowance') totalAllowances += amount;
        else if (item.item_type === 'other') totalOthers += amount;
        else if (item.item_type === 'deduction') totalDeductions += amount;
      });

      const newBaseSalary = base_salary !== undefined ? Number(base_salary) : Number(payroll.base_salary);
      const grossTotal = newBaseSalary + totalBonuses + totalAllowances + totalOthers;
      const netTotal = grossTotal - totalDeductions;

      // Update payroll record - set to pending_admin_approval
      const { error: updateError } = await supabaseClient
        .from('payroll_records')
        .update({
          base_salary: newBaseSalary,
          currency: currency || payroll.currency,
          total_bonuses: totalBonuses,
          total_allowances: totalAllowances,
          total_others: totalOthers,
          total_deductions: totalDeductions,
          gross_total: grossTotal,
          net_total: netTotal,
          status: 'pending_admin_approval',
          dispute_resolution_notes: resolution_notes,
          dispute_resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payroll_record_id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Delete existing line items
      await supabaseClient
        .from('payroll_line_items')
        .delete()
        .eq('payroll_record_id', payroll_record_id);

      // Insert new line items
      const lineItemsToInsert = line_items.map(item => ({
        payroll_record_id,
        item_type: item.item_type,
        category: item.category,
        description: item.description,
        amount: Number(item.amount),
      }));

      const { error: lineItemsError } = await supabaseClient
        .from('payroll_line_items')
        .insert(lineItemsToInsert);

      if (lineItemsError) {
        console.error('Line items error:', lineItemsError);
        throw lineItemsError;
      }

      // Notify administrators
      const { data: admins } = await supabaseClient
        .from('user_roles')
        .select('user_id')
        .eq('role', 'administrator');

      const adminNotifications = (admins || []).map(admin => ({
        sent_to: admin.user_id,
        payroll_record_id,
        notification_type: 'revision_for_approval',
        message: `HR has revised disputed payroll for ${payroll.profiles.first_name} ${payroll.profiles.last_name} (${payroll.month}/${payroll.year}). Please review.`,
      }));

      if (adminNotifications.length > 0) {
        await supabaseClient
          .from('payroll_notifications')
          .insert(adminNotifications);
      }

      // Also notify the employee that their dispute is being addressed
      await supabaseClient
        .from('payroll_notifications')
        .insert({
          sent_to: payroll.user_id,
          payroll_record_id,
          notification_type: 'dispute_under_review',
          message: `Your dispute for payroll ${payroll.month}/${payroll.year} is being reviewed. HR Response: ${resolution_notes}`,
        });

      console.log(`Payroll ${payroll_record_id} revised by HR user ${user.id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Payroll revised and submitted for admin approval',
          payroll_record: { id: payroll_record_id, status: 'pending_admin_approval' }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'reject_dispute') {
      // HR rejects the dispute - send back to employee
      const { error: updateError } = await supabaseClient
        .from('payroll_records')
        .update({
          status: 'sent_to_employee',
          dispute_resolution_notes: resolution_notes,
          dispute_resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', payroll_record_id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Notify employee
      await supabaseClient
        .from('payroll_notifications')
        .insert({
          sent_to: payroll.user_id,
          payroll_record_id,
          notification_type: 'dispute_rejected',
          message: `Your dispute for payroll ${payroll.month}/${payroll.year} has been reviewed. HR Response: ${resolution_notes}`,
        });

      console.log(`Dispute for payroll ${payroll_record_id} rejected by HR user ${user.id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Dispute rejected, employee notified',
          payroll_record: { id: payroll_record_id, status: 'sent_to_employee' }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in resolve-payroll-dispute:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
