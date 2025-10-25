import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { RequestFilters } from '@/components/requests/RequestFilters';
import { Plus, CalendarIcon, Check, X, Clock, Download, Filter, Shield, Crown, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { getDateLocale, getLocalizedDateFormat } from '@/lib/dateLocale';
import { useTranslationHelpers } from '@/lib/translations';

interface LeaveRequest {
  id: string;
  start_date: string;
  end_date: string;
  days_requested: number;
  reason: string;
  status: string;
  created_at: string;
  leave_type_id: string;
  user_id: string;
  rejection_reason?: string;
  profiles?: {
    first_name: string;
    last_name: string;
    employee_id: string;
  };
  leave_types?: {
    name: string;
  };
}

interface LeaveType {
  id: string;
  name: string;
  max_days_per_year: number;
}

export default function Requests() {
  const { user, userRole } = useAuth();
  const { impersonatedUserId, isImpersonating } = useImpersonation();
  const { t, language } = useLanguage();
  const { translateLeaveType, translateStatus } = useTranslationHelpers();
  
  // Use impersonated user ID if active, otherwise use logged-in user
  const effectiveUserId = impersonatedUserId || user?.id;
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');
  
  // Form state
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedLeaveType, setSelectedLeaveType] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (effectiveUserId) {
      fetchRequests();
      fetchLeaveTypes();
    }
  }, [effectiveUserId, userRole, impersonatedUserId]);

  const fetchRequests = async () => {
    try {
      let query = supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (userRole === 'employee' || impersonatedUserId) {
        query = query.eq('user_id', effectiveUserId);
      }

      const { data: requestsData, error: requestsError } = await query;
      if (requestsError) throw requestsError;

      // Fetch related data separately
      if (requestsData && requestsData.length > 0) {
        const userIds = [...new Set(requestsData.map(req => req.user_id))];
        const leaveTypeIds = [...new Set(requestsData.map(req => req.leave_type_id))];

        const [profilesResult, leaveTypesResult] = await Promise.all([
          supabase.from('profiles').select('*').in('user_id', userIds),
          supabase.from('leave_types').select('*').in('id', leaveTypeIds)
        ]);

        const profilesMap = new Map(profilesResult.data?.map(p => [p.user_id, p]) || []);
        const leaveTypesMap = new Map(leaveTypesResult.data?.map(lt => [lt.id, lt]) || []);

        const enrichedData = requestsData.map(request => ({
          ...request,
          profiles: profilesMap.get(request.user_id) || null,
          leave_types: leaveTypesMap.get(request.leave_type_id) || null
        }));

        setRequests(enrichedData);
      } else {
        setRequests([]);
      }
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('operationFailed'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setLeaveTypes(data || []);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('operationFailed'),
        variant: "destructive"
      });
    }
  };

  const calculateDays = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Format a Date as a local date string without timezone issues
  const formatDateLocal = (date: Date) => format(date, 'yyyy-MM-dd');

  // Check if the requested range overlaps with any existing pending/approved requests
  const hasOverlap = async (start: Date, end: Date, excludeId?: string, userId?: string) => {
    if (!effectiveUserId) return false;
    const startStr = formatDateLocal(start);
    const endStr = formatDateLocal(end);
    // Use provided userId or default to effective user
    const checkUserId = userId || effectiveUserId;
    const { data, error } = await supabase
      .from('leave_requests')
      .select('id,start_date,end_date,status')
      .eq('user_id', checkUserId)
      .in('status', ['pending', 'approved', 'senior_approved']);
    if (error) throw error;
    return (data || []).some((r) => {
      if (excludeId && r.id === excludeId) return false;
      // Overlap if not (newEnd < existingStart or newStart > existingEnd)
      return !(endStr < r.start_date || startStr > r.end_date);
    });
  };

  const handleSubmitRequest = async () => {
    if (!startDate || !endDate || !selectedLeaveType || !reason.trim()) {
      toast({
        title: t('error'),
        description: t('requiredField'),
        variant: "destructive"
      });
      return;
    }

    try {
      // Prevent overlapping requests
      if (await hasOverlap(startDate, endDate)) {
        toast({
          title: t('error'),
          description: t('overlappingDates'),
          variant: 'destructive'
        });
        return;
      }

      const daysRequested = calculateDays(startDate, endDate);
      
      const { error } = await supabase
        .from('leave_requests')
        .insert({
          user_id: effectiveUserId,
          start_date: formatDateLocal(startDate),
          end_date: formatDateLocal(endDate),
          days_requested: daysRequested,
          leave_type_id: selectedLeaveType,
          reason: reason,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('requestSubmitted')
      });

      // Reset form
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedLeaveType('');
      setReason('');
      setShowNewRequest(false);
      fetchRequests();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('operationFailed'),
        variant: "destructive"
      });
    }
  };

  const handleEditRequest = async () => {
    if (!startDate || !endDate || !selectedLeaveType || !reason.trim() || !editingRequest) {
      toast({
        title: t('error'),
        description: t('requiredField'),
        variant: "destructive"
      });
      return;
    }

    try {
      // Prevent overlapping requests (exclude the current request)
      if (await hasOverlap(startDate, endDate, editingRequest.id)) {
        toast({
          title: t('error'),
          description: t('overlappingDates'),
          variant: 'destructive'
        });
        return;
      }

      const daysRequested = calculateDays(startDate, endDate);
      
      const { error } = await supabase
        .from('leave_requests')
        .update({
          start_date: formatDateLocal(startDate),
          end_date: formatDateLocal(endDate),
          days_requested: daysRequested,
          leave_type_id: selectedLeaveType,
          reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRequest.id);

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('requestUpdated')
      });

      // Reset form
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedLeaveType('');
      setReason('');
      setShowEditDialog(false);
      setEditingRequest(null);
      fetchRequests();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('operationFailed'),
        variant: "destructive"
      });
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('requestDeleted')
      });

      fetchRequests();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('operationFailed'),
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (request: LeaveRequest) => {
    setEditingRequest(request);
    setStartDate(new Date(request.start_date));
    setEndDate(new Date(request.end_date));
    setSelectedLeaveType(request.leave_type_id);
    setReason(request.reason);
    setShowEditDialog(true);
  };

  const handleSeniorApproval = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      // If approving, check for overlaps first
      if (status === 'approved') {
        const request = requests.find(r => r.id === requestId);
        if (request && await hasOverlap(new Date(request.start_date), new Date(request.end_date), requestId, request.user_id)) {
          toast({
            title: t('error'),
            description: t('overlappingDates'),
            variant: 'destructive'
          });
          return;
        }
      }

      const updateData = userRole === 'hr_admin' ? {
        senior_management_approved_by: user?.id,
        senior_management_approved_at: new Date().toISOString(),
        status: status === 'approved' ? 'senior_approved' : 'rejected'
      } : {
        status,
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
        administrator_approved_by: user?.id,
        administrator_approved_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('leave_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: t('success'),
        description: `${t('requestStatus')} ${status} ${userRole === 'hr_admin' ? 'by HR Admin' : 'by Administrator'}`
      });
      
      fetchRequests();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('operationFailed'),
        variant: "destructive"
      });
    }
  };

  const handleFinalApproval = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      // If approving, check for overlaps first
      if (status === 'approved') {
        const request = requests.find(r => r.id === requestId);
        if (request && await hasOverlap(new Date(request.start_date), new Date(request.end_date), requestId, request.user_id)) {
          toast({
            title: t('error'),
            description: t('overlappingDates'),
            variant: 'destructive'
          });
          return;
        }
      }

      const updateData: any = {
        status,
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
        administrator_approved_by: user?.id,
        administrator_approved_at: new Date().toISOString()
      };

      // If impersonating, track it in rejection_reason metadata
      if (isImpersonating && impersonatedUserId && status === 'rejected') {
        const request = requests.find(r => r.id === requestId);
        const existingReason = request?.rejection_reason || '';
        updateData.rejection_reason = existingReason ? 
          `${existingReason} | Approved by Administrator while viewing user ${impersonatedUserId}` :
          `Approved by Administrator while viewing user ${impersonatedUserId}`;
      }

      const { error } = await supabase
        .from('leave_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: t('success'),
        description: `${t('requestStatus')} ${status}${isImpersonating ? ' (while impersonating)' : ''}`
      });
      
      fetchRequests();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('operationFailed'),
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'outline' as const, icon: Clock, color: 'text-muted-foreground' },
      senior_approved: { variant: 'secondary' as const, icon: Shield, color: 'text-secondary-foreground' },
      approved: { variant: 'default' as const, icon: Check, color: 'text-primary' },
      rejected: { variant: 'destructive' as const, icon: X, color: 'text-destructive-foreground' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;
    
    const statusLabels = {
      pending: t('pending'),
      senior_approved: t('seniorApproved'),
      approved: t('approved'),
      rejected: t('rejected')
    };
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {statusLabels[status as keyof typeof statusLabels] || status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Filtered requests based on search and filters
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      // Search filter
      const searchMatch = searchQuery === '' || 
        request.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (request.profiles && 
          `${request.profiles.first_name} ${request.profiles.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (request.profiles?.employee_id && 
          request.profiles.employee_id.toLowerCase().includes(searchQuery.toLowerCase()));

      // Status filter
      const statusMatch = statusFilter === 'all' || request.status === statusFilter;

      // Leave type filter
      const typeMatch = leaveTypeFilter === 'all' || request.leave_type_id === leaveTypeFilter;

      return searchMatch && statusMatch && typeMatch;
    });
  }, [requests, searchQuery, statusFilter, leaveTypeFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setLeaveTypeFilter('all');
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || leaveTypeFilter !== 'all';

  const handleExport = () => {
    const csvContent = [
      [t('employee'), t('leaveType'), t('startDate'), t('endDate'), t('days'), t('reason'), t('status')].join(','),
      ...filteredRequests.map(request => [
        `"${request.profiles ? `${request.profiles.first_name} ${request.profiles.last_name} (${request.profiles.employee_id})` : t('unknown')}"`,
        `"${translateLeaveType(request.leave_types?.name || '')}"`,
        `"${format(new Date(request.start_date), getLocalizedDateFormat(language), { locale: getDateLocale(language) })}"`,
        `"${format(new Date(request.end_date), getLocalizedDateFormat(language), { locale: getDateLocale(language) })}"`,
        request.days_requested,
        `"${request.reason}"`,
        `"${translateStatus(request.status)}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-requests-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: t('success'),
      description: t('exportSuccess')
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('leaveRequests')}</h1>
          <p className="text-muted-foreground">
            {userRole === 'employee' ? t('myLeaveRequests') : t('teamLeaveRequests')}
          </p>
        </div>
        {userRole === 'employee' && (
          <Button onClick={() => setShowNewRequest(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('newRequest')}
          </Button>
        )}
      </div>

      {showNewRequest && (
        <Card>
          <CardHeader>
            <CardTitle>{t('newRequest')}</CardTitle>
            <CardDescription>{t('submitLeaveRequestDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('startDate')}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, getLocalizedDateFormat(language), { locale: getDateLocale(language) }) : t('selectDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('endDate')}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, getLocalizedDateFormat(language), { locale: getDateLocale(language) }) : t('selectDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('leaveType')}</label>
              <Select 
                value={selectedLeaveType} 
                onValueChange={setSelectedLeaveType}
              >
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
              <label className="text-sm font-medium">{t('reason')}</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('reasonPlaceholder')}
                rows={3}
              />
            </div>

            {startDate && endDate && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t('daysRequested')}: <strong>{calculateDays(startDate, endDate)}</strong>
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSubmitRequest}>{t('submit')}</Button>
              <Button variant="outline" onClick={() => setShowNewRequest(false)}>
                {t('cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Request Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('editRequest')}</DialogTitle>
            <DialogDescription>
              {t('editRequestDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('startDate')}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, getLocalizedDateFormat(language), { locale: getDateLocale(language) }) : t('selectDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('endDate')}</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, getLocalizedDateFormat(language), { locale: getDateLocale(language) }) : t('selectDate')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
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
              <label className="text-sm font-medium">{t('reason')}</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('reasonPlaceholder')}
                rows={3}
              />
            </div>

            {startDate && endDate && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t('daysRequested')}: <strong>{calculateDays(startDate, endDate)}</strong>
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleEditRequest}>{t('update')}</Button>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                {t('cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Advanced Filters */}
      <RequestFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        leaveTypeFilter={leaveTypeFilter}
        onLeaveTypeFilterChange={setLeaveTypeFilter}
        leaveTypes={leaveTypes}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              {userRole === 'employee' ? t('myLeaveRequests') : t('teamLeaveRequests')}
              <Badge variant="outline" className="ml-2">
                {filteredRequests.length} {filteredRequests.length === 1 ? t('request') : t('requests')}
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleExport}>
                <Download className="h-3 w-3" />
                {t('export')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden">
          {/* Mobile-friendly list (shows all fields) */}
          <div className="md:hidden divide-y">
            {filteredRequests.map((request) => (
              <div key={request.id} className="p-4">
                {userRole !== 'employee' && (
                  <div className="text-sm font-medium">
                    {request.profiles
                      ? `${request.profiles.first_name} ${request.profiles.last_name} (${request.profiles.employee_id})`
                       : t('unknown') }
                  </div>
                )}
                <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">{t('leaveType')}</div>
                  <div>{translateLeaveType(request.leave_types?.name || '') || t('unknown')}</div>

                  <div className="text-muted-foreground">{t('startDate')}</div>
                  <div>{format(new Date(request.start_date), getLocalizedDateFormat(language), { locale: getDateLocale(language) })}</div>

                  <div className="text-muted-foreground">{t('endDate')}</div>
                  <div>{format(new Date(request.end_date), getLocalizedDateFormat(language), { locale: getDateLocale(language) })}</div>

                  <div className="text-muted-foreground">{t('days')}</div>
                  <div>{request.days_requested}</div>

                  <div className="text-muted-foreground">{t('reason')}</div>
                  <div className="truncate">{request.reason}</div>

                  <div className="text-muted-foreground">{t('status')}</div>
                  <div>{getStatusBadge(request.status)}</div>
                </div>

                <div className="mt-3">
                  {/* Employee actions for their own pending requests */}
                  {userRole === 'employee' && request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(request)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        {t('edit')}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" className="flex items-center gap-1">
                            <Trash2 className="h-3 w-3" />
                            {t('delete')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('confirmDeleteLeave')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('confirmDeleteDescription')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteRequest(request.id)}>
                              {t('delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}

                  {/* Manager/HR Admin/Administrator actions */}
                  {(userRole === 'manager' || userRole === 'hr_admin' || userRole === 'administrator') && (
                    <>
                      {/* Senior Management Approval (for pending requests) */}
                      {userRole === 'manager' && request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleSeniorApproval(request.id, 'approved')} className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {t('seniorApprove')}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleSeniorApproval(request.id, 'rejected')} className="flex items-center gap-1">
                            <X className="h-3 w-3" />
                             {t('reject')}
                          </Button>
                        </div>
                      )}

                      {/* HR Admin Final Approval */}
                      {userRole === 'hr_admin' && (
                        <div className="flex gap-2">
                          {request.status === 'pending' && (
                            <>
                              <Button size="sm" onClick={() => handleFinalApproval(request.id, 'approved')} className="flex items-center gap-1">
                                <Crown className="h-3 w-3" />
                                {t('adminApprove')}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleFinalApproval(request.id, 'rejected')} className="flex items-center gap-1">
                                <X className="h-3 w-3" />
                                 {t('reject')}
                              </Button>
                            </>
                          )}
                          {request.status === 'senior_approved' && (
                            <>
                              <Button size="sm" onClick={() => handleFinalApproval(request.id, 'approved')} className="flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                {t('finalApprove')}
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleFinalApproval(request.id, 'rejected')} className="flex items-center gap-1">
                                <X className="h-3 w-3" />
                                 {t('reject')}
                              </Button>
                            </>
                          )}
                        </div>
                      )}

                      {/* Administrator can override at any stage */}
                      {userRole === 'administrator' && (
                        <div className="flex gap-2">
                          {(request.status === 'pending' || request.status === 'senior_approved') && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => handleFinalApproval(request.id, 'approved')}
                                className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
                              >
                                <Check className="h-3 w-3" />
                                Admin Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleFinalApproval(request.id, 'rejected')}
                                className="flex items-center gap-1"
                              >
                                <X className="h-3 w-3" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {filteredRequests.length === 0 && requests.length > 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('noMatchingRequests')}</p>
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                  {t('clearFilters')}
                </Button>
              </div>
            )}
            {requests.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">{t('noLeaveRequestsFound')}</div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto w-full">
            <Table className="w-full min-w-[1000px]">
              <TableHeader>
                <TableRow>
                  {userRole !== 'employee' && <TableHead className="min-w-[200px]">{t('employee')}</TableHead>}
                  <TableHead className="min-w-[140px]">{t('leaveType')}</TableHead>
                  <TableHead className="min-w-[120px]">{t('startDate')}</TableHead>
                  <TableHead className="min-w-[120px]">{t('endDate')}</TableHead>
                  <TableHead className="min-w-[80px]">{t('days')}</TableHead>
                  <TableHead className="min-w-[150px]">{t('reason')}</TableHead>
                  <TableHead className="min-w-[120px]">{t('status')}</TableHead>
                  <TableHead className="min-w-[200px]">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    {userRole !== 'employee' && (
                      <TableCell>
                        {request.profiles
                          ? `${request.profiles.first_name} ${request.profiles.last_name} (${request.profiles.employee_id})`
                          : t('unknown')}
                      </TableCell>
                    )}
                    <TableCell>{translateLeaveType(request.leave_types?.name || '') || t('unknown')}</TableCell>
                    <TableCell>{format(new Date(request.start_date), getLocalizedDateFormat(language), { locale: getDateLocale(language) })}</TableCell>
                    <TableCell>{format(new Date(request.end_date), getLocalizedDateFormat(language), { locale: getDateLocale(language) })}</TableCell>
                    <TableCell>{request.days_requested}</TableCell>
                    <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {/* Employee actions for their own pending requests */}
                      {userRole === 'employee' && request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(request)} className="flex items-center gap-1">
                            <Edit className="h-3 w-3" />
                            {t('edit')}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="flex items-center gap-1">
                                <Trash2 className="h-3 w-3" />
                                {t('delete')}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('confirmDeleteLeave')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete your leave request.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteRequest(request.id)}>
                                  {t('delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}

                      {/* Manager/HR Admin/Administrator actions */}
                      {(userRole === 'manager' || userRole === 'hr_admin' || userRole === 'administrator') && (
                        <>
                          {/* Senior Management Approval (for pending requests) */}
                          {userRole === 'manager' && request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSeniorApproval(request.id, 'approved')} className="flex items-center gap-1">
                                <Shield className="h-3 w-3" />
                                Senior Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleSeniorApproval(request.id, 'rejected')} className="flex items-center gap-1">
                                <X className="h-3 w-3" />
                                Reject
                              </Button>
                            </div>
                          )}

                          {/* HR Admin Final Approval */}
                          {userRole === 'hr_admin' && (
                            <div className="flex gap-2">
                              {request.status === 'pending' && (
                                <>
                                  <Button size="sm" onClick={() => handleFinalApproval(request.id, 'approved')} className="flex items-center gap-1">
                                    <Crown className="h-3 w-3" />
                                    Admin Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleFinalApproval(request.id, 'rejected')} className="flex items-center gap-1">
                                    <X className="h-3 w-3" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              {request.status === 'senior_approved' && (
                                <>
                                  <Button size="sm" onClick={() => handleFinalApproval(request.id, 'approved')} className="flex items-center gap-1">
                                    <Check className="h-3 w-3" />
                                    Final Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleFinalApproval(request.id, 'rejected')} className="flex items-center gap-1">
                                    <X className="h-3 w-3" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          )}

                          {/* Administrator can override at any stage */}
                          {userRole === 'administrator' && (
                            <div className="flex gap-2">
                              {(request.status === 'pending' || request.status === 'senior_approved') && (
                                <>
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleFinalApproval(request.id, 'approved')}
                                    className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
                                  >
                                    <Check className="h-3 w-3" />
                                    Admin Approve
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    onClick={() => handleFinalApproval(request.id, 'rejected')}
                                    className="flex items-center gap-1"
                                  >
                                    <X className="h-3 w-3" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}