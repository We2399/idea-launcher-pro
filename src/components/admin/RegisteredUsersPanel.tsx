import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Users, RefreshCw, Copy, Download, Trash2, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface RegisteredUser {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  created_at: string;
  profile_completed: boolean | null;
  organization_id: string | null;
  is_employer: boolean | null;
  role?: string;
}

export function RegisteredUsersPanel() {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState<RegisteredUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, created_at, profile_completed, organization_id, is_employer')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = (profiles || []).map(p => p.user_id);
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const roleMap = new Map((roles || []).map(r => [r.user_id, r.role]));

      setUsers((profiles || []).map(p => ({
        ...p,
        role: roleMap.get(p.user_id) || 'employee',
      })));
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast({ title: 'Error', description: 'Failed to fetch registered users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (u.email || '').toLowerCase().includes(q) ||
      (u.first_name || '').toLowerCase().includes(q) ||
      (u.last_name || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast({ title: 'Copied', description: email });
  };

  const exportCSV = () => {
    const header = 'Email,First Name,Last Name,Role,Registered,Profile Completed,Is Employer';
    const rows = filtered.map(u =>
      `"${u.email || ''}","${u.first_name || ''}","${u.last_name || ''}","${u.role || ''}","${format(new Date(u.created_at), 'yyyy-MM-dd HH:mm')}","${u.profile_completed ? 'Yes' : 'No'}","${u.is_employer ? 'Yes' : 'No'}"`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registered-users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-registered-user', {
        body: { user_id: toDelete.user_id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      toast({ title: 'User deleted', description: toDelete.email || toDelete.user_id });
      setUsers(prev => prev.filter(u => u.user_id !== toDelete.user_id));
      setToDelete(null);
    } catch (err: any) {
      console.error('Delete failed:', err);
      toast({ title: 'Delete failed', description: err.message || 'Could not delete user', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'administrator': return 'default';
      case 'hr_admin': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Registered Users ({users.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, name, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filtered.length} of {users.length} users
        </div>

        <div className="rounded-md border overflow-auto max-h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {loading ? 'Loading...' : 'No users found'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((user, idx) => {
                  const isSelf = currentUser?.id === user.user_id;
                  return (
                    <TableRow key={user.user_id}>
                      <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{user.email || '—'}</TableCell>
                      <TableCell>{(user.first_name || '') + ' ' + (user.last_name || '')}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role || 'employee')} className="text-xs">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(user.created_at), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        {user.role === 'administrator' ? (
                          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">N/A</Badge>
                        ) : user.profile_completed ? (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-300">Complete</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Incomplete</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {user.email && (
                            <Button variant="ghost" size="sm" onClick={() => copyEmail(user.email!)} title="Copy email">
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setToDelete(user)}
                            disabled={isSelf}
                            title={isSelf ? "You can't delete yourself" : 'Delete user'}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && !deleting && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this registered user?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  This permanently removes <strong>{toDelete?.email || 'this user'}</strong> from
                  authentication and cascades to their profile, role, and related records.
                </p>
                <p className="text-destructive font-medium">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (<><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Deleting...</>) : 'Delete user'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
