import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Users } from "lucide-react";

const Calendar = () => {
  // Mock calendar data - will be replaced with real data later
  const upcomingLeaves = [
    {
      id: 1,
      employee: "Sarah Johnson",
      type: "Annual Leave",
      startDate: "2024-03-15",
      endDate: "2024-03-22",
      days: 6,
      status: "approved",
    },
    {
      id: 2,
      employee: "Mike Davis",
      type: "Sick Leave",
      startDate: "2024-03-18",
      endDate: "2024-03-19",
      days: 2,
      status: "approved",
    },
    {
      id: 3,
      employee: "Lisa Chen",
      type: "Personal Leave",
      startDate: "2024-03-25",
      endDate: "2024-03-25",
      days: 1,
      status: "pending",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Team Calendar</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendar View
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-8 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Interactive calendar view will be implemented here</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This will show a full month/week view with leave periods marked
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Upcoming Leaves
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingLeaves.map((leave) => (
                  <div key={leave.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-sm">{leave.employee}</p>
                      {getStatusBadge(leave.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{leave.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {leave.startDate} - {leave.endDate}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {leave.days} day{leave.days > 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Calendar;