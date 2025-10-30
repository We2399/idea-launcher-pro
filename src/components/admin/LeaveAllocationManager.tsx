import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslationHelpers } from '@/lib/translations';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Check, X, Shield, Crown, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LeaveAllocation {
  id: string;
  user_id: string;
  leave_type_id: string;
  allocated_days: number;
  year: number;
  status: string;
  allocated_by: string;
  senior_management_approved_by?: string;
  administrator_approved_by?: string;
  profiles?: {
    first_name: string;
    last_name: string;
    employee_id: string;
  };
  leave_types?: {
    name: string;
  };
}

interface Employee {
  user_id: string;
  first_name: string;
  last_name: string;
  employee_id: string;
}

interface LeaveType {
  id: string;
  name: string;
  max_days_per_year: number;
}

export function LeaveAllocationManager() {
  const { user, userRole } = useAuth();
  const { t } = useLanguage();
  const { translateLeaveType, translateStatus } = useTranslationHelpers();
  const [allocations, setAllocations] = useState<LeaveAllocation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewAllocation, setShowNewAllocation] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<{ first_name: string; last_name: string } | null>(null);
  
  // Form state
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedLeaveType, setSelectedLeaveType] = useState('');
  const [allocatedDays, setAllocatedDays] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    if (user && (userRole === 'manager' || userRole === 'hr_admin' || userRole === 'administrator')) {
      fetchData();
      fetchCurrentUserProfile();
    }
  }, [user, userRole]);

  const fetchCurrentUserProfile = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setCurrentUserProfile(data);
    } catch (error) {
      console.error('Error fetching current user profile:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [allocationsResult, employeesResult, leaveTypesResult] = await Promise.all([
        supabase.from('leave_allocations').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('user_id, first_name, last_name, employee_id').order('first_name'),
        supabase.from('leave_types').select('*').order('name')
      ]);

      if (allocationsResult.error) throw allocationsResult.error;
      if (employeesResult.error) throw employeesResult.error;
      if (leaveTypesResult.error) throw leaveTypesResult.error;

      // Enrich allocations with profile and leave type data
      if (allocationsResult.data && allocationsResult.data.length > 0) {
        const userIds = [...new Set(allocationsResult.data.map(a => a.user_id))];
        const leaveTypeIds = [...new Set(allocationsResult.data.map(a => a.leave_type_id))];

        const [profilesResult, typesResult] = await Promise.all([
          supabase.from('profiles').select('*').in('user_id', userIds),
          supabase.from('leave_types').select('*').in('id', leaveTypeIds)
        ]);

        const profilesMap = new Map(profilesResult.data?.map(p => [p.user_id, p]) || []);
        const typesMap = new Map(typesResult.data?.map(lt => [lt.id, lt]) || []);

        const enrichedAllocations = allocationsResult.data.map(allocation => ({
          ...allocation,
          profiles: profilesMap.get(allocation.user_id) || null,
          leave_types: typesMap.get(allocation.leave_type_id) || null
        }));

        setAllocations(enrichedAllocations);
      }

      setEmployees(employeesResult.data || []);
      setLeaveTypes(leaveTypesResult.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAllocation = async () => {
    if (!selectedEmployee || !selectedLeaveType || !allocatedDays || !year) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('leave_allocations')
        .insert({
          user_id: selectedEmployee,
          leave_type_id: selectedLeaveType,
          allocated_days: parseInt(allocatedDays),
          year: parseInt(year),
          allocated_by: user?.id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Leave allocation created successfully"
      });

      // Reset form
      setSelectedEmployee('');
      setSelectedLeaveType('');
      setAllocatedDays('');
      setYear(new Date().getFullYear().toString());
      setShowNewAllocation(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create allocation",
        variant: "destructive"
      });
    }
  };

  const handleApproval = async (allocationId: string, action: 'approve' | 'reject', level: 'senior' | 'final') => {
    try {
      let updateData: any = {};
      
      if (level === 'senior') {
        updateData = {
          senior_management_approved_by: user?.id,
          senior_management_approved_at: new Date().toISOString(),
          status: action === 'approve' ? 'senior_approved' : 'rejected'
        };
      } else {
        updateData = {
          administrator_approved_by: user?.id,
          administrator_approved_at: new Date().toISOString(),
          status: action === 'approve' ? 'approved' : 'rejected'
        };
      }

      const { error } = await supabase
        .from('leave_allocations')
        .update(updateData)
        .eq('id', allocationId);

      if (error) {
        console.error('Approval error:', error);
        throw new Error(error.message || `Failed to ${action} allocation`);
      }

      toast({
        title: "Success",
        description: `Allocation ${action}d successfully`
      });

      fetchData();
    } catch (error: any) {
      console.error('Error in handleApproval:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} allocation`,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'outline' as const, icon: Users },
      senior_approved: { variant: 'secondary' as const, icon: Shield },
      approved: { variant: 'default' as const, icon: Check },
      rejected: { variant: 'destructive' as const, icon: X }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;
    
    const statusLabels = {
      pending: t('pendingSeniorApproval'),
      senior_approved: t('pendingAdministratorApproval'),
      approved: t('approved'),
      rejected: t('rejected')
    };
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusLabels[status as keyof typeof statusLabels] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (userRole === 'employee') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('leaveAllocationManagement')}</h1>
          <p className="text-muted-foreground">{t('leaveAllocationDescription')}</p>
        </div>
        {(userRole === 'manager' || userRole === 'hr_admin' || userRole === 'administrator') && (
          <Dialog open={showNewAllocation} onOpenChange={setShowNewAllocation}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {t('newAllocation')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('createLeaveAllocation')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('employee')}</label>
                  <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectEmployee')} />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.user_id} value={employee.user_id}>
                          {employee.first_name} {employee.last_name} ({employee.employee_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('leaveType')}</label>
                  <Select value={selectedLeaveType} onValueChange={setSelectedLeaveType}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectLeaveType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {translateLeaveType(type.name)} ({t('max')}: {type.max_days_per_year} {t('daysPerYear')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('allocatedDays')}</label>
                  <Input
                    type="number"
                    value={allocatedDays}
                    onChange={(e) => setAllocatedDays(e.target.value)}
                    placeholder={t('enterNumberOfDays')}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('year')}</label>
                  <Input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder={t('enterYear')}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleCreateAllocation}>{t('createAllocation')}</Button>
                  <Button variant="outline" onClick={() => setShowNewAllocation(false)}>
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('leaveAllocations')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('employee')}</TableHead>
                <TableHead>{t('leaveType')}</TableHead>
                <TableHead>{t('allocatedDays')}</TableHead>
                <TableHead>{t('year')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.map((allocation) => (
                <TableRow key={allocation.id}>
                  <TableCell>
                    {allocation.profiles ? 
                      `${allocation.profiles.first_name} ${allocation.profiles.last_name} (${allocation.profiles.employee_id})` : 
                      t('unknownEmployee')
                    }
                  </TableCell>
                  <TableCell>{allocation.leave_types?.name ? translateLeaveType(allocation.leave_types.name) : t('unknown')}</TableCell>
                  <TableCell>{allocation.allocated_days} {t('days')}</TableCell>
                  <TableCell>{allocation.year}</TableCell>
                  <TableCell>{getStatusBadge(allocation.status)}</TableCell>
                  <TableCell>
                    {(() => {
                      const isSamePersonByName = currentUserProfile && allocation.profiles && 
                        currentUserProfile.first_name?.toLowerCase() === allocation.profiles.first_name?.toLowerCase() &&
                        currentUserProfile.last_name?.toLowerCase() === allocation.profiles.last_name?.toLowerCase();
                      
                      const isZeroDays = allocation.allocated_days <= 0;

                      // Senior Management Approval (Manager role only)
                      if (userRole === 'manager' && allocation.status === 'pending') {
                        return (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproval(allocation.id, 'approve', 'senior')}
                              className="flex items-center gap-1"
                              disabled={isZeroDays}
                              title={isZeroDays ? 'Cannot approve 0-day allocation' : ''}
                            >
                              <Shield className="h-3 w-3" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleApproval(allocation.id, 'reject', 'senior')}
                              className="flex items-center gap-1"
                            >
                              <X className="h-3 w-3" />
                              Reject
                            </Button>
                          </div>
                        );
                      }
                      
                      // Administrator Final Approval (for senior_approved status)
                      if ((userRole === 'hr_admin' || userRole === 'administrator') && 
                          allocation.status === 'senior_approved' && 
                          allocation.user_id !== user?.id &&
                          !isSamePersonByName) {
                        return (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproval(allocation.id, 'approve', 'final')}
                              className="flex items-center gap-1"
                              disabled={isZeroDays}
                              title={isZeroDays ? 'Cannot approve 0-day allocation' : ''}
                            >
                              <Crown className="h-3 w-3" />
                              Final Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleApproval(allocation.id, 'reject', 'final')}
                              className="flex items-center gap-1"
                            >
                              <X className="h-3 w-3" />
                              Reject
                            </Button>
                          </div>
                        );
                      }

                      // Administrator can also approve directly from pending
                      if ((userRole === 'hr_admin' || userRole === 'administrator') && 
                          allocation.status === 'pending' && 
                          allocation.user_id !== user?.id &&
                          !isSamePersonByName) {
                        return (
                          <div className="flex gap-2">
                            <Button
                              size="sm" 
                              onClick={() => handleApproval(allocation.id, 'approve', 'final')}
                              className="flex items-center gap-1"
                              disabled={isZeroDays}
                              title={isZeroDays ? 'Cannot approve 0-day allocation' : ''}
                            >
                              <Crown className="h-3 w-3" />
                              Admin Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleApproval(allocation.id, 'reject', 'final')}
                              className="flex items-center gap-1"
                            >
                              <X className="h-3 w-3" />
                              Reject
                            </Button>
                          </div>
                        );
                      }

                      return null;
                    })()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {allocations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {t('noLeaveAllocationsFound')}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}