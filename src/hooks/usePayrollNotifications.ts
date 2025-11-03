import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function usePayrollNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['payroll-notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_notifications')
        .select('*, payroll_records(*)')
        .eq('sent_to', user!.id)
        .is('read_at', null)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function usePayrollCounts() {
  const { user, userRole } = useAuth();

  // Count pending confirmations (for employees)
  const { data: pendingConfirmationsData } = useQuery({
    queryKey: ['pending-confirmations', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('payroll_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('status', 'sent_to_employee')
        .eq('confirmed_by_employee', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user && userRole === 'employee',
  });

  // Count pending approvals (for administrators)
  const { data: pendingApprovals } = useQuery({
    queryKey: ['pending-approvals-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('payroll_records')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_admin_approval');

      if (error) throw error;
      return count;
    },
    enabled: !!user && userRole === 'administrator',
  });

  // Count overdue confirmations (for HR/Admin)
  const { data: overdueConfirmations } = useQuery({
    queryKey: ['overdue-confirmations'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_overdue_payroll_confirmations');

      if (error) throw error;
      return data?.length || 0;
    },
    enabled: !!user && (userRole === 'hr_admin' || userRole === 'administrator'),
  });

  // Count disputed payrolls (for HR/Admin)
  const { data: disputedCount } = useQuery({
    queryKey: ['disputed-payroll-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('payroll_records')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'disputed');

      if (error) throw error;
      return count;
    },
    enabled: !!user && (userRole === 'hr_admin' || userRole === 'administrator'),
  });

  return {
    pendingConfirmations: pendingConfirmationsData || 0,
    pendingApprovals: pendingApprovals || 0,
    overdueConfirmations: overdueConfirmations || 0,
    disputedCount: disputedCount || 0,
  };
}
