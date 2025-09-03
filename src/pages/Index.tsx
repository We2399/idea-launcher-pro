import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, Clock, FileText } from "lucide-react";

const Index = () => {
  // Mock stats - will be replaced with real data later
  const stats = [
    {
      title: "Pending Requests",
      value: "12",
      description: "Awaiting approval",
      icon: Clock,
    },
    {
      title: "Total Employees",
      value: "48",
      description: "Active staff members",
      icon: Users,
    },
    {
      title: "This Month",
      value: "24",
      description: "Leave days taken",
      icon: CalendarDays,
    },
    {
      title: "Reports",
      value: "8",
      description: "Generated this week",
      icon: FileText,
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Leave Requests</CardTitle>
              <CardDescription>Latest applications from your team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">John Smith</p>
                    <p className="text-sm text-muted-foreground">Annual Leave - 5 days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Mar 15-19, 2024</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Sarah Johnson</p>
                    <p className="text-sm text-muted-foreground">Sick Leave - 2 days</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Mar 12-13, 2024</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Approved
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <button className="w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors">
                <p className="font-medium">Submit Leave Request</p>
                <p className="text-sm text-muted-foreground">Apply for time off</p>
              </button>
              <button className="w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors">
                <p className="font-medium">View Team Calendar</p>
                <p className="text-sm text-muted-foreground">See who's out when</p>
              </button>
              <button className="w-full text-left p-3 border rounded-lg hover:bg-accent transition-colors">
                <p className="font-medium">Generate Report</p>
                <p className="text-sm text-muted-foreground">Download leave summary</p>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
