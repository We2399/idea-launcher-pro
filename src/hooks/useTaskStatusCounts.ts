import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TaskStatusCounts {
  pending: number;      // New tasks (red)
  inProgress: number;   // Started tasks (yellow/orange)
  completed: number;    // Finished tasks needing acknowledgment (green)
  total: number;
}

interface SeenTaskRecord {
  taskId: string;
  seenAt: string;
}

const SEEN_TASKS_KEY = 'task-seen-records';

// Get seen task IDs from localStorage
const getSeenTaskIds = (userId: string): Record<string, string> => {
  try {
    const stored = localStorage.getItem(`${SEEN_TASKS_KEY}-${userId}`);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Mark a task as seen
const markTaskAsSeen = (userId: string, taskId: string) => {
  const seen = getSeenTaskIds(userId);
  seen[taskId] = new Date().toISOString();
  localStorage.setItem(`${SEEN_TASKS_KEY}-${userId}`, JSON.stringify(seen));
};

// Mark multiple tasks as seen
const markTasksAsSeen = (userId: string, taskIds: string[]) => {
  const seen = getSeenTaskIds(userId);
  taskIds.forEach(id => {
    seen[id] = new Date().toISOString();
  });
  localStorage.setItem(`${SEEN_TASKS_KEY}-${userId}`, JSON.stringify(seen));
};

// Check if a task has been seen after it was last updated
const isTaskSeen = (userId: string, taskId: string, updatedAt: string): boolean => {
  const seen = getSeenTaskIds(userId);
  if (!seen[taskId]) return false;
  return new Date(seen[taskId]) > new Date(updatedAt);
};

export const useTaskStatusCounts = () => {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = userRole === 'hr_admin' || userRole === 'administrator';
  const isEmployee = userRole === 'employee';

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['task-status-counts', user?.id, userRole],
    queryFn: async (): Promise<{ counts: TaskStatusCounts; unseenCounts: TaskStatusCounts; tasks: any[] }> => {
      if (!user?.id) {
        return { 
          counts: { pending: 0, inProgress: 0, completed: 0, total: 0 },
          unseenCounts: { pending: 0, inProgress: 0, completed: 0, total: 0 },
          tasks: []
        };
      }

      let query = supabase.from('tasks').select('id, status, updated_at');

      if (isEmployee) {
        // Employees see tasks assigned to them
        query = query.eq('assigned_to', user.id);
      }
      // Admins see all tasks

      const { data: tasks, error } = await query;

      if (error) throw error;

      const allTasks = tasks || [];
      
      // Count tasks by status
      const counts: TaskStatusCounts = {
        pending: allTasks.filter(t => t.status === 'pending').length,
        inProgress: allTasks.filter(t => t.status === 'in_progress').length,
        completed: allTasks.filter(t => t.status === 'completed').length,
        total: allTasks.length
      };

      // Count unseen tasks by status
      const unseenCounts: TaskStatusCounts = {
        pending: allTasks.filter(t => t.status === 'pending' && !isTaskSeen(user.id, t.id, t.updated_at)).length,
        inProgress: allTasks.filter(t => t.status === 'in_progress' && !isTaskSeen(user.id, t.id, t.updated_at)).length,
        completed: allTasks.filter(t => t.status === 'completed' && !isTaskSeen(user.id, t.id, t.updated_at)).length,
        total: 0
      };
      unseenCounts.total = unseenCounts.pending + unseenCounts.inProgress + unseenCounts.completed;

      return { counts, unseenCounts, tasks: allTasks };
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Mark all tasks as seen (when user visits tasks page)
  const markAllAsSeen = () => {
    if (!user?.id || !data?.tasks) return;
    
    const taskIds = data.tasks.map(t => t.id);
    markTasksAsSeen(user.id, taskIds);
    
    // Refetch to update counts
    queryClient.invalidateQueries({ queryKey: ['task-status-counts'] });
  };

  // Mark specific task as seen
  const markSingleTaskAsSeen = (taskId: string) => {
    if (!user?.id) return;
    markTaskAsSeen(user.id, taskId);
    queryClient.invalidateQueries({ queryKey: ['task-status-counts'] });
  };

  return {
    counts: data?.counts || { pending: 0, inProgress: 0, completed: 0, total: 0 },
    unseenCounts: data?.unseenCounts || { pending: 0, inProgress: 0, completed: 0, total: 0 },
    loading: isLoading,
    markAllAsSeen,
    markSingleTaskAsSeen,
    refetch
  };
};
