import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslationHelpers } from '@/lib/translations';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { CreateLeaveDialog } from '@/components/calendar/CreateLeaveDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Link } from 'react-router-dom';

interface LeaveRequest {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  days_requested: number;
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

const leaveTypeColors = {
  'Sick Leave': {
    pending: 'hsl(30, 40%, 80%)', // Light brown
    approved: 'hsl(30, 40%, 40%)', // Dark brown
    senior_approved: 'hsl(30, 50%, 25%)'  // Darker brown
  },
  'Vacation': {
    pending: 'hsl(200, 60%, 80%)', // Light blue
    approved: 'hsl(200, 60%, 40%)', // Dark blue
    senior_approved: 'hsl(200, 70%, 25%)'  // Darker blue
  },
  'Maternity': {
    pending: 'hsl(340, 60%, 85%)', // Light pink
    approved: 'hsl(340, 60%, 45%)', // Dark pink
    senior_approved: 'hsl(340, 70%, 30%)'  // Darker pink
  },
  'Paternity': {
    pending: 'hsl(270, 50%, 80%)', // Light purple
    approved: 'hsl(270, 50%, 40%)', // Dark purple
    senior_approved: 'hsl(270, 60%, 30%)'  // Darker purple
  },
  'Others': {
    pending: 'hsl(0, 0%, 75%)',    // Light grey
    approved: 'hsl(0, 0%, 35%)',   // Dark grey
    senior_approved: 'hsl(0, 0%, 20%)'  // Darker grey
  }
};

export default function CalendarPage() {
  const { user, userRole } = useAuth();
  const { t } = useLanguage();
  const { translateLeaveType, translateStatus } = useTranslationHelpers();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'my' | 'team' | 'all'>('my');
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user, userRole, viewMode]);

  const fetchRequests = async () => {
    try {
      let query = supabase
        .from('leave_requests')
        .select('*')
        .in('status', userRole === 'employee' ? ['approved', 'senior_approved'] : ['pending', 'approved', 'senior_approved'])
        .order('start_date');

      if (viewMode === 'my') {
        query = query.eq('user_id', user?.id);
      } else if (viewMode === 'team' && (userRole === 'manager' || userRole === 'hr_admin')) {
        // For managers/HR, show their team's requests by joining with profiles
        const { data: teamProfiles } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('manager_id', user?.id);
        
        if (teamProfiles && teamProfiles.length > 0) {
          const teamUserIds = teamProfiles.map(p => p.user_id);
          query = query.in('user_id', teamUserIds);
        } else {
          // No team members found, return empty result
          query = query.eq('user_id', 'no-match');
        }
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
        description: error.message || "Failed to fetch calendar data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRequestsForDate = (date: Date) => {
    return requests.filter(request => {
      const startDate = parseISO(request.start_date);
      const endDate = parseISO(request.end_date);
      return isWithinInterval(date, { start: startDate, end: endDate });
    });
  };

  const getSelectedDateRequests = () => {
    if (!selectedDate) return [];
    return getRequestsForDate(selectedDate);
  };

  const getDayModifiers = () => {
    const modifiers: any = {};
    
    // Create modifiers for each leave type and status
    Object.keys(leaveTypeColors).forEach(leaveType => {
      ['pending', 'approved', 'senior_approved'].forEach(status => {
        const key = `${leaveType.toLowerCase().replace(/\s+/g, '_')}_${status}`;
        modifiers[key] = (date: Date) => {
          const dayRequests = getRequestsForDate(date);
          return dayRequests.some(req => 
            req.leave_types?.name === leaveType && req.status === status
          );
        };
      });
    });

    return modifiers;
  };

  const getDayModifiersStyles = () => {
    const styles: any = {};
    
    Object.entries(leaveTypeColors).forEach(([leaveType, colors]) => {
      ['pending', 'approved', 'senior_approved'].forEach(status => {
        const key = `${leaveType.toLowerCase().replace(/\s+/g, '_')}_${status}`;
        styles[key] = {
          backgroundColor: colors[status as 'pending' | 'approved' | 'senior_approved'],
          color: (status === 'approved' || status === 'senior_approved') ? 'white' : 'black',
          borderRadius: '4px',
          fontWeight: 'bold'
        };
      });
    });

    return styles;
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
        description: 'Leave request deleted successfully'
      });

      fetchRequests();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || 'Failed to delete leave request',
        variant: "destructive"
      });
    }
  };

  const getViewModeOptions = () => {
    const options = [{ value: 'my', label: t('myLeave') }];
    
    if (userRole === 'manager') {
      options.push({ value: 'team', label: t('teamLeave') });
    }
    
    if (userRole === 'hr_admin') {
      options.push(
        { value: 'team', label: t('teamLeave') },
        { value: 'all', label: t('allLeave') }
      );
    }
    
    return options;
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
          <h1 className="text-3xl font-bold text-foreground">{t('calendar')}</h1>
          <p className="text-muted-foreground">{t('leaveCalendarDescription')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {userRole === 'hr_admin' && (
            <Link to="/settings">
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t('leaveAllocationManagement')}
              </Button>
            </Link>
          )}
          <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('createLeaveRequest')}
          </Button>

          <Select value={viewMode} onValueChange={(value: 'my' | 'team' | 'all') => setViewMode(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getViewModeOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('calendarView')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={getDayModifiers()}
              modifiersStyles={getDayModifiersStyles()}
              className="rounded-md border"
            />
            
            {/* Color Legend */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3">{t('colorLegend')}</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(leaveTypeColors).map(([leaveType, colors]) => (
                  <div key={leaveType} className="space-y-1">
                    <div className="font-medium">{translateLeaveType(leaveType)}</div>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: colors.pending }}
                        ></div>
                        <span>{translateStatus('pending')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: colors.approved }}
                        ></div>
                        <span>{translateStatus('approved')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : t('selectDate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <div className="space-y-4">
                {getSelectedDateRequests().length > 0 ? (
                  getSelectedDateRequests().map((request) => (
                    <div 
                      key={request.id} 
                      className="p-3 border border-border rounded-lg space-y-2"
                      style={{
                        borderLeftWidth: '4px',
                        borderLeftColor: leaveTypeColors[request.leave_types?.name as keyof typeof leaveTypeColors]?.[request.status as 'pending' | 'approved' | 'senior_approved'] || 'hsl(var(--border))'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {viewMode === 'my' 
                            ? (request.leave_types?.name ? translateLeaveType(request.leave_types.name) : t('unknownType'))
                            : request.profiles 
                              ? `${request.profiles.first_name} ${request.profiles.last_name}`
                              : t('unknownEmployee')
                          }
                        </span>
                        <Badge 
                          variant={
                            request.status === 'approved' || request.status === 'senior_approved' 
                              ? 'default' 
                              : 'outline'
                          } 
                          className="text-xs"
                        >
                          {translateStatus(request.status)}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(parseISO(request.start_date), 'MMM dd')} - {format(parseISO(request.end_date), 'MMM dd')}
                        <br />
                        {request.days_requested} {request.days_requested !== 1 ? t('days') : t('day')}
                        <br />
                        {request.leave_types?.name ? translateLeaveType(request.leave_types.name) : t('unknownType')}
                      </div>
                      {viewMode !== 'my' && request.profiles && (
                        <div className="text-xs text-muted-foreground">
                          ID: {request.profiles.employee_id}
                        </div>
                      )}
                      
                      {/* Edit/Delete actions for user's own pending requests */}
                      {viewMode === 'my' && request.status === 'pending' && request.user_id === user?.id && (
                        <div className="flex gap-1 mt-2">
                          <Button size="sm" variant="outline" className="h-6 text-xs">
                            <Edit className="h-3 w-3 mr-1" />
                            {t('edit')}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="h-6 text-xs">
                                <Trash2 className="h-3 w-3 mr-1" />
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
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {t('noLeaveRequestsForDate')}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {t('clickDateToSeeDetails')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('upcomingLeave')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requests
              .filter(request => parseISO(request.start_date) >= new Date())
              .slice(0, 5)
              .map((request) => (
                <div 
                  key={request.id} 
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: leaveTypeColors[request.leave_types?.name as keyof typeof leaveTypeColors]?.[request.status as 'pending' | 'approved' | 'senior_approved'] || 'hsl(var(--border))'
                  }}
                >
                  <div className="space-y-1">
                    <div className="font-medium text-sm">
                      {viewMode === 'my'
                        ? (request.leave_types?.name ? translateLeaveType(request.leave_types.name) : t('unknownType'))
                        : request.profiles
                          ? `${request.profiles.first_name} ${request.profiles.last_name}`
                          : t('unknownEmployee')
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(parseISO(request.start_date), 'MMM dd')} - {format(parseISO(request.end_date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        request.status === 'approved' || request.status === 'senior_approved' 
                          ? 'default' 
                          : 'outline'
                      } 
                      className="text-xs mb-1"
                    >
                      {translateStatus(request.status)}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {request.days_requested} {request.days_requested !== 1 ? t('days') : t('day')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {request.leave_types?.name ? translateLeaveType(request.leave_types.name) : t('unknownType')}
                    </div>
                  </div>
                </div>
              ))}
            {requests.filter(request => parseISO(request.start_date) >= new Date()).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {t('upcomingLeaveEmpty')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CreateLeaveDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        selectedDate={selectedDate}
        onSuccess={fetchRequests}
      />
    </div>
  );
}