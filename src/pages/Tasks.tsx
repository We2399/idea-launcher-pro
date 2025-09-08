import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar, User, Flag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string;
  assigned_by: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assignee?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  assigner?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Profile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const Tasks = () => {
  const { user, userRole } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    due_date: ''
  });

  const canCreateTasks = userRole === 'manager' || userRole === 'hr_admin';

  useEffect(() => {
    if (user) {
      fetchTasks();
      if (canCreateTasks) {
        fetchProfiles();
      }
    }
  }, [user, userRole]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      // Fetch tasks based on role
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      if (tasksData) {
        // Fetch profiles for assignees and assigners
        const userIds = [...new Set([
          ...tasksData.map(task => task.assigned_to),
          ...tasksData.map(task => task.assigned_by)
        ])];

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, email')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const profileMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

        const enrichedTasks = tasksData.map(task => ({
          ...task,
          assignee: profileMap.get(task.assigned_to),
          assigner: profileMap.get(task.assigned_by)
        })) as Task[];

        setTasks(enrichedTasks);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .order('first_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch team members',
        variant: 'destructive',
      });
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: formData.title,
          description: formData.description || null,
          assigned_to: formData.assigned_to,
          assigned_by: user.id,
          priority: formData.priority,
          due_date: formData.due_date || null
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task created successfully',
      });

      setShowCreateDialog(false);
      setFormData({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'medium',
        due_date: ''
      });
      fetchTasks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create task',
        variant: 'destructive',
      });
    }
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task status updated',
      });

      fetchTasks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update task',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'default';
      case 'in_progress': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'low': return 'outline';
      case 'medium': return 'secondary';
      case 'high': return 'default';
      case 'urgent': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('tasks')}</h1>
          <p className="text-muted-foreground">Manage tasks and assignments</p>
        </div>
        {canCreateTasks && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {t('createTask')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('createTask')}</DialogTitle>
                <DialogDescription>
                  {t('taskAssignment')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('taskTitle')}</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t('taskDescription')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned_to">{t('assignTo')}</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, assigned_to: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.user_id} value={profile.user_id}>
                          {profile.first_name} {profile.last_name} ({profile.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">{t('priority')}</Label>
                    <Select onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Medium" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">{t('dueDate')}</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit">{t('create')}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No tasks found</p>
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {task.title}
                      <Badge variant={getPriorityColor(task.priority)}>
                        <Flag className="h-3 w-3 mr-1" />
                        {task.priority}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{task.description}</CardDescription>
                  </div>
                  <Badge variant={getStatusColor(task.status)}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>
                        {task.assignee ? `${task.assignee.first_name} ${task.assignee.last_name}` : 'Unknown'}
                      </span>
                    </div>
                    {task.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(task.due_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  {(task.assigned_to === user?.id || canCreateTasks) && task.status !== 'completed' && (
                    <div className="flex gap-2">
                      {task.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                        >
                          Start
                        </Button>
                      )}
                      {task.status === 'in_progress' && (
                        <Button
                          size="sm"
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Tasks;