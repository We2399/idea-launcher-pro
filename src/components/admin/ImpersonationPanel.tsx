import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Employee {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
  employee_id: string | null;
}

interface ImpersonationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImpersonationPanel({ open, onOpenChange }: ImpersonationPanelProps) {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { startImpersonation } = useImpersonation();

  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, department, position, employee_id')
        .order('first_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employees',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const searchLower = searchQuery.toLowerCase();
    return (
      emp.first_name?.toLowerCase().includes(searchLower) ||
      emp.last_name?.toLowerCase().includes(searchLower) ||
      emp.email?.toLowerCase().includes(searchLower) ||
      emp.department?.toLowerCase().includes(searchLower) ||
      emp.position?.toLowerCase().includes(searchLower) ||
      emp.employee_id?.toLowerCase().includes(searchLower)
    );
  });

  const handleImpersonate = (employee: Employee) => {
    startImpersonation(employee.user_id);
    toast({
      title: 'Impersonation Started',
      description: `Now viewing as ${employee.first_name} ${employee.last_name}`
    });
    onOpenChange(false);
    navigate('/'); // Redirect to dashboard
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Impersonate User</SheetTitle>
          <SheetDescription>
            Select an employee to view the system as them. All actions will be logged.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Employee List */}
          <div className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading employees...</p>
            ) : filteredEmployees.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {searchQuery ? 'No employees found' : 'No employees available'}
              </p>
            ) : (
              filteredEmployees.map((employee) => (
                <div
                  key={employee.user_id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleImpersonate(employee)}
                >
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(employee.first_name, employee.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {employee.first_name} {employee.last_name}
                      </p>
                      {employee.employee_id && (
                        <Badge variant="outline" className="text-xs">
                          {employee.employee_id}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{employee.email}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {employee.position} • {employee.department}
                    </p>
                  </div>

                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
