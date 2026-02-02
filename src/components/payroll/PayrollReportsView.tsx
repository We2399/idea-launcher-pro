import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Filter, Users, User } from 'lucide-react';
import { format } from 'date-fns';

interface PayrollRecord {
  id: string;
  user_id: string;
  month: number;
  year: number;
  base_salary: number;
  total_allowances: number;
  total_bonuses: number;
  total_deductions: number;
  total_others: number;
  gross_total: number;
  net_total: number;
  currency: string;
  status: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    employee_id: string;
  };
}

export function PayrollReportsView() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  // Filters
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [reportType, setReportType] = useState<'monthly' | 'yearly' | 'custom'>('monthly');

  // Fetch all employees for filter dropdown
  const { data: employees } = useQuery({
    queryKey: ['employees-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, employee_id')
        .order('first_name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch payroll records with filters
  const { data: payrollRecords, isLoading } = useQuery({
    queryKey: ['payroll-reports', selectedEmployee, selectedYear, selectedMonth, dateFrom, dateTo, reportType],
    queryFn: async () => {
      let query = supabase
        .from('payroll_records')
        .select(`
          *,
          profiles!payroll_records_user_id_fkey(first_name, last_name, employee_id)
        `)
        .in('status', ['confirmed', 'sent_to_employee', 'pending_admin_approval']);

      // Apply employee filter
      if (selectedEmployee !== 'all') {
        query = query.eq('user_id', selectedEmployee);
      }

      // Apply date filters based on report type
      if (reportType === 'monthly') {
        query = query.eq('year', parseInt(selectedYear));
        if (selectedMonth !== 'all') {
          query = query.eq('month', parseInt(selectedMonth));
        }
      } else if (reportType === 'yearly') {
        query = query.eq('year', parseInt(selectedYear));
      } else if (reportType === 'custom' && dateFrom && dateTo) {
        // For custom date range, filter by created_at
        query = query
          .gte('created_at', dateFrom)
          .lte('created_at', dateTo + 'T23:59:59');
      }

      query = query.order('year', { ascending: false }).order('month', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data as PayrollRecord[];
    },
  });

  // Calculate totals
  const totals = useMemo(() => {
    if (!payrollRecords) return null;
    
    return payrollRecords.reduce(
      (acc, record) => ({
        baseSalary: acc.baseSalary + Number(record.base_salary),
        allowances: acc.allowances + Number(record.total_allowances),
        bonuses: acc.bonuses + Number(record.total_bonuses),
        deductions: acc.deductions + Number(record.total_deductions),
        others: acc.others + Number(record.total_others),
        gross: acc.gross + Number(record.gross_total),
        net: acc.net + Number(record.net_total),
      }),
      { baseSalary: 0, allowances: 0, bonuses: 0, deductions: 0, others: 0, gross: 0, net: 0 }
    );
  }, [payrollRecords]);

  const exportToCSV = () => {
    if (!payrollRecords || payrollRecords.length === 0) return;

    const headers = [
      'Employee Name',
      'Employee ID',
      'Period',
      'Base Salary',
      'Allowances',
      'Bonuses',
      'Deductions',
      'Others',
      'Gross Total',
      'Net Total',
      'Currency',
      'Status',
    ];

    const rows = payrollRecords.map((record) => [
      `${record.profiles?.first_name} ${record.profiles?.last_name}`,
      record.profiles?.employee_id || '',
      `${record.month}/${record.year}`,
      record.base_salary,
      record.total_allowances,
      record.total_bonuses,
      record.total_deductions,
      record.total_others,
      record.gross_total,
      record.net_total,
      record.currency,
      record.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `payroll-report-${selectedYear}${selectedMonth !== 'all' ? '-' + selectedMonth : ''}.csv`;
    link.click();
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'bg-gray-500',
      pending_admin_approval: 'bg-amber-500',
      sent_to_employee: 'bg-blue-500',
      confirmed: 'bg-green-500',
      disputed: 'bg-red-500',
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-500'}>
        {t(status) || status}
      </Badge>
    );
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i).toLocaleString('default', { month: 'long' }),
  }));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('reportFilters') || 'Report Filters'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Report Type */}
            <div className="space-y-2">
              <Label>{t('reportType') || 'Report Type'}</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{t('monthly') || 'Monthly'}</SelectItem>
                  <SelectItem value="yearly">{t('yearly') || 'Yearly'}</SelectItem>
                  <SelectItem value="custom">{t('customRange') || 'Custom Range'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Employee Filter */}
            <div className="space-y-2">
              <Label>{t('employee') || 'Employee'}</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t('allEmployees') || 'All Employees'}
                    </div>
                  </SelectItem>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.user_id} value={emp.user_id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {emp.first_name} {emp.last_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Filter */}
            {(reportType === 'monthly' || reportType === 'yearly') && (
              <div className="space-y-2">
                <Label>{t('year') || 'Year'}</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Month Filter */}
            {reportType === 'monthly' && (
              <div className="space-y-2">
                <Label>{t('month') || 'Month'}</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allMonths') || 'All Months'}</SelectItem>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom Date Range */}
            {reportType === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label>{t('dateFrom') || 'From'}</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('dateTo') || 'To'}</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={exportToCSV} disabled={!payrollRecords?.length}>
              <Download className="h-4 w-4 mr-2" />
              {t('exportCSV') || 'Export CSV'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {totals && payrollRecords && payrollRecords.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">{t('totalRecords') || 'Total Records'}</div>
              <div className="text-2xl font-bold">{payrollRecords.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">{t('totalGross') || 'Total Gross'}</div>
              <div className="text-2xl font-bold text-primary">{formatCurrency(totals.gross, 'SGD')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">{t('totalDeductions') || 'Total Deductions'}</div>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(totals.deductions, 'SGD')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">{t('totalNet') || 'Total Net'}</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.net, 'SGD')}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('payrollRecords') || 'Payroll Records'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">{t('loading') || 'Loading...'}</div>
          ) : payrollRecords && payrollRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('employee') || 'Employee'}</TableHead>
                    <TableHead>{t('period') || 'Period'}</TableHead>
                    <TableHead className="text-right">{t('baseSalary') || 'Base Salary'}</TableHead>
                    <TableHead className="text-right">{t('allowances') || 'Allowances'}</TableHead>
                    <TableHead className="text-right">{t('bonuses') || 'Bonuses'}</TableHead>
                    <TableHead className="text-right">{t('deductions') || 'Deductions'}</TableHead>
                    <TableHead className="text-right">{t('netTotal') || 'Net Total'}</TableHead>
                    <TableHead>{t('status') || 'Status'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {record.profiles?.first_name} {record.profiles?.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {record.profiles?.employee_id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{record.month}/{record.year}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(record.base_salary), record.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(record.total_allowances), record.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(record.total_bonuses), record.currency)}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        -{formatCurrency(Number(record.total_deductions), record.currency)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(Number(record.net_total), record.currency)}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t('noRecordsFound') || 'No records found for the selected filters'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
