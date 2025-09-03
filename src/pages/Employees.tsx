import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, User, Mail, Phone, Calendar } from "lucide-react";

const Employees = () => {
  // Mock employee data - will be replaced with real data later
  const employees = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.johnson@company.com",
      phone: "+1 (555) 123-4567",
      department: "Marketing",
      position: "Senior Marketing Manager",
      joinDate: "2022-01-15",
      leaveBalance: {
        annual: 15,
        sick: 5,
        personal: 3,
      },
      status: "active",
    },
    {
      id: 2,
      name: "Mike Davis",
      email: "mike.davis@company.com",
      phone: "+1 (555) 234-5678",
      department: "Engineering",
      position: "Software Developer",
      joinDate: "2021-06-20",
      leaveBalance: {
        annual: 12,
        sick: 8,
        personal: 2,
      },
      status: "active",
    },
    {
      id: 3,
      name: "Lisa Chen",
      email: "lisa.chen@company.com",
      phone: "+1 (555) 345-6789",
      department: "HR",
      position: "HR Specialist",
      joinDate: "2023-03-10",
      leaveBalance: {
        annual: 20,
        sick: 3,
        personal: 4,
      },
      status: "active",
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Employees</h2>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search employees..." className="pl-8" />
          </div>
        </div>

        <div className="grid gap-4">
          {employees.map((employee) => (
            <Card key={employee.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{employee.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{employee.position}</p>
                      <p className="text-sm text-muted-foreground">{employee.department}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    {employee.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Contact</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{employee.email}</p>
                    <p className="text-sm text-muted-foreground">{employee.phone}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Join Date</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(employee.joinDate).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium mb-2">Leave Balance</p>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium">{employee.leaveBalance.annual}</p>
                        <p className="text-xs text-muted-foreground">Annual</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{employee.leaveBalance.sick}</p>
                        <p className="text-xs text-muted-foreground">Sick</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{employee.leaveBalance.personal}</p>
                        <p className="text-xs text-muted-foreground">Personal</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Employees;