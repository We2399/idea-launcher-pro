import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { toast } from '@/hooks/use-toast';

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
    approved: 'hsl(30, 40%, 40%)'  // Dark brown
  },
  'Vacation': {
    pending: 'hsl(200, 60%, 80%)', // Light blue
    approved: 'hsl(200, 60%, 40%)'  // Dark blue
  },
  'Maternity': {
    pending: 'hsl(340, 60%, 85%)', // Light pink
    approved: 'hsl(340, 60%, 45%)'  // Dark pink
  },
  'Paternity': {
    pending: 'hsl(270, 50%, 80%)', // Light purple
    approved: 'hsl(270, 50%, 40%)'  // Dark purple
  },
  'Others': {
    pending: 'hsl(0, 0%, 75%)',    // Light grey
    approved: 'hsl(0, 0%, 35%)'     // Dark grey
  }
};

export default function CalendarWithColors() {
  const { user, userRole } = useAuth();
  const { t } = useLanguage();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'my' | 'team' | 'all'>('my');
  const [loading, setLoading] = useState(true);

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
        .in('status', ['pending', 'approved'])
        .order('start_date');

      if (viewMode === 'my') {
        query = query.eq('user_id', user?.id);
      } else if (viewMode === 'team' && userRole === 'manager') {
        // For managers, show their team's requests
        query = query;
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
      ['pending', 'approved'].forEach(status => {
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
      ['pending', 'approved'].forEach(status => {
        const key = `${leaveType.toLowerCase().replace(/\s+/g, '_')}_${status}`;
        styles[key] = {
          backgroundColor: colors[status as 'pending' | 'approved'],
          color: status === 'approved' ? 'white' : 'black',
          borderRadius: '4px',
          fontWeight: 'bold'
        };
      });
    });

    return styles;
  };

  const getViewModeOptions = () => {
    const options = [{ value: 'my', label: 'My Leave' }];
    
    if (userRole === 'manager') {
      options.push({ value: 'team', label: 'Team Leave' });
    }
    
    if (userRole === 'hr_admin') {
      options.push(
        { value: 'team', label: 'Team Leave' },
        { value: 'all', label: 'All Leave' }
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
          <h1 className="text-3xl font-bold text-foreground">{t('leaveCalendar')}</h1>
          <p className="text-muted-foreground">View leave requests with color-coded status</p>
        </div>
        
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
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
                    <div className="font-medium">{t(leaveType.toLowerCase().replace(/\s+/g, ''))}</div>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: colors.pending }}
                        ></div>
                        <span>{t('pending')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: colors.approved }}
                        ></div>
                        <span>{t('approved')}</span>
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
              {selectedDate ? format(selectedDate, 'MMMM dd, yyyy') : 'Select a Date'}
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
                        borderLeftColor: leaveTypeColors[request.leave_types?.name as keyof typeof leaveTypeColors]?.[request.status as 'pending' | 'approved'] || 'hsl(var(--border))'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {viewMode === 'my' 
                            ? request.leave_types?.name || 'Unknown Type'
                            : request.profiles 
                              ? `${request.profiles.first_name} ${request.profiles.last_name}`
                              : 'Unknown Employee'
                          }
                        </span>
                        <Badge 
                          variant={request.status === 'approved' ? 'default' : 'outline'} 
                          className="text-xs"
                        >
                          {request.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(parseISO(request.start_date), 'MMM dd')} - {format(parseISO(request.end_date), 'MMM dd')}
                        <br />
                        {request.days_requested} day{request.days_requested !== 1 ? 's' : ''}
                        <br />
                        {request.leave_types?.name}
                      </div>
                      {viewMode !== 'my' && request.profiles && (
                        <div className="text-xs text-muted-foreground">
                          ID: {request.profiles.employee_id}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No leave requests for this date
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Click on a date to see leave details
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
                    borderLeftColor: leaveTypeColors[request.leave_types?.name as keyof typeof leaveTypeColors]?.[request.status as 'pending' | 'approved'] || 'hsl(var(--border))'
                  }}
                >
                  <div className="space-y-1">
                    <div className="font-medium text-sm">
                      {viewMode === 'my'
                        ? request.leave_types?.name || 'Unknown Type'
                        : request.profiles
                          ? `${request.profiles.first_name} ${request.profiles.last_name}`
                          : 'Unknown Employee'
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(parseISO(request.start_date), 'MMM dd')} - {format(parseISO(request.end_date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={request.status === 'approved' ? 'default' : 'outline'} 
                      className="text-xs mb-1"
                    >
                      {request.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {request.days_requested} day{request.days_requested !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            {requests.filter(request => parseISO(request.start_date) >= new Date()).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No upcoming leave requests
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}