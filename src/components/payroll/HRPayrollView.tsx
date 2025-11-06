import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreatePayrollDialog } from './CreatePayrollDialog';
import { PayrollDetailsDialog } from './PayrollDetailsDialog';
import { Plus, FileText, Trash2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  const [showReviseDialog, setShowReviseDialog] = useState(false);
  const [showRejectDisputeDialog, setShowRejectDisputeDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [disputedPayroll, setDisputedPayroll] = useState<any>(null);

  const { data: payrollRecords, isLoading } = useQuery({
    queryKey: ['all-payroll-records'],
    queryFn: async () => {
      let query = supabase
        .from('payroll_records')
        .select(`
          *, 
          profiles!payroll_records_user_id_fkey(first_name, last_name, employee_id),
          payroll_line_items(*)
        `)
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

  const resolveDisputeMutation = useMutation({
    mutationFn: async ({ action, payroll }: { action: 'revise' | 'reject_dispute', payroll: any }) => {
      const { data, error } = await supabase.functions.invoke('resolve-payroll-dispute', {
        body: {
          payroll_record_id: payroll.id,
          action,
          resolution_notes: resolutionNotes,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, variables) => {
      const message = variables.action === 'revise' 
        ? t('payrollRevised') 
        : t('disputeRejectedSuccess');
      toast({ title: t('success'), description: message });
      queryClient.invalidateQueries({ queryKey: ['all-payroll-records'] });
      setShowReviseDialog(false);
      setShowRejectDisputeDialog(false);
      setDisputedPayroll(null);
      setResolutionNotes('');
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

  const disputedPayrolls = payrollRecords?.filter(r => r.status === 'disputed') || [];
  const nonDisputedPayrolls = payrollRecords?.filter(r => r.status !== 'disputed') || [];

  return (
    <div className="space-y-6">
      {/* Disputed Payrolls Section */}
      {!showHistoryOnly && disputedPayrolls.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-red-900">{t('disputedPayrolls')}</h2>
          <div className="grid gap-4">
            {disputedPayrolls.map((record: any) => (
              <Card key={record.id} className="p-6 border-red-200 bg-red-50">
                <div className="flex items-start gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-red-900">
                      {record.profiles?.first_name} {record.profiles?.last_name}
                    </h3>
                    <p className="text-sm text-red-800 mb-2">
                      {t('period')}: {t('month')} {record.month}/{record.year}
                    </p>
                    <div className="bg-white p-3 rounded mb-3">
                      <div className="text-sm font-medium text-red-900 mb-1">{t('disputeReason')}:</div>
                      <p className="text-sm text-red-800">{record.dispute_reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(record.disputed_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setDisputedPayroll(record);
                          setShowReviseDialog(true);
                        }}
                        size="sm"
                        variant="default"
                      >
                        {t('reviseAndResubmit')}
                      </Button>
                      <Button
                        onClick={() => {
                          setDisputedPayroll(record);
                          setShowRejectDisputeDialog(true);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        {t('rejectDispute')}
                      </Button>
                      <Button
                        onClick={() => setSelectedPayroll(record)}
                        size="sm"
                        variant="ghost"
                      >
                        {t('viewDetails')}
                      </Button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-red-800">{t('netTotal')}</div>
                    <div className="text-xl font-bold text-red-900">
                      {formatCurrency(Number(record.net_total), record.currency)}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Regular Payrolls Section */}
      <div>
        {!showHistoryOnly && (
          <div className="flex justify-between items-center mb-4">
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

        {nonDisputedPayrolls && nonDisputedPayrolls.length === 0 && disputedPayrolls.length === 0 && (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('noPayrollRecords')}</p>
          </Card>
        )}

        <div className="grid gap-4">
          {nonDisputedPayrolls?.map((record: any) => (
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
      </div>

      <CreatePayrollDialog
        open={showCreateDialog}
        onClose={() => {
          setShowCreateDialog(false);
          setDisputedPayroll(null);
          setResolutionNotes('');
        }}
        existingPayroll={disputedPayroll}
        resolutionNotes={resolutionNotes}
      />

      {selectedPayroll && (
        <PayrollDetailsDialog
          payroll={selectedPayroll}
          open={!!selectedPayroll}
          onClose={() => setSelectedPayroll(null)}
        />
      )}

      {/* Revise Dispute Dialog */}
      <Dialog open={showReviseDialog} onOpenChange={setShowReviseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('reviseAndResubmit')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('reviseDisputeDescription')}
            </p>
            <div>
              <Label htmlFor="revise-notes">{t('revisionNotes')} *</Label>
              <Textarea
                id="revise-notes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder={t('explainRevisions')}
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                onClick={() => {
                  setShowReviseDialog(false);
                  setResolutionNotes('');
                }}
                variant="outline"
              >
                {t('cancel')}
              </Button>
              <Button 
                onClick={() => {
                  setShowReviseDialog(false);
                  setShowCreateDialog(true);
                }}
                disabled={!resolutionNotes.trim()}
              >
                {t('editPayroll')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dispute Dialog */}
      <Dialog open={showRejectDisputeDialog} onOpenChange={setShowRejectDisputeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rejectDispute')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('rejectDisputeDescription')}
            </p>
            <div>
              <Label htmlFor="reject-notes">{t('rejectionExplanation')} *</Label>
              <Textarea
                id="reject-notes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder={t('explainWhyDisputeRejected')}
                className="mt-1"
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                onClick={() => {
                  setShowRejectDisputeDialog(false);
                  setResolutionNotes('');
                }}
                variant="outline"
              >
                {t('cancel')}
              </Button>
              <Button 
                onClick={() => resolveDisputeMutation.mutate({ 
                  action: 'reject_dispute', 
                  payroll: disputedPayroll 
                })}
                disabled={resolveDisputeMutation.isPending || !resolutionNotes.trim()}
                variant="destructive"
              >
                {t('rejectDispute')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
