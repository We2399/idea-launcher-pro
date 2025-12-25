import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  payroll: any;
  open: boolean;
  onClose: () => void;
}

export function PayrollDetailsDialog({ payroll, open, onClose }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [employeeNotes, setEmployeeNotes] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);

  const { data: lineItems } = useQuery({
    queryKey: ['payroll-line-items', payroll.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_line_items')
        .select('*')
        .eq('payroll_record_id', payroll.id);

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('employee-confirm-payroll', {
        body: {
          payroll_record_id: payroll.id,
          employee_notes: employeeNotes,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t('success'), description: t('payrollConfirmed') });
      queryClient.invalidateQueries({ queryKey: ['employee-payroll'] });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: t('error'), 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const disputeMutation = useMutation({
    mutationFn: async () => {
      if (!disputeReason.trim()) {
        throw new Error('Dispute reason is required');
      }

      const { error } = await supabase.functions.invoke('employee-dispute-payroll', {
        body: {
          payroll_record_id: payroll.id,
          dispute_reason: disputeReason,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t('success'), description: t('payrollDisputed') });
      queryClient.invalidateQueries({ queryKey: ['employee-payroll'] });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: t('error'), 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const bonuses = lineItems?.filter(item => item.item_type === 'bonus') || [];
  const allowances = lineItems?.filter(item => item.item_type === 'allowance') || [];
  const others = lineItems?.filter(item => item.item_type === 'other') || [];
  const deductions = lineItems?.filter(item => item.item_type === 'deduction') || [];

  const canConfirmOrDispute = payroll.status === 'sent_to_employee' && payroll.user_id === user?.id;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('payrollDetails')} - {t('month')} {payroll.month}/{payroll.year}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Base Salary */}
          <div>
            <h3 className="font-semibold mb-2">{t('baseSalary')}</h3>
            <div className="flex justify-between p-3 bg-muted rounded">
              <span>{t('monthlySalary')}</span>
              <span className="font-medium">{formatCurrency(Number(payroll.base_salary), payroll.currency)}</span>
            </div>
          </div>

          {/* Bonuses */}
          {bonuses.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">{t('bonuses')}</h3>
              <div className="space-y-2">
                {bonuses.map((item) => (
                  <div key={item.id} className="flex justify-between p-3 bg-muted rounded">
                    <div>
                      <div className="font-medium">{item.description}</div>
                      <div className="text-sm text-muted-foreground">{item.category}</div>
                    </div>
                    <span className="font-medium">{formatCurrency(Number(item.amount), payroll.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Allowances */}
          {allowances.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">{t('allowances')}</h3>
              <div className="space-y-2">
                {allowances.map((item) => (
                  <div key={item.id} className="flex justify-between p-3 bg-muted rounded">
                    <div>
                      <div className="font-medium">{item.description}</div>
                      <div className="text-sm text-muted-foreground">{item.category}</div>
                    </div>
                    <span className="font-medium">{formatCurrency(Number(item.amount), payroll.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Others */}
          {others.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">{t('others')}</h3>
              <div className="space-y-2">
                {others.map((item) => (
                  <div key={item.id} className="flex justify-between p-3 bg-muted rounded">
                    <div>
                      <div className="font-medium">{item.description}</div>
                      <div className="text-sm text-muted-foreground">{item.category}</div>
                    </div>
                    <span className="font-medium">{formatCurrency(Number(item.amount), payroll.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Deductions */}
          {deductions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2 text-red-600">{t('deductions')}</h3>
              <div className="space-y-2">
                {deductions.map((item) => (
                  <div key={item.id} className="flex justify-between p-3 bg-red-50 rounded">
                    <div>
                      <div className="font-medium">{item.description}</div>
                      <div className="text-sm text-muted-foreground">{item.category}</div>
                    </div>
                    <span className="font-medium text-red-600">-{formatCurrency(Number(item.amount), payroll.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Totals */}
          <div className="space-y-2 bg-primary/5 p-4 rounded-lg">
            <div className="flex justify-between text-lg">
              <span className="font-semibold">{t('grossTotal')}</span>
              <span className="font-bold">{formatCurrency(Number(payroll.gross_total), payroll.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('totalDeductions')}</span>
              <span className="text-red-600">-{formatCurrency(Number(payroll.total_deductions), payroll.currency)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl">
              <span className="font-bold">{t('netTotal')}</span>
              <span className="font-bold text-primary">{formatCurrency(Number(payroll.net_total), payroll.currency)}</span>
            </div>
          </div>

          {/* Dispute History Section */}
          {payroll.disputed_by_employee && (
            <div className="border-t pt-4 space-y-3">
              <h3 className="font-semibold text-lg">{t('disputeHistory')}</h3>
              
              {/* Employee Dispute */}
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-semibold text-red-900 mb-1">{t('employeeDispute')}</div>
                    <p className="text-sm text-red-800">{payroll.dispute_reason}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(payroll.disputed_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>

              {/* HR/Admin Response */}
              {payroll.dispute_resolution_notes && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold text-blue-900 mb-1">{t('hrResponse')}</div>
                      <p className="text-sm text-blue-800">{payroll.dispute_resolution_notes}</p>
                      {payroll.dispute_resolved_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(payroll.dispute_resolved_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Current Status */}
              {payroll.dispute_resolved_at && (
                <div className={`p-3 rounded ${payroll.status === 'sent_to_employee' ? 'bg-green-50' : 'bg-amber-50'}`}>
                  <div className={`text-sm font-medium ${payroll.status === 'sent_to_employee' ? 'text-green-900' : 'text-amber-900'}`}>
                    {payroll.status === 'sent_to_employee' 
                      ? t('disputeResolved') 
                      : payroll.status === 'pending_admin_approval'
                        ? t('awaitingAdminApproval')
                        : t('underReview')}
                  </div>
                  {payroll.status === 'pending_admin_approval' && (
                    <p className="text-xs text-amber-700 mt-1">{t('hrRevisedAwaitingAdmin')}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Confirmed Status (without dispute) */}
          {payroll.confirmed_by_employee && !payroll.disputed_by_employee && (
            <div className="bg-green-50 p-4 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-semibold text-green-900">{t('confirmed')}</div>
                {payroll.employee_notes && (
                  <p className="text-sm text-green-800 mt-1">{payroll.employee_notes}</p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {canConfirmOrDispute && !showConfirmDialog && !showDisputeDialog && (
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowConfirmDialog(true)} 
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {t('confirmReceipt')}
              </Button>
              <Button 
                onClick={() => setShowDisputeDialog(true)} 
                variant="destructive"
                className="flex-1"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                {t('disputePayment')}
              </Button>
            </div>
          )}

          {/* Confirm Dialog */}
          {showConfirmDialog && (
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-semibold">{t('confirmReceipt')}</h4>
              <div>
                <Label htmlFor="notes">{t('notes')} ({t('optional')})</Label>
                <Textarea
                  id="notes"
                  value={employeeNotes}
                  onChange={(e) => setEmployeeNotes(e.target.value)}
                  placeholder={t('addNotesHere')}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => confirmMutation.mutate()}
                  disabled={confirmMutation.isPending}
                >
                  {t('confirm')}
                </Button>
                <Button 
                  onClick={() => setShowConfirmDialog(false)}
                  variant="outline"
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          )}

          {/* Dispute Dialog */}
          {showDisputeDialog && (
            <div className="space-y-4 p-4 border rounded-lg border-red-200 bg-red-50">
              <h4 className="font-semibold text-red-900">{t('disputePayment')}</h4>
              <div>
                <Label htmlFor="dispute" className="text-red-900">{t('disputeReason')} *</Label>
                <Textarea
                  id="dispute"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder={t('explainDisputeReason')}
                  className="mt-1"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => disputeMutation.mutate()}
                  disabled={disputeMutation.isPending || !disputeReason.trim()}
                  variant="destructive"
                >
                  {t('submitDispute')}
                </Button>
                <Button 
                  onClick={() => setShowDisputeDialog(false)}
                  variant="outline"
                >
                  {t('cancel')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
