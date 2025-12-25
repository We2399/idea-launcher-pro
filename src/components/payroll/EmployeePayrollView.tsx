import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PayrollDetailsDialog } from './PayrollDetailsDialog';
import { format } from 'date-fns';
import { FileText, CheckCircle, AlertCircle, Clock, Bell, X, RefreshCcw } from 'lucide-react';
import { usePayrollNotifications } from '@/hooks/usePayrollNotifications';

export function EmployeePayrollView() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
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

  // Fetch payroll notifications
  const { data: notifications } = usePayrollNotifications();

  // Mark notification as read
  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('payroll_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-notifications'] });
    },
  });

  const getStatusBadge = (record: any) => {
    if (record.status === 'confirmed') {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />{t('confirmed')}</Badge>;
    }
    if (record.status === 'disputed') {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />{t('disputed')}</Badge>;
    }
    if (record.status === 'sent_to_employee') {
      // Check if this is after a revision (has resolution notes)
      if (record.dispute_resolution_notes) {
        return <Badge className="bg-blue-500"><RefreshCcw className="w-3 h-3 mr-1" />{t('revised')}</Badge>;
      }
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{t('pendingConfirmation')}</Badge>;
    }
    if (record.status === 'pending_admin_approval') {
      return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />{t('underReview')}</Badge>;
    }
    return <Badge variant="outline">{record.status}</Badge>;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_sent':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'dispute_rejected':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'dispute_under_review':
        return <RefreshCcw className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Notifications Section */}
      {notifications && notifications.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4" />
            {t('notifications')}
          </h3>
          <div className="space-y-2">
            {notifications.map((notification: any) => (
              <Card 
                key={notification.id} 
                className="p-4 bg-primary/5 border-primary/20 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  {getNotificationIcon(notification.notification_type)}
                  <div className="flex-1">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(notification.sent_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {notification.payroll_records && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPayroll(notification.payroll_records)}
                    >
                      {t('viewDetails')}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markReadMutation.mutate(notification.id)}
                    title={t('dismiss')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

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

            {/* Show revision notice if applicable */}
            {record.status === 'sent_to_employee' && record.dispute_resolution_notes && (
              <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-950 rounded text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">{t('revisedPayroll')}</p>
                <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">{t('pleaseReviewAndConfirm')}</p>
              </div>
            )}

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
