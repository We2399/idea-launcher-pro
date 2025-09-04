import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Search, Filter, UserCheck, UserX, Crown, Shield, User } from 'lucide-react';
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
  const { userRole } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, departmentFilter, roleFilter]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          employee_id,
          first_name,
          last_name,
          email,
          department,
          position,
          manager_id,
          created_at,
          user_roles!user_id(role),
          manager:profiles!manager_id(first_name, last_name),
          leave_balances(
            total_days,
            used_days,
            remaining_days,
            leave_types!leave_type_id(name)
          )
        `)
        .order('first_name');

        // Handle potential query errors gracefully
        const processedData = data?.map(emp => ({
          ...emp,
          user_roles: Array.isArray(emp.user_roles) ? emp.user_roles : null,
          manager: emp.manager && typeof emp.manager === 'object' ? emp.manager : null,
          leave_balances: Array.isArray(emp.leave_balances) ? emp.leave_balances : []
        })) || [];
        
        setEmployees(processedData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch employees",
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
      case 'hr_admin': return Crown;
      case 'manager': return Shield;
      default: return User;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'hr_admin': return 'destructive';
      case 'manager': return 'secondary';
      default: return 'outline';
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground">Manage your team members and their information</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {filteredEmployees.length} Employee{filteredEmployees.length !== 1 ? 's' : ''}
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
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="hr_admin">HR Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Leave Balance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => {
                const role = employee.user_roles?.[0]?.role || 'employee';
                const RoleIcon = getRoleIcon(role);
                
                return (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {employee.first_name} {employee.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {employee.employee_id} • {employee.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleColor(role)} className="flex items-center gap-1 w-fit">
                        <RoleIcon className="h-3 w-3" />
                        {role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {employee.manager ? 
                        `${employee.manager.first_name} ${employee.manager.last_name}` : 
                        'No Manager'
                      }
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{getTotalLeaveBalance(employee)}</span> days
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedEmployee(employee)}
                          >
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Employee Details</DialogTitle>
                          </DialogHeader>
                          {selectedEmployee && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                                  <p className="text-sm">{selectedEmployee.first_name} {selectedEmployee.last_name}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Employee ID</label>
                                  <p className="text-sm">{selectedEmployee.employee_id}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                                  <p className="text-sm">{selectedEmployee.email}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                                  <p className="text-sm">{selectedEmployee.department}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Position</label>
                                  <p className="text-sm">{selectedEmployee.position}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground">Role</label>
                                  <Badge variant={getRoleColor(selectedEmployee.user_roles?.[0]?.role || 'employee')}>
                                    {selectedEmployee.user_roles?.[0]?.role || 'employee'}
                                  </Badge>
                                </div>
                              </div>

                              {selectedEmployee.leave_balances && selectedEmployee.leave_balances.length > 0 && (
                                <div>
                                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Leave Balances</label>
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredEmployees.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No employees found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}