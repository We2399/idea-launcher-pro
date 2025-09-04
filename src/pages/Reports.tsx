import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, Calendar, FileText, BarChart3 } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface ReportData {
  totalEmployees: number;
  totalRequests: number;
  approvedRequests: number;
  pendingRequests: number;
  rejectedRequests: number;
  departmentStats: { department: string; count: number }[];
  leaveTypeStats: { type: string; count: number; days: number }[];
  monthlyTrends: { month: string; requests: number; days: number }[];
  topUsage: { employee: string; days: number; requests: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function Reports() {
  const { userRole } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('12');

  useEffect(() => {
    if (userRole === 'hr_admin') {
      fetchReportData();
    }
  }, [userRole, timeRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = subMonths(endDate, parseInt(timeRange));

      // Fetch basic stats
      const [employeesResult, requestsResult, departmentResult, leaveTypeResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase
          .from('leave_requests')
          .select('*, profiles!user_id(first_name, last_name, department), leave_types!leave_type_id(name)')
          .gte('created_at', startDate.toISOString()),
        supabase.from('profiles').select('department', { count: 'exact' }).not('department', 'is', null),
        supabase
          .from('leave_requests')
          .select('days_requested, leave_types!leave_type_id(name)')
          .eq('status', 'approved')
          .gte('created_at', startDate.toISOString())
      ]);

      if (employeesResult.error) throw employeesResult.error;
      if (requestsResult.error) throw requestsResult.error;
      if (departmentResult.error) throw departmentResult.error;
      if (leaveTypeResult.error) throw leaveTypeResult.error;

      const requests = requestsResult.data || [];
      const leaveTypeData = leaveTypeResult.data || [];

      // Process data
      const totalEmployees = employeesResult.count || 0;
      const totalRequests = requests.length;
      const approvedRequests = requests.filter(r => r.status === 'approved').length;
      const pendingRequests = requests.filter(r => r.status === 'pending').length;
      const rejectedRequests = requests.filter(r => r.status === 'rejected').length;

      // Department stats
      const deptCounts: { [key: string]: number } = {};
      requests.forEach(req => {
        const dept = req.profiles?.department || 'Unknown';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });
      const departmentStats = Object.entries(deptCounts).map(([department, count]) => ({
        department,
        count
      }));

      // Leave type stats
      const leaveTypeCounts: { [key: string]: { count: number; days: number } } = {};
      leaveTypeData.forEach(req => {
        const type = req.leave_types?.name || 'Unknown';
        if (!leaveTypeCounts[type]) {
          leaveTypeCounts[type] = { count: 0, days: 0 };
        }
        leaveTypeCounts[type].count += 1;
        leaveTypeCounts[type].days += req.days_requested || 0;
      });
      const leaveTypeStats = Object.entries(leaveTypeCounts).map(([type, data]) => ({
        type,
        count: data.count,
        days: data.days
      }));

      // Monthly trends (last 12 months)
      const monthlyData: { [key: string]: { requests: number; days: number } } = {};
      for (let i = parseInt(timeRange) - 1; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(endDate, i));
        const monthKey = format(monthStart, 'MMM yyyy');
        monthlyData[monthKey] = { requests: 0, days: 0 };
      }

      requests.forEach(req => {
        const reqMonth = format(new Date(req.created_at), 'MMM yyyy');
        if (monthlyData[reqMonth]) {
          monthlyData[reqMonth].requests += 1;
          if (req.status === 'approved') {
            monthlyData[reqMonth].days += req.days_requested || 0;
          }
        }
      });

      const monthlyTrends = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        requests: data.requests,
        days: data.days
      }));

      // Top usage by employee
      const employeeUsage: { [key: string]: { days: number; requests: number } } = {};
      requests.filter(r => r.status === 'approved').forEach(req => {
        const empName = req.profiles ? `${req.profiles.first_name} ${req.profiles.last_name}` : 'Unknown';
        if (!employeeUsage[empName]) {
          employeeUsage[empName] = { days: 0, requests: 0 };
        }
        employeeUsage[empName].days += req.days_requested || 0;
        employeeUsage[empName].requests += 1;
      });

      const topUsage = Object.entries(employeeUsage)
        .map(([employee, data]) => ({ employee, ...data }))
        .sort((a, b) => b.days - a.days)
        .slice(0, 10);

      setReportData({
        totalEmployees,
        totalRequests,
        approvedRequests,
        pendingRequests,
        rejectedRequests,
        departmentStats,
        leaveTypeStats,
        monthlyTrends,
        topUsage
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch report data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== 'hr_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only HR administrators can access reports.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No report data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground">Comprehensive leave management insights</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
            <SelectItem value="24">Last 24 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{reportData.totalEmployees}</p>
                <p className="text-sm text-muted-foreground">Total Employees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{reportData.totalRequests}</p>
                <p className="text-sm text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{reportData.approvedRequests}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{reportData.pendingRequests}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="hsl(var(--primary))" name="Requests" />
                <Line type="monotone" dataKey="days" stroke="hsl(var(--secondary))" name="Days" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leave Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  dataKey="count"
                  data={reportData.leaveTypeStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                >
                  {reportData.leaveTypeStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Department Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.departmentStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Leave Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Days Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.topUsage.map((emp, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{emp.employee}</TableCell>
                    <TableCell>{emp.requests}</TableCell>
                    <TableCell>{emp.days}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}