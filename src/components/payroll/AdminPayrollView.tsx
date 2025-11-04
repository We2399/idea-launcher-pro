import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export function AdminPayrollView() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const { data: pendingApprovals, isLoading } = useQuery({
    queryKey: ['pending-payroll-approvals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_records')
        .select('*, profiles!payroll_records_user_id_fkey(first_name, last_name, employee_id)')
        .eq('status', 'pending_admin_approval')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const { data: disputedPayrolls } = useQuery({
    queryKey: ['disputed-payrolls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_records')
        .select('*, profiles!payroll_records_user_id_fkey(first_name, last_name, employee_id)')
        .eq('status', 'disputed')
        .order('disputed_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (payrollId: string) => {
      const { error } = await supabase.functions.invoke('approve-payroll-record', {
        body: {
          payroll_record_id: payrollId,
          action: 'approve',
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t('success'), description: t('payrollApproved') });
      queryClient.invalidateQueries({ queryKey: ['pending-payroll-approvals'] });
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

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPayroll || !rejectionReason.trim()) {
        throw new Error('Rejection reason is required');
      }

      const { error } = await supabase.functions.invoke('approve-payroll-record', {
        body: {
          payroll_record_id: selectedPayroll.id,
          action: 'reject',
          rejection_reason: rejectionReason,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t('success'), description: t('payrollRejected') });
      queryClient.invalidateQueries({ queryKey: ['pending-payroll-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['all-payroll-records'] });
      setShowRejectDialog(false);
      setSelectedPayroll(null);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast({ 
        title: t('error'), 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">{t('pendingApprovals')}</h2>

        {pendingApprovals && pendingApprovals.length === 0 && (
          <Card className="p-8 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
            <p className="text-muted-foreground">{t('noPendingApprovals')}</p>
          </Card>
        )}

        <div className="grid gap-4">
          {pendingApprovals?.map((record: any) => (
            <Card key={record.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">
                      {record.profiles?.first_name} {record.profiles?.last_name}
                    </h3>
                    <Badge variant="secondary">{t('pendingApproval')}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
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
                      onClick={() => approveMutation.mutate(record.id)}
                      disabled={approveMutation.isPending}
                      size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {t('approve')}
                    </Button>
                    <Button 
                      onClick={() => {
                        setSelectedPayroll(record);
                        setShowRejectDialog(true);
                      }}
                      variant="destructive"
                      size="sm"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      {t('reject')}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Disputed Payrolls */}
      {disputedPayrolls && disputedPayrolls.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">{t('disputedPayrolls')}</h2>

          <div className="grid gap-4">
            {disputedPayrolls.map((record: any) => (
              <Card key={record.id} className="p-6 border-red-200 bg-red-50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-red-900">
                      {record.profiles?.first_name} {record.profiles?.last_name}
                    </h3>
                    <p className="text-sm text-red-800 mb-2">
                      {t('period')}: {t('month')} {record.month}/{record.year}
                    </p>
                    <div className="bg-white p-3 rounded mb-2">
                      <div className="text-sm font-medium text-red-900 mb-1">{t('disputeReason')}:</div>
                      <p className="text-sm text-red-800">{record.dispute_reason}</p>
                    </div>
                    <div className="text-sm text-red-800">
                      {t('netTotal')}: {formatCurrency(Number(record.net_total), record.currency)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rejectPayroll')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">{t('rejectionReason')} *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t('explainRejectionReason')}
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                }}
                variant="outline"
              >
                {t('cancel')}
              </Button>
              <Button 
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
                variant="destructive"
              >
                {t('reject')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
