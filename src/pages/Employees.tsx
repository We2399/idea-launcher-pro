import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { InviteEmployeeDialog } from '@/components/admin/InviteEmployeeDialog';
import { useOrganization } from '@/hooks/useOrganization';
import { Users, Search, Filter, UserCheck, UserX, Crown, Shield, User, UserPlus, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
interface Employee {
  id: string;
  user_id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
  manager_id?: string;
  created_at: string;
  // Extended profile fields
  phone_number?: string;
  date_of_birth?: string;
  id_number?: string;
  passport_number?: string;
  visa_number?: string;
  home_address?: string;
  marital_status?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  base_monthly_salary?: number;
  salary_currency?: string;
  cash_balance?: number;
  user_roles?: {
    role: string;
  }[] | null;
  manager?: {
    first_name: string;
    last_name: string;
  };
  leave_balances?: {
    total_days: number;
    used_days: number;
    remaining_days: number;
    leave_types: {
      name: string;
    };
  }[];
}

export default function Employees() {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { t } = useLanguage();
  const { organization, isOwner, canAddMoreEmployees, refetch: refetchOrg } = useOrganization();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const handleViewProfile = (userId: string) => {
    navigate(`/profile?user=${userId}`);
  };
  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, departmentFilter, roleFilter]);

  const fetchEmployees = async () => {
    try {
      const { data: employeesData, error: employeesError } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name');

      if (employeesError) throw employeesError;

      if (employeesData && employeesData.length > 0) {
        const userIds = employeesData.map(emp => emp.user_id);

        // Fetch related data
        const [rolesResult, balancesResult] = await Promise.all([
          supabase.from('user_roles').select('*').in('user_id', userIds),
          supabase.from('leave_balances').select('*').in('user_id', userIds)
        ]);

        const rolesMap = new Map();
        rolesResult.data?.forEach(role => {
          if (!rolesMap.has(role.user_id)) {
            rolesMap.set(role.user_id, []);
          }
          rolesMap.get(role.user_id).push(role);
        });

        const balancesMap = new Map();
        if (balancesResult.data && balancesResult.data.length > 0) {
          const leaveTypeIds = [...new Set(balancesResult.data.map(b => b.leave_type_id))];
          const { data: leaveTypesData } = await supabase
            .from('leave_types')
            .select('*')
            .in('id', leaveTypeIds);

          const leaveTypesMap = new Map(leaveTypesData?.map(lt => [lt.id, lt]) || []);

          balancesResult.data.forEach(balance => {
            if (!balancesMap.has(balance.user_id)) {
              balancesMap.set(balance.user_id, []);
            }
            balancesMap.get(balance.user_id).push({
              ...balance,
              leave_types: leaveTypesMap.get(balance.leave_type_id) || { name: 'Unknown' }
            });
          });
        }

        const processedData = employeesData.map(emp => ({
          ...emp,
          user_roles: rolesMap.get(emp.user_id) || [],
          manager: null,
          leave_balances: balancesMap.get(emp.user_id) || []
        }));

        setEmployees(processedData);
      } else {
        setEmployees([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch employees",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = [...employees];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(emp =>
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(emp => 
        emp.user_roles?.some(role => role.role === roleFilter)
      );
    }

    setFilteredEmployees(filtered);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'administrator': return Crown;
      case 'hr_admin': return Shield;
      default: return User;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'administrator': return 'destructive';
      case 'hr_admin': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'administrator': return 'Administrator';
      case 'hr_admin': return 'HR Admin';
      case 'employee': return 'Employee';
      default: return role;
    }
  };

  const getUniqueDepartments = () => {
    const departments = [...new Set(employees.map(emp => emp.department))];
    return departments.sort();
  };

  const getTotalLeaveBalance = (employee: Employee) => {
    if (!employee.leave_balances || employee.leave_balances.length === 0) return 0;
    return employee.leave_balances.reduce((total, balance) => total + balance.remaining_days, 0);
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
    <div className="safe-area-screen space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('teamManagement')}</h1>
          <p className="text-muted-foreground">{t('manageTeamMembers')}</p>
        </div>
        <div className="flex items-center gap-2">
          {(isOwner || userRole === 'administrator' || userRole === 'hr_admin') && (
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  {t('inviteEmployee')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t('inviteEmployee')}</DialogTitle>
                </DialogHeader>
                <InviteEmployeeDialog 
                  onInviteSent={() => {
                    refetchOrg();
                    setShowInviteDialog(false);
                  }} 
                />
              </DialogContent>
            </Dialog>
          )}
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {filteredEmployees.length} {t('employeesCount')}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {getUniqueDepartments().map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="hr_admin">HR Admin</SelectItem>
                  <SelectItem value="administrator">Administrator</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee Directory - Mobile cards */}
      <div className="space-y-4">
        {filteredEmployees.map((employee) => {
          const role = employee.user_roles?.[0]?.role || 'employee';
          const RoleIcon = getRoleIcon(role);
          return (
            <Card key={employee.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <div>
                    <div className="font-semibold">{employee.first_name} {employee.last_name}</div>
                    <div className="text-xs text-muted-foreground">{employee.employee_id} • {employee.email}</div>
                  </div>
                  <Badge variant={getRoleColor(role)} className="flex items-center gap-1">
                    <RoleIcon className="h-3 w-3" />
                    {getRoleDisplayName(role)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Department</div>
                    <div className="font-medium">{employee.department}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Position</div>
                    <div className="font-medium">{employee.position}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground">Leave Balance</div>
                    <div className="font-medium">{getTotalLeaveBalance(employee)} days</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="default" 
                    className="flex-1 flex items-center gap-1"
                    onClick={() => handleViewProfile(employee.user_id)}
                  >
                    <Eye className="h-3 w-3" />
                    {t('viewProfile') || 'View Profile'}
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedEmployee(employee)}>
                        {t('viewDetails') || 'View Details'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Employee Details</DialogTitle>
                    </DialogHeader>
                    {selectedEmployee && (
                      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                        {/* Basic Information */}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-3 border-b pb-2">Basic Information</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                              <p className="text-sm">{selectedEmployee.first_name} {selectedEmployee.last_name}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Employee ID</label>
                              <p className="text-sm">{selectedEmployee.employee_id || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Email</label>
                              <p className="text-sm">{selectedEmployee.email || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                              <p className="text-sm">{selectedEmployee.phone_number || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                              <p className="text-sm">{selectedEmployee.date_of_birth || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Marital Status</label>
                              <p className="text-sm capitalize">{selectedEmployee.marital_status || '-'}</p>
                            </div>
                            <div className="col-span-2">
                              <label className="text-sm font-medium text-muted-foreground">Home Address</label>
                              <p className="text-sm">{selectedEmployee.home_address || '-'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Employment Details */}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-3 border-b pb-2">Employment Details</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Department</label>
                              <p className="text-sm">{selectedEmployee.department || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Position</label>
                              <p className="text-sm">{selectedEmployee.position || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Role</label>
                              <Badge variant={getRoleColor(selectedEmployee.user_roles?.[0]?.role || 'employee')}>
                                {getRoleDisplayName(selectedEmployee.user_roles?.[0]?.role || 'employee')}
                              </Badge>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Base Monthly Salary</label>
                              <p className="text-sm">
                                {selectedEmployee.base_monthly_salary 
                                  ? `${selectedEmployee.salary_currency || 'USD'} ${selectedEmployee.base_monthly_salary.toLocaleString()}`
                                  : '-'}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Cash Balance</label>
                              <p className="text-sm">
                                {selectedEmployee.cash_balance !== undefined && selectedEmployee.cash_balance !== null
                                  ? `${selectedEmployee.salary_currency || 'USD'} ${selectedEmployee.cash_balance.toLocaleString()}`
                                  : '-'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Identity Documents */}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-3 border-b pb-2">Identity Documents</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">ID Number</label>
                              <p className="text-sm">{selectedEmployee.id_number || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Passport Number</label>
                              <p className="text-sm">{selectedEmployee.passport_number || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Visa Number</label>
                              <p className="text-sm">{selectedEmployee.visa_number || '-'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Emergency Contact */}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-3 border-b pb-2">Emergency Contact</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Contact Name</label>
                              <p className="text-sm">{selectedEmployee.emergency_contact_name || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Contact Phone</label>
                              <p className="text-sm">{selectedEmployee.emergency_contact_phone || '-'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Leave Balances */}
                        {selectedEmployee.leave_balances && selectedEmployee.leave_balances.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-3 border-b pb-2">Leave Balances</h4>
                            <div className="space-y-2">
                              {selectedEmployee.leave_balances.map((balance, index) => (
                                <div key={index} className="flex justify-between items-center p-2 border border-border rounded">
                                  <span className="text-sm">{balance.leave_types.name}</span>
                                  <div className="text-sm">
                                    <span className="font-medium">{balance.remaining_days}</span> / {balance.total_days} days
                                    <span className="text-muted-foreground ml-2">({balance.used_days} used)</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filteredEmployees.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">No employees found</CardContent>
          </Card>
        )}
      </div>

      {/* Desktop table removed for unified mobile card layout on mobile and tablet */}
    </div>
  );
}