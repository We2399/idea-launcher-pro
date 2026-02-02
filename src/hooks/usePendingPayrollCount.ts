import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function usePendingPayrollCount() {
  const { userRole } = useAuth();
  
  return useQuery({
    queryKey: ['pending-payroll-count'],
    queryFn: async () => {
      // Only count for administrators
      if (userRole !== 'administrator') return 0;
      
      const { count, error } = await supabase
        .from('payroll_records')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_admin_approval');

      if (error) {
        console.error('Error fetching pending payroll count:', error);
        return 0;
      }

      return count || 0;
    },
    enabled: userRole === 'administrator',
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
