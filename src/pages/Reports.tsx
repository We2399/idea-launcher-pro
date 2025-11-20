import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslationHelpers } from '@/lib/translations';
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
  const { t } = useLanguage();
  const { translateLeaveType } = useTranslationHelpers();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('12');

  useEffect(() => {
    if (userRole === 'hr_admin' || userRole === 'administrator') {
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
        supabase.from('leave_requests').select('*').gte('created_at', startDate.toISOString()),
        supabase.from('profiles').select('department', { count: 'exact' }).not('department', 'is', null),
        supabase.from('leave_requests').select('days_requested, leave_type_id').eq('status', 'approved').gte('created_at', startDate.toISOString())
      ]);

      if (employeesResult.error) throw employeesResult.error;
      if (requestsResult.error) throw requestsResult.error;
      if (departmentResult.error) throw departmentResult.error;
      if (leaveTypeResult.error) throw leaveTypeResult.error;

      const requests = requestsResult.data || [];
      const leaveTypeData = leaveTypeResult.data || [];

      // Fetch related data
      const userIds = [...new Set(requests.map(req => req.user_id))];
      const leaveTypeIds = [...new Set([...requests.map(req => req.leave_type_id), ...leaveTypeData.map(req => req.leave_type_id)])];

      const [profilesResult, leaveTypesResult] = await Promise.all([
        userIds.length > 0 ? supabase.from('profiles').select('*').in('user_id', userIds) : { data: [] },
        leaveTypeIds.length > 0 ? supabase.from('leave_types').select('*').in('id', leaveTypeIds) : { data: [] }
      ]);

      const profilesMap = new Map<string, any>();
      if (profilesResult.data) {
        profilesResult.data.forEach(p => profilesMap.set(p.user_id, p));
      }
      
      const leaveTypesMap = new Map<string, any>();
      if (leaveTypesResult.data) {
        leaveTypesResult.data.forEach(lt => leaveTypesMap.set(lt.id, lt));
      }

      // Enrich requests with related data  
      const enrichedRequests = requests.map((request: any) => ({
        ...request,
        profiles: profilesMap.get(request.user_id) || null
      }));

      const enrichedLeaveTypeData = leaveTypeData.map((request: any) => ({
        ...request,
        leave_types: leaveTypesMap.get(request.leave_type_id) || null
      }));

      // Process data
      const totalEmployees = employeesResult.count || 0;
      const totalRequests = requests.length;
      const approvedRequests = requests.filter(r => r.status === 'approved').length;
      const pendingRequests = requests.filter(r => r.status === 'pending').length;
      const rejectedRequests = requests.filter(r => r.status === 'rejected').length;

      // Department stats
      const deptCounts: { [key: string]: number } = {};
      enrichedRequests.forEach((req: any) => {
        const dept = req.profiles?.department || 'Unknown';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });
      const departmentStats = Object.entries(deptCounts).map(([department, count]) => ({
        department,
        count
      }));

      // Leave type stats
      const leaveTypeCounts: { [key: string]: { count: number; days: number } } = {};
      enrichedLeaveTypeData.forEach((req: any) => {
        const type = req.leave_types?.name || 'Unknown';
        if (!leaveTypeCounts[type]) {
          leaveTypeCounts[type] = { count: 0, days: 0 };
        }
        leaveTypeCounts[type].count += 1;
        leaveTypeCounts[type].days += req.days_requested || 0;
      });
      const leaveTypeStats = Object.entries(leaveTypeCounts).map(([type, data]) => ({
        type: type === 'Unknown' ? t('unknown') : translateLeaveType(type),
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

      enrichedRequests.forEach((req: any) => {
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
      enrichedRequests.filter((r: any) => r.status === 'approved').forEach((req: any) => {
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch report data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== 'hr_admin' && userRole !== 'administrator') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive mb-2">{t('accessDenied')}</h2>
          <p className="text-muted-foreground">{t('onlyHRAdminAccess')}</p>
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
    <div className="safe-area-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('analyticsReports')}</h1>
          <p className="text-muted-foreground">{t('comprehensiveLeaveInsights')}</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">{t('last3Months')}</SelectItem>
              <SelectItem value="6">{t('last6Months')}</SelectItem>
              <SelectItem value="12">{t('last12Months')}</SelectItem>
              <SelectItem value="24">{t('last24Months')}</SelectItem>
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
                <p className="text-sm text-muted-foreground">{t('totalEmployees')}</p>
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
                <p className="text-sm text-muted-foreground">{t('totalRequests')}</p>
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
                <p className="text-sm text-muted-foreground">{t('approved')}</p>
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
                <p className="text-sm text-muted-foreground">{t('pending')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('monthlyTrends')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="hsl(var(--primary))" name={t('requests')} />
                <Line type="monotone" dataKey="days" stroke="hsl(var(--secondary))" name={t('days')} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('leaveTypesDistribution')}</CardTitle>
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
            <CardTitle>{t('departmentUsage')}</CardTitle>
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
            <CardTitle>{t('topLeaveUsage')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('employee')}</TableHead>
                  <TableHead>{t('requests')}</TableHead>
                  <TableHead>{t('daysUsed')}</TableHead>
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