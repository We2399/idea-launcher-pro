import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployeePendingDiscussions } from './usePendingDiscussions';
import { useAdminNeedsReplyDiscussions } from './usePendingDiscussions';
import { usePendingDocumentsCount } from './usePendingDocumentsCount';

interface DashboardCounts {
  // Employee counts
  pendingLeaveRequests: number;
  pendingCashRequests: number;
  pendingProfileChanges: number;
  documentsNeedingReply: number;
  pendingTasks: number;
  
  // Admin counts
  pendingLeaveApprovals: number;
  pendingCashApprovals: number;
  pendingProfileApprovals: number;
  pendingDocumentApprovals: number;
  discussionsNeedingReply: number;
  allPendingTasks: number;
  
  loading: boolean;
}

export const useDashboardCounts = (): DashboardCounts => {
  const { user, userRole } = useAuth();
  const isEmployee = userRole === 'employee';
  const isAdmin = userRole === 'hr_admin' || userRole === 'administrator';

  // Employee-specific counts
  const { data: employeeDiscussions } = useEmployeePendingDiscussions();
  
  // Admin-specific counts
  const { data: adminDiscussions } = useAdminNeedsReplyDiscussions();
  const { data: pendingDocCount } = usePendingDocumentsCount();

  // Fetch employee-specific counts
  const { data: employeeCounts, isLoading: employeeLoading } = useQuery({
    queryKey: ['employee-dashboard-counts', user?.id],
    queryFn: async () => {
      if (!user?.id || !isEmployee) return null;

      const [leaveResult, cashResult, profileResult, tasksResult] = await Promise.all([
        // Pending leave requests
        supabase
          .from('leave_requests')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'pending'),
        
        // Pending cash requests
        supabase
          .from('cash_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('employee_id', user.id)
          .eq('status', 'pending'),
        
        // Pending profile changes
        supabase
          .from('profile_change_requests')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'pending'),
        
        // Pending tasks assigned to user
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', user.id)
          .in('status', ['pending', 'in_progress'])
      ]);

      return {
        pendingLeaveRequests: leaveResult.count || 0,
        pendingCashRequests: cashResult.count || 0,
        pendingProfileChanges: profileResult.count || 0,
        pendingTasks: tasksResult.count || 0,
      };
    },
    enabled: isEmployee && !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch admin-specific counts
  const { data: adminCounts, isLoading: adminLoading } = useQuery({
    queryKey: ['admin-dashboard-counts'],
    queryFn: async () => {
      if (!isAdmin) return null;

      const [leaveResult, cashResult, profileResult, tasksResult] = await Promise.all([
        // Pending leave approvals (pending + senior_approved)
        supabase
          .from('leave_requests')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'senior_approved']),
        
        // Pending cash approvals
        supabase
          .from('cash_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        
        // Pending profile change approvals
        supabase
          .from('profile_change_requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        
        // All pending/in-progress tasks
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'in_progress'])
      ]);

      return {
        pendingLeaveApprovals: leaveResult.count || 0,
        pendingCashApprovals: cashResult.count || 0,
        pendingProfileApprovals: profileResult.count || 0,
        allPendingTasks: tasksResult.count || 0,
      };
    },
    enabled: isAdmin,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return {
    // Employee counts
    pendingLeaveRequests: employeeCounts?.pendingLeaveRequests || 0,
    pendingCashRequests: employeeCounts?.pendingCashRequests || 0,
    pendingProfileChanges: employeeCounts?.pendingProfileChanges || 0,
    documentsNeedingReply: employeeDiscussions?.length || 0,
    pendingTasks: employeeCounts?.pendingTasks || 0,
    
    // Admin counts
    pendingLeaveApprovals: adminCounts?.pendingLeaveApprovals || 0,
    pendingCashApprovals: adminCounts?.pendingCashApprovals || 0,
    pendingProfileApprovals: adminCounts?.pendingProfileApprovals || 0,
    pendingDocumentApprovals: pendingDocCount || 0,
    discussionsNeedingReply: adminDiscussions?.length || 0,
    allPendingTasks: adminCounts?.allPendingTasks || 0,
    
    loading: employeeLoading || adminLoading,
  };
};
