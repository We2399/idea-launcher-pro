import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PayrollDetailsDialog } from './PayrollDetailsDialog';
import { format } from 'date-fns';
import { FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export function EmployeePayrollView() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);

  const { data: payrollRecords, isLoading } = useQuery({
    queryKey: ['employee-payroll', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_records')
        .select('*')
        .eq('user_id', user!.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const getStatusBadge = (record: any) => {
    if (record.status === 'confirmed') {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />{t('confirmed')}</Badge>;
    }
    if (record.status === 'disputed') {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />{t('disputed')}</Badge>;
    }
    if (record.status === 'sent_to_employee') {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{t('pendingConfirmation')}</Badge>;
    }
    return <Badge variant="outline">{record.status}</Badge>;
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  return (
    <div className="space-y-4">
      {payrollRecords && payrollRecords.length === 0 && (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('noPayrollRecords')}</p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {payrollRecords?.map((record) => (
          <Card key={record.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {t('month')} {record.month}/{record.year}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(record.created_at), 'MMM dd, yyyy')}
                </p>
              </div>
              {getStatusBadge(record)}
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('grossTotal')}</span>
                <span className="font-medium">{formatCurrency(Number(record.gross_total), record.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('deductions')}</span>
                <span className="font-medium text-red-600">-{formatCurrency(Number(record.total_deductions), record.currency)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">{t('netTotal')}</span>
                <span className="font-bold text-primary">{formatCurrency(Number(record.net_total), record.currency)}</span>
              </div>
            </div>

            <Button 
              onClick={() => setSelectedPayroll(record)} 
              variant="outline" 
              className="w-full"
            >
              {t('viewDetails')}
            </Button>
          </Card>
        ))}
      </div>

      {selectedPayroll && (
        <PayrollDetailsDialog
          payroll={selectedPayroll}
          open={!!selectedPayroll}
          onClose={() => setSelectedPayroll(null)}
        />
      )}
    </div>
  );
}
