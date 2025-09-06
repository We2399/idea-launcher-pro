import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { RequestFilters } from '@/components/requests/RequestFilters';
import { Plus, CalendarIcon, Check, X, Clock, Download, Filter, Shield, Crown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

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
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [showNewRequest, setShowNewRequest] = useState(false);
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
    if (user) {
      fetchRequests();
      fetchLeaveTypes();
    }
  }, [user, userRole]);

  const fetchRequests = async () => {
    try {
      let query = supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (userRole === 'employee') {
        query = query.eq('user_id', user?.id);
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
        title: "Error",
        description: error.message || "Failed to fetch leave requests",
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
        title: "Error",
        description: error.message || "Failed to fetch leave types",
        variant: "destructive"
      });
    }
  };

  const calculateDays = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmitRequest = async () => {
    if (!startDate || !endDate || !selectedLeaveType || !reason.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const daysRequested = calculateDays(startDate, endDate);
      
      const { error } = await supabase
        .from('leave_requests')
        .insert({
          user_id: user?.id,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          days_requested: daysRequested,
          leave_type_id: selectedLeaveType,
          reason: reason,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Leave request submitted successfully"
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
        title: "Error",
        description: error.message || "Failed to submit leave request",
        variant: "destructive"
      });
    }
  };

  const handleSeniorApproval = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const updateData = userRole === 'manager' ? {
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
        title: "Success",
        description: `Request ${status} ${userRole === 'manager' ? 'by Senior Management' : 'by Administrator'}`
      });
      
      fetchRequests();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${status} request`,
        variant: "destructive"
      });
    }
  };

  const handleFinalApproval = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ 
          status,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          administrator_approved_by: user?.id,
          administrator_approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Request ${status} by Administrator`
      });
      
      fetchRequests();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${status} request`,
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
      pending: 'Pending',
      senior_approved: 'Senior Approved',
      approved: 'Approved',
      rejected: 'Rejected'
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
      ['Employee', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status'].join(','),
      ...filteredRequests.map(request => [
        `"${request.profiles ? `${request.profiles.first_name} ${request.profiles.last_name} (${request.profiles.employee_id})` : 'Unknown Employee'}"`,
        `"${request.leave_types?.name || 'Unknown'}"`,
        `"${format(new Date(request.start_date), 'MMM dd, yyyy')}"`,
        `"${format(new Date(request.end_date), 'MMM dd, yyyy')}"`,
        request.days_requested,
        `"${request.reason}"`,
        `"${request.status}"`
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
      title: "Success",
      description: "Leave requests exported successfully"
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
          <h1 className="text-3xl font-bold text-foreground">Leave Requests</h1>
          <p className="text-muted-foreground">
            {userRole === 'employee' ? 'Manage your leave requests' : 'Review and approve team leave requests'}
          </p>
        </div>
        {userRole === 'employee' && (
          <Button onClick={() => setShowNewRequest(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        )}
      </div>

      {showNewRequest && (
        <Card>
          <CardHeader>
            <CardTitle>New Leave Request</CardTitle>
            <CardDescription>Submit a new leave request for approval</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
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
                <label className="text-sm font-medium">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
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
              <label className="text-sm font-medium">Leave Type</label>
              <Select value={selectedLeaveType} onValueChange={setSelectedLeaveType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} (Max: {type.max_days_per_year} days/year)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for your leave request"
                rows={3}
              />
            </div>

            {startDate && endDate && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Total days requested: <strong>{calculateDays(startDate, endDate)}</strong>
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSubmitRequest}>Submit Request</Button>
              <Button variant="outline" onClick={() => setShowNewRequest(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
              {userRole === 'employee' ? 'My Leave Requests' : 'Team Leave Requests'}
              <Badge variant="outline" className="ml-2">
                {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'}
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleExport}>
                <Download className="h-3 w-3" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {userRole !== 'employee' && <TableHead>Employee</TableHead>}
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                {(userRole === 'manager' || userRole === 'hr_admin') && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  {userRole !== 'employee' && (
                    <TableCell>
                      {request.profiles ? 
                        `${request.profiles.first_name} ${request.profiles.last_name} (${request.profiles.employee_id})` : 
                        'Unknown Employee'
                      }
                    </TableCell>
                  )}
                  <TableCell>{request.leave_types?.name || 'Unknown'}</TableCell>
                  <TableCell>{format(new Date(request.start_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{format(new Date(request.end_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{request.days_requested}</TableCell>
                  <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  {(userRole === 'manager' || userRole === 'hr_admin') && (
                    <TableCell>
                      {/* Senior Management Approval (for pending requests) */}
                      {userRole === 'manager' && request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSeniorApproval(request.id, 'approved')}
                            className="flex items-center gap-1"
                          >
                            <Shield className="h-3 w-3" />
                            Senior Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleSeniorApproval(request.id, 'rejected')}
                            className="flex items-center gap-1"
                          >
                            <X className="h-3 w-3" />
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      {/* Administrator Final Approval */}
                      {userRole === 'hr_admin' && (
                        <div className="flex gap-2">
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleSeniorApproval(request.id, 'approved')}
                                className="flex items-center gap-1"
                              >
                                <Crown className="h-3 w-3" />
                                Admin Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleSeniorApproval(request.id, 'rejected')}
                                className="flex items-center gap-1"
                              >
                                <X className="h-3 w-3" />
                                Reject
                              </Button>
                            </>
                          )}
                          {request.status === 'senior_approved' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleFinalApproval(request.id, 'approved')}
                                className="flex items-center gap-1"
                              >
                                <Check className="h-3 w-3" />
                                Final Approve
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
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredRequests.length === 0 && requests.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No requests match your current filters</p>
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2">
                Clear Filters
              </Button>
            </div>
          )}
          {requests.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No leave requests found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}