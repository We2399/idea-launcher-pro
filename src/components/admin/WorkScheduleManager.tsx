import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Users, Clock, Save } from 'lucide-react';

interface WorkSchedule {
  id: string;
  user_id: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

interface Employee {
  user_id: string;
  first_name: string;
  last_name: string;
  employee_id: string;
}

export function WorkScheduleManager() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [currentSchedule, setCurrentSchedule] = useState<Partial<WorkSchedule>>({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployeesAndSchedules();
  }, []);

  const fetchEmployeesAndSchedules = async () => {
    try {
      const [employeesResult, schedulesResult] = await Promise.all([
        supabase.from('profiles').select('user_id, first_name, last_name, employee_id'),
        supabase.from('employee_work_schedules').select('*')
      ]);

      if (employeesResult.error) throw employeesResult.error;
      if (schedulesResult.error) throw schedulesResult.error;

      setEmployees(employeesResult.data || []);
      setSchedules(schedulesResult.data || []);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || 'Failed to fetch work schedules',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    const existingSchedule = schedules.find(s => s.user_id === employeeId);
    
    if (existingSchedule) {
      setCurrentSchedule(existingSchedule);
    } else {
      setCurrentSchedule({
        user_id: employeeId,
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      });
    }
  };

  const handleDayToggle = (day: keyof Omit<WorkSchedule, 'id' | 'user_id'>, value: boolean) => {
    setCurrentSchedule(prev => ({
      ...prev,
      [day]: value
    }));
  };

  const handleSaveSchedule = async () => {
    if (!selectedEmployee) return;

    try {
      const scheduleData = {
        user_id: selectedEmployee,
        monday: currentSchedule.monday,
        tuesday: currentSchedule.tuesday,
        wednesday: currentSchedule.wednesday,
        thursday: currentSchedule.thursday,
        friday: currentSchedule.friday,
        saturday: currentSchedule.saturday,
        sunday: currentSchedule.sunday,
      };

      const { error } = await supabase
        .from('employee_work_schedules')
        .upsert([scheduleData], { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: t('success'),
        description: 'Work schedule saved successfully'
      });

      fetchEmployeesAndSchedules();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || 'Failed to save work schedule',
        variant: "destructive"
      });
    }
  };

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Work Schedule Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Employee</label>
              <Select value={selectedEmployee} onValueChange={handleEmployeeSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(employee => (
                    <SelectItem key={employee.user_id} value={employee.user_id}>
                      {employee.first_name} {employee.last_name} ({employee.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEmployee && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Working Days</h3>
                <div className="grid grid-cols-2 gap-4">
                  {days.map(day => (
                    <div key={day.key} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{day.label}</span>
                      <Switch
                        checked={currentSchedule[day.key as keyof typeof currentSchedule] as boolean}
                        onCheckedChange={(checked) => handleDayToggle(day.key as keyof Omit<WorkSchedule, 'id' | 'user_id'>, checked)}
                      />
                    </div>
                  ))}
                </div>
                
                <Button onClick={handleSaveSchedule} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Work Schedule
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}