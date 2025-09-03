import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, BarChart, Calendar, TrendingUp } from "lucide-react";

const Reports = () => {
  const reportTypes = [
    {
      title: "Leave Summary Report",
      description: "Overview of all leave taken by employees",
      icon: FileText,
      lastGenerated: "2024-03-01",
    },
    {
      title: "Department Analysis",
      description: "Leave patterns by department",
      icon: BarChart,
      lastGenerated: "2024-02-28",
    },
    {
      title: "Monthly Calendar",
      description: "Visual calendar showing all approved leaves",
      icon: Calendar,
      lastGenerated: "2024-03-01",
    },
    {
      title: "Trends Analysis",
      description: "Leave trends and patterns over time",
      icon: TrendingUp,
      lastGenerated: "2024-02-15",
    },
  ];

  const recentReports = [
    {
      name: "February 2024 Leave Summary",
      type: "PDF",
      size: "2.4 MB",
      date: "2024-03-01",
    },
    {
      name: "Q1 2024 Department Analysis",
      type: "Excel",
      size: "1.8 MB",
      date: "2024-02-28",
    },
    {
      name: "Annual Leave Trends 2023",
      type: "PDF",
      size: "3.2 MB",
      date: "2024-02-15",
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Generate Reports</h3>
            {reportTypes.map((report) => (
              <Card key={report.title}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <report.icon className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-base">{report.title}</CardTitle>
                        <CardDescription>{report.description}</CardDescription>
                      </div>
                    </div>
                    <Button size="sm">
                      Generate
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Last generated: {new Date(report.lastGenerated).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Recent Reports</h3>
            <Card>
              <CardHeader>
                <CardTitle>Downloaded Reports</CardTitle>
                <CardDescription>Your recently generated reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentReports.map((report, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{report.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {report.type} • {report.size} • {new Date(report.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">This Month</span>
                  <span className="text-sm font-medium">24 days taken</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pending Requests</span>
                  <span className="text-sm font-medium">8 requests</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Most Used Leave</span>
                  <span className="text-sm font-medium">Annual Leave</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Department with Most Leave</span>
                  <span className="text-sm font-medium">Engineering</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;