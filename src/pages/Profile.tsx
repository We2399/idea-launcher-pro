import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, Calendar, MapPin, Edit } from "lucide-react";

const Profile = () => {
  // Mock user data - will be replaced with real data later
  const user = {
    name: "John Manager",
    email: "john.manager@company.com",
    phone: "+1 (555) 123-4567",
    department: "Management",
    position: "Department Manager",
    employeeId: "EMP001",
    joinDate: "2020-01-15",
    location: "New York Office",
    manager: "Sarah Director",
    leaveBalance: {
      annual: 18,
      sick: 7,
      personal: 4,
    },
  };

  const leaveHistory = [
    {
      id: 1,
      type: "Annual Leave",
      startDate: "2024-02-10",
      endDate: "2024-02-16",
      days: 5,
      status: "approved",
    },
    {
      id: 2,
      type: "Sick Leave",
      startDate: "2024-01-22",
      endDate: "2024-01-23",
      days: 2,
      status: "approved",
    },
    {
      id: 3,
      type: "Personal Leave",
      startDate: "2023-12-24",
      endDate: "2023-12-24",
      days: 1,
      status: "approved",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your basic profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={user.name} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user.email} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={user.phone} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee ID</Label>
                    <Input id="employeeId" value={user.employeeId} readOnly />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
                <CardDescription>Your role and department information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input id="position" value={user.position} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" value={user.department} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manager">Manager</Label>
                    <Input id="manager" value={user.manager} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="joinDate">Join Date</Label>
                    <Input id="joinDate" value={new Date(user.joinDate).toLocaleDateString()} readOnly />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leave History</CardTitle>
                <CardDescription>Your recent leave requests and approvals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaveHistory.map((leave) => (
                    <div key={leave.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{leave.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {leave.startDate} to {leave.endDate} ({leave.days} day{leave.days > 1 ? 's' : ''})
                        </p>
                      </div>
                      {getStatusBadge(leave.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Leave Balance</CardTitle>
                <CardDescription>Your remaining leave days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{user.leaveBalance.annual}</p>
                    <p className="text-sm text-muted-foreground">Annual Leave</p>
                  </div>
                  <div className="text-center p-4 bg-secondary/50 rounded-lg">
                    <p className="text-2xl font-bold">{user.leaveBalance.sick}</p>
                    <p className="text-sm text-muted-foreground">Sick Leave</p>
                  </div>
                  <div className="text-center p-4 bg-accent/50 rounded-lg">
                    <p className="text-2xl font-bold">{user.leaveBalance.personal}</p>
                    <p className="text-sm text-muted-foreground">Personal Leave</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline">
                  Request Leave
                </Button>
                <Button className="w-full" variant="outline">
                  View Calendar
                </Button>
                <Button className="w-full" variant="outline">
                  Download Leave Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;