import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface LeaveTypeBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  totalDays: number;
  remainingDays: number;
  usedDays: number;
  color: string;
}

interface ProfileChangeRequestStats {
  pending: number;
  approved: number;
  total: number;
}

interface EnhancedDashboardStats {
  pendingRequests: number;
  totalRequests: number;
  leaveBalances: LeaveTypeBalance[];
  profileChangeRequests: ProfileChangeRequestStats;
  loading: boolean;
}

const getLeaveTypeColor = (name: string): string => {
  switch (name.toLowerCase()) {
    case 'vacation': return 'hsl(142 71% 45%)'; // green
    case 'sick leave': return 'hsl(25 95% 55%)'; // orange  
    case 'maternity leave': return 'hsl(270 95% 65%)'; // purple
    case 'paternity leave': return 'hsl(200 95% 55%)'; // blue
    default: return 'hsl(215 16% 47%)'; // muted
  }
};

export function useEnhancedDashboardStats(): EnhancedDashboardStats {
  const { user, userRole } = useAuth();
  const [stats, setStats] = useState<EnhancedDashboardStats>({
    pendingRequests: 0,
    totalRequests: 0,
    leaveBalances: [],
    profileChangeRequests: { pending: 0, approved: 0, total: 0 },
    loading: true,
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        // Fetch leave types first
        const { data: leaveTypes } = await supabase
          .from('leave_types')
          .select('id, name, max_days_per_year');

        if (!leaveTypes) return;

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

        // Fetch leave balances with detailed breakdown
        let leaveBalances: LeaveTypeBalance[] = [];
        
        if (userRole === 'employee') {
          // Get user's leave balances
          const { data: balanceData } = await supabase
            .from('leave_balances')
            .select('leave_type_id, remaining_days, used_days, total_days')
            .eq('user_id', user.id)
            .eq('year', new Date().getFullYear());

          if (balanceData && balanceData.length > 0) {
            // Use actual balance data
            leaveBalances = leaveTypes.map(leaveType => {
              const balance = balanceData.find(b => b.leave_type_id === leaveType.id);
              return {
                leaveTypeId: leaveType.id,
                leaveTypeName: leaveType.name,
                totalDays: balance?.total_days || leaveType.max_days_per_year,
                remainingDays: balance?.remaining_days || leaveType.max_days_per_year,
                usedDays: balance?.used_days || 0,
                color: getLeaveTypeColor(leaveType.name)
              };
            });
          } else {
            // Fallback: calculate from approved leave requests
            const { data: approvedRequests } = await supabase
              .from('leave_requests')
              .select('leave_type_id, days_requested')
              .eq('user_id', user.id)
              .eq('status', 'approved')
              .gte('created_at', `${new Date().getFullYear()}-01-01`);

            leaveBalances = leaveTypes.map(leaveType => {
              const usedDays = approvedRequests
                ?.filter(req => req.leave_type_id === leaveType.id)
                ?.reduce((sum, req) => sum + req.days_requested, 0) || 0;
              
              return {
                leaveTypeId: leaveType.id,
                leaveTypeName: leaveType.name,
                totalDays: leaveType.max_days_per_year,
                remainingDays: leaveType.max_days_per_year - usedDays,
                usedDays,
                color: getLeaveTypeColor(leaveType.name)
              };
            });
          }
        } else {
          // For managers/HR, show team totals
          const { data: teamBalances } = await supabase
            .from('leave_balances')
            .select('leave_type_id, remaining_days, used_days, total_days')
            .eq('year', new Date().getFullYear());

          leaveBalances = leaveTypes.map(leaveType => {
            const typeBalances = teamBalances?.filter(b => b.leave_type_id === leaveType.id) || [];
            const totalDays = typeBalances.reduce((sum, b) => sum + b.total_days, 0);
            const remainingDays = typeBalances.reduce((sum, b) => sum + b.remaining_days, 0);
            const usedDays = typeBalances.reduce((sum, b) => sum + b.used_days, 0);
            
            return {
              leaveTypeId: leaveType.id,
              leaveTypeName: leaveType.name,
              totalDays,
              remainingDays,
              usedDays,
              color: getLeaveTypeColor(leaveType.name)
            };
          });
        }

        // Fetch profile change requests stats
        let profileChangeQuery = supabase
          .from('profile_change_requests')
          .select('status', { count: 'exact' });

        if (userRole === 'employee') {
          profileChangeQuery = profileChangeQuery.eq('user_id', user.id);
        }

        const { data: profileRequests } = await profileChangeQuery;
        
        // Count by status
        const pendingProfileRequests = await supabase
          .from('profile_change_requests')
          .select('id', { count: 'exact' })
          .eq('status', 'pending')
          .then(result => userRole === 'employee' 
            ? supabase.from('profile_change_requests')
                .select('id', { count: 'exact' })
                .eq('status', 'pending')
                .eq('user_id', user.id)
            : result
          );

        const approvedProfileRequests = await supabase
          .from('profile_change_requests')
          .select('id', { count: 'exact' })
          .eq('status', 'approved')
          .then(result => userRole === 'employee'
            ? supabase.from('profile_change_requests')
                .select('id', { count: 'exact' })
                .eq('status', 'approved')
                .eq('user_id', user.id)
            : result
          );

        const profileChangeRequests = {
          pending: (await pendingProfileRequests).count || 0,
          approved: (await approvedProfileRequests).count || 0,
          total: ((await pendingProfileRequests).count || 0) + ((await approvedProfileRequests).count || 0)
        };

        setStats({
          pendingRequests: pendingResult.count || 0,
          totalRequests: totalResult.count || 0,
          leaveBalances,
          profileChangeRequests,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching enhanced dashboard stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, [user, userRole]);

  return stats;
}