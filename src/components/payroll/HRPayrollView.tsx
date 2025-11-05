import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreatePayrollDialog } from './CreatePayrollDialog';
import { PayrollDetailsDialog } from './PayrollDetailsDialog';
import { Plus, FileText, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface Props {
  showHistoryOnly?: boolean;
}

export function HRPayrollView({ showHistoryOnly = false }: Props) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);

  const { data: payrollRecords, isLoading } = useQuery({
    queryKey: ['all-payroll-records'],
    queryFn: async () => {
      let query = supabase
        .from('payroll_records')
        .select('*, profiles!payroll_records_user_id_fkey(first_name, last_name, employee_id)')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (payrollId: string) => {
      const { data, error } = await supabase.functions.invoke('delete-payroll-record', {
        body: { payroll_id: payrollId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      toast({ 
        title: t('success'), 
        description: t('payrollDeleted') 
      });
      queryClient.invalidateQueries({ queryKey: ['all-payroll-records'] });
    },
    onError: (error: any) => {
      toast({ 
        title: t('error'), 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const handleDeletePayroll = (payrollId: string) => {
    if (window.confirm(t('confirmDeletePayroll'))) {
      deleteMutation.mutate(payrollId);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'bg-gray-500',
      pending_admin_approval: 'bg-yellow-500',
      sent_to_employee: 'bg-blue-500',
      confirmed: 'bg-green-500',
      disputed: 'bg-red-500',
      rejected: 'bg-red-700',
    };

    const keyMap: Record<string, string> = {
      draft: 'draft',
      pending_admin_approval: 'pendingAdminApproval',
      sent_to_employee: 'sentToEmployee',
      confirmed: 'confirmed',
      disputed: 'disputed',
      rejected: 'rejected',
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-500'}>
        {t(keyMap[status] || status)}
      </Badge>
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  return (
    <div className="space-y-4">
      {!showHistoryOnly && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">{t('payrollManagement')}</h2>
            <p className="text-muted-foreground">{t('createAndManagePayroll')}</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('createPayroll')}
          </Button>
        </div>
      )}

      {payrollRecords && payrollRecords.length === 0 && (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('noPayrollRecords')}</p>
        </Card>
      )}

      <div className="grid gap-4">
        {payrollRecords?.map((record: any) => (
          <Card key={record.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">
                    {record.profiles?.first_name} {record.profiles?.last_name}
                  </h3>
                  {getStatusBadge(record.status)}
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t('employeeId')}: {record.profiles?.employee_id}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('period')}: {t('month')} {record.month}/{record.year}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('created')}: {format(new Date(record.created_at), 'MMM dd, yyyy')}
                </p>
              </div>

              <div className="text-right">
                <div className="mb-3">
                  <div className="text-sm text-muted-foreground">{t('netTotal')}</div>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(Number(record.net_total), record.currency)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => setSelectedPayroll(record)} 
                    variant="outline"
                    size="sm"
                  >
                    {t('viewDetails')}
                  </Button>
                  {!showHistoryOnly && (record.status === 'draft' || record.status === 'pending_admin_approval') && (
                    <Button 
                      onClick={() => handleDeletePayroll(record.id)}
                      variant="destructive"
                      size="sm"
                    >
                      {t('delete')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <CreatePayrollDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

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
