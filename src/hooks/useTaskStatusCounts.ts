import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TaskStatusCounts {
  pending: number;           // New tasks (red)
  inProgress: number;        // Started tasks (yellow/amber)
  completedUnacknowledged: number;  // Finished but not acknowledged by admin (green badge)
  total: number;
}

export const useTaskStatusCounts = () => {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = userRole === 'hr_admin' || userRole === 'administrator';
  const isEmployee = userRole === 'employee';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['task-status-counts', user?.id, userRole],
    queryFn: async (): Promise<{ counts: TaskStatusCounts; tasks: any[] }> => {
      if (!user?.id) {
        return { 
          counts: { pending: 0, inProgress: 0, completedUnacknowledged: 0, total: 0 },
          tasks: []
        };
      }

      let query = supabase.from('tasks').select('id, status, updated_at, completed_at, admin_acknowledged_at, assigned_to, assigned_by');

      if (isEmployee) {
        // Employees see tasks assigned to them
        query = query.eq('assigned_to', user.id);
      }
      // Admins see all tasks

      const { data: tasks, error } = await query;

      if (error) {
        console.error('Task fetch error:', error);
        throw error;
      }

      const allTasks = tasks || [];
      
      // Count tasks that need attention
      // For BOTH admin and employee: show badge for tasks not yet acknowledged
      const counts: TaskStatusCounts = {
        pending: allTasks.filter(t => t.status === 'pending').length,
        inProgress: allTasks.filter(t => t.status === 'in_progress').length,
        // Completed but NOT acknowledged by admin - shows on both sides
        completedUnacknowledged: allTasks.filter(t => 
          t.status === 'completed' && !t.admin_acknowledged_at
        ).length,
        total: 0
      };
      counts.total = counts.pending + counts.inProgress + counts.completedUnacknowledged;

      return { counts, tasks: allTasks };
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Admin acknowledges completed task - removes badge from both sides
  const acknowledgeTask = useMutation({
    mutationFn: async (taskId: string) => {
      if (!user?.id || !isAdmin) throw new Error('Unauthorized');
      
      const { error } = await supabase
        .from('tasks')
        .update({ 
          admin_acknowledged_at: new Date().toISOString(),
          admin_acknowledged_by: user.id
        })
        .eq('id', taskId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-status-counts'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  // Admin acknowledges all completed tasks
  const acknowledgeAllCompleted = useMutation({
    mutationFn: async () => {
      if (!user?.id || !isAdmin) throw new Error('Unauthorized');
      
      const { error } = await supabase
        .from('tasks')
        .update({ 
          admin_acknowledged_at: new Date().toISOString(),
          admin_acknowledged_by: user.id
        })
        .eq('status', 'completed')
        .is('admin_acknowledged_at', null);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-status-counts'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  return {
    counts: data?.counts || { pending: 0, inProgress: 0, completedUnacknowledged: 0, total: 0 },
    loading: isLoading,
    isAdmin,
    acknowledgeTask: acknowledgeTask.mutate,
    acknowledgeAllCompleted: acknowledgeAllCompleted.mutate,
    isAcknowledging: acknowledgeTask.isPending || acknowledgeAllCompleted.isPending,
    refetch
  };
};
