import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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

export default function CalendarPage() {
  const { user, userRole } = useAuth();
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
        .select(`
          id,
          start_date,
          end_date,
          status,
          days_requested,
          user_id,
          profiles!inner(first_name, last_name, employee_id),
          leave_types!inner(name)
        `)
        .eq('status', 'approved')
        .order('start_date');

      if (viewMode === 'my') {
        query = query.eq('user_id', user?.id);
      } else if (viewMode === 'team' && userRole === 'manager') {
        // For managers, show their team's requests
        // Note: This would need proper team relationship setup
        query = query;
      }

      const { data, error } = await query;
      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch calendar data",
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
    const modifiers = {
      hasLeave: (date: Date) => getRequestsForDate(date).length > 0
    };
    return modifiers;
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
          <h1 className="text-3xl font-bold text-foreground">Leave Calendar</h1>
          <p className="text-muted-foreground">View approved leave requests in calendar format</p>
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
              modifiersStyles={{
                hasLeave: { 
                  backgroundColor: 'hsl(var(--primary))', 
                  color: 'hsl(var(--primary-foreground))',
                  borderRadius: '4px'
                }
              }}
              className="rounded-md border"
            />
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary rounded"></div>
                <span>Days with approved leave</span>
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
                    <div key={request.id} className="p-3 border border-border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {viewMode === 'my' 
                            ? request.leave_types?.name || 'Unknown Type'
                            : request.profiles 
                              ? `${request.profiles.first_name} ${request.profiles.last_name}`
                              : 'Unknown Employee'
                          }
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {request.leave_types?.name}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(parseISO(request.start_date), 'MMM dd')} - {format(parseISO(request.end_date), 'MMM dd')}
                        <br />
                        {request.days_requested} day{request.days_requested !== 1 ? 's' : ''}
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
                    No approved leave requests for this date
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
          <CardTitle>Upcoming Leave</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {requests
              .filter(request => parseISO(request.start_date) >= new Date())
              .slice(0, 5)
              .map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
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
                    <Badge variant="outline" className="text-xs mb-1">
                      {request.leave_types?.name}
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