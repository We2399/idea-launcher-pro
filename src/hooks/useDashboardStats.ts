import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  pendingRequests: number;
  totalRequests: number;
  remainingDays: number;
  usedDays: number;
  loading: boolean;
}

export function useDashboardStats(): DashboardStats {
  const { user, userRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    pendingRequests: 0,
    totalRequests: 0,
    remainingDays: 0,
    usedDays: 0,
    loading: true,
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        // Fetch pending requests count
        let pendingQuery = supabase
          .from('leave_requests')
          .select('id', { count: 'exact' })
          .eq('status', 'pending');

        // Fetch total requests this year
        let totalQuery = supabase
          .from('leave_requests')
          .select('id', { count: 'exact' })
          .gte('created_at', `${new Date().getFullYear()}-01-01`);

        // For employees, filter by their own requests
        if (userRole === 'employee') {
          pendingQuery = pendingQuery.eq('user_id', user.id);
          totalQuery = totalQuery.eq('user_id', user.id);
        }

        const [pendingResult, totalResult] = await Promise.all([
          pendingQuery,
          totalQuery,
        ]);

        // Fetch leave balance for current user
        let remainingDays = 0;
        let usedDays = 0;
        
        if (userRole === 'employee') {
          const { data: balanceData } = await supabase
            .from('leave_balances')
            .select('remaining_days, used_days')
            .eq('user_id', user.id)
            .eq('year', new Date().getFullYear());

          if (balanceData && balanceData.length > 0) {
            remainingDays = balanceData.reduce((sum, balance) => sum + balance.remaining_days, 0);
            usedDays = balanceData.reduce((sum, balance) => sum + balance.used_days, 0);
          } else {
            // Fallback: calculate from approved leave requests
            const { data: approvedRequests } = await supabase
              .from('leave_requests')
              .select('days_requested')
              .eq('user_id', user.id)
              .eq('status', 'approved')
              .gte('created_at', `${new Date().getFullYear()}-01-01`);

            if (approvedRequests) {
              usedDays = approvedRequests.reduce((sum, req) => sum + req.days_requested, 0);
            }
          }
        } else {
          // For managers/HR, show team totals
          const { data: teamBalances } = await supabase
            .from('leave_balances')
            .select('remaining_days, used_days')
            .eq('year', new Date().getFullYear());

          if (teamBalances) {
            remainingDays = teamBalances.reduce((sum, balance) => sum + balance.remaining_days, 0);
            usedDays = teamBalances.reduce((sum, balance) => sum + balance.used_days, 0);
          }
        }

        setStats({
          pendingRequests: pendingResult.count || 0,
          totalRequests: totalResult.count || 0,
          remainingDays,
          usedDays,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [user, userRole]);

  return stats;
}