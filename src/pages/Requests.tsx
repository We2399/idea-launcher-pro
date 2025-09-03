import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, CheckCircle, XCircle } from "lucide-react";

const Requests = () => {
  // Mock data - will be replaced with real data later
  const requests = [
    {
      id: 1,
      type: "Annual Leave",
      startDate: "2024-03-15",
      endDate: "2024-03-19",
      days: 5,
      status: "pending",
      reason: "Family vacation",
      submittedDate: "2024-02-28",
    },
    {
      id: 2,
      type: "Sick Leave",
      startDate: "2024-02-20",
      endDate: "2024-02-21",
      days: 2,
      status: "approved",
      reason: "Medical appointment",
      submittedDate: "2024-02-19",
    },
    {
      id: 3,
      type: "Personal Leave",
      startDate: "2024-01-10",
      endDate: "2024-01-10",
      days: 1,
      status: "rejected",
      reason: "Personal matters",
      submittedDate: "2024-01-05",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">My Leave Requests</h2>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>

        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{request.type}</CardTitle>
                  {getStatusBadge(request.status)}
                </div>
                <CardDescription>
                  Submitted on {new Date(request.submittedDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm text-muted-foreground">
                        {request.startDate} to {request.endDate}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Days</p>
                    <p className="text-sm text-muted-foreground">{request.days} day{request.days > 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Reason</p>
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
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

export default Requests;