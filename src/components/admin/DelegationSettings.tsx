import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Crown, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function DelegationSettings() {
  const { user, userRole } = useAuth();
  const [delegationActive, setDelegationActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [hrAdmins, setHrAdmins] = useState<Array<{id: string, user_id: string, first_name: string, last_name: string, email: string}>>([]);
  const [employees, setEmployees] = useState<Array<{id: string, user_id: string, first_name: string, last_name: string, email: string, employee_id: string}>>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  useEffect(() => {
    if (user && (userRole === 'hr_admin' || userRole === 'administrator')) {
      fetchDelegationSettings();
      if (userRole === 'administrator') {
        fetchHRAdmins();
        fetchEmployees();
      }
    }
  }, [user, userRole]);

  const fetchDelegationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'senior_management_delegation')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const settingValue = data.setting_value as { delegation_active?: boolean };
        setDelegationActive(settingValue?.delegation_active || false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch delegation settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDelegation = async () => {
    setUpdating(true);
    try {
      const newValue = !delegationActive;
      
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'senior_management_delegation',
          setting_value: { delegation_active: newValue },
          updated_by: user?.id
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      setDelegationActive(newValue);
      
      toast({
        title: "Success",
        description: `Delegation ${newValue ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update delegation settings",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  const fetchHRAdmins = async () => {
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'hr_admin');

      if (rolesError) throw rolesError;

      if (rolesData && rolesData.length > 0) {
        const userIds = rolesData.map(r => r.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, user_id, first_name, last_name, email')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;
        setHrAdmins(profilesData || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch HR admins",
        variant: "destructive"
      });
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'employee');

      if (rolesError) throw rolesError;

      if (rolesData && rolesData.length > 0) {
        const userIds = rolesData.map(r => r.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, user_id, first_name, last_name, email, employee_id')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;
        setEmployees(profilesData || []);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch employees",
        variant: "destructive"
      });
    }
  };

  const promoteToHRAdmin = async () => {
    if (!selectedEmployeeId) return;
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'hr_admin' })
        .eq('user_id', selectedEmployeeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee promoted to HR Admin successfully"
      });

      setSelectedEmployeeId('');
      fetchHRAdmins();
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to promote employee",
        variant: "destructive"
      });
    }
  };

  const demoteToEmployee = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'employee' })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "HR Admin demoted to Employee successfully"
      });

      fetchHRAdmins();
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to demote HR admin",
        variant: "destructive"
      });
    }
  };

  if (userRole !== 'hr_admin' && userRole !== 'administrator') {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold text-destructive mb-2">Access Denied</h3>
        <p className="text-muted-foreground">Only HR Admins and Administrators can manage delegation settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Delegation Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Senior Management Delegation</h3>
              <Badge variant={delegationActive ? "default" : "outline"}>
                {delegationActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              When enabled, Senior Management can execute final approvals for leave requests and allocations 
              without requiring Administrator confirmation.
            </p>
          </div>
          <Switch
            checked={delegationActive}
            onCheckedChange={handleToggleDelegation}
            disabled={updating}
          />
        </div>

        <div className="border-t pt-6">
          <h4 className="font-medium mb-4">Role Hierarchy & Permissions</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
              <Crown className="h-5 w-5 text-destructive" />
              <div>
                <div className="font-medium">Administrator / Company Owner</div>
                <div className="text-sm text-muted-foreground">
                  Highest authority with unrestricted access to all system modules and data
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
              <Shield className="h-5 w-5 text-secondary-foreground" />
              <div>
                <div className="font-medium">Senior Management (HR/GM)</div>
                <div className="text-sm text-muted-foreground">
                  First-line executor for employee processes, manages onboarding and approval workflows
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h5 className="font-medium mb-2">Two-Tier Approval System</h5>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Leave allocations require Senior Management approval first, then Administrator confirmation</li>
            <li>• Leave requests follow the same dual approval workflow</li>
            <li>• Administrator can delegate final approval rights to Senior Management</li>
            <li>• Administrator retains the right to review and override any decision</li>
          </ul>
        </div>
      </CardContent>
    </Card>

    {/* Role Management Section - Only for Administrator */}
    {userRole === 'administrator' && (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            HR Admin Role Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current HR Admins */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Current HR Administrators</h4>
            {hrAdmins.length === 0 ? (
              <p className="text-sm text-muted-foreground">No HR Admins assigned</p>
            ) : (
              <div className="space-y-2">
                {hrAdmins.map(admin => (
                  <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{admin.first_name} {admin.last_name}</p>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => demoteToEmployee(admin.user_id)}
                    >
                      Demote to Employee
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h4 className="text-sm font-semibold mb-3">Promote Employee to HR Admin</h4>
            <div className="flex gap-3">
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select an employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.user_id} value={emp.user_id}>
                      {emp.first_name} {emp.last_name} ({emp.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={promoteToHRAdmin}
                disabled={!selectedEmployeeId}
              >
                Promote to HR Admin
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )}
    </div>
  );
}