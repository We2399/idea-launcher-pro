import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, DollarSign, Calendar, User, Check, X, Upload, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslationHelpers } from '@/lib/translations';

interface CashTransaction {
  id: string;
  employee_id: string;
  amount: number;
  currency: string;
  type: 'request' | 'expense' | 'reimbursement';
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  category: string;
  description: string;
  receipt_url: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  approver?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Profile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const CashControl = () => {
  const { user, userRole } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { translateTransactionType, translateCategory, translateStatus } = useTranslationHelpers();
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'my' | 'team' | 'all'>(
    (userRole === 'hr_admin' || userRole === 'administrator') ? 'all' : 'my'
  );
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'HKD',
    type: 'request' as 'request' | 'expense' | 'reimbursement',
    category: 'general',
    description: '',
    receipt_url: ''
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [dialogType, setDialogType] = useState<'request' | 'expense'>('request');

  const canApprove = userRole === 'manager' || userRole === 'hr_admin' || userRole === 'administrator';

  useEffect(() => {
    console.log('[CashControl] mounted');
    if (user) {
      fetchTransactions();
    }
  }, [user, userRole, viewMode]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('cash_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply view mode filtering
      if (viewMode === 'my') {
        query = query.eq('employee_id', user?.id);
      } else if (viewMode === 'team' && userRole === 'manager') {
        // Get team members
        const { data: teamMembers } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('manager_id', user?.id);
        
        if (teamMembers) {
          const teamIds = teamMembers.map(m => m.user_id);
          query = query.in('employee_id', teamIds);
        }
      }
      // 'all' mode doesn't need additional filtering for hr_admin

      const { data: transactionsData, error: transactionsError } = await query;

      if (transactionsError) throw transactionsError;

      if (transactionsData) {
        // Fetch profiles for employees and approvers
        const userIds = [...new Set([
          ...transactionsData.map(t => t.employee_id),
          ...transactionsData.map(t => t.approved_by).filter(Boolean)
        ])];

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, email')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        const profileMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);

        const enrichedTransactions = transactionsData.map(transaction => ({
          ...transaction,
          employee: profileMap.get(transaction.employee_id),
          approver: transaction.approved_by ? profileMap.get(transaction.approved_by) : undefined
        })) as CashTransaction[];

        setTransactions(enrichedTransactions);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch transactions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return null;

    try {
      setUploadingFile(true);

      // Create unique filename with user ID and timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      setFormData({ ...formData, receipt_url: publicUrl });

      toast({
        title: 'Success',
        description: 'Receipt uploaded successfully',
      });

      return publicUrl;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload receipt',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      // For expenses, ensure amount is negative
      let finalAmount = parseFloat(formData.amount);
      if (formData.type === 'expense' && finalAmount > 0) {
        finalAmount = -finalAmount;
      }

      const { error } = await supabase
        .from('cash_transactions')
        .insert({
          employee_id: user.id,
          amount: finalAmount,
          currency: formData.currency,
          type: formData.type,
          category: formData.category,
          description: formData.description,
          receipt_url: formData.receipt_url || null
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Transaction request created successfully',
      });

      setShowCreateDialog(false);
      setFormData({
        amount: '',
        currency: 'HKD',
        type: dialogType === 'expense' ? 'expense' : 'request',
        category: 'general',
        description: '',
        receipt_url: ''
      });
      fetchTransactions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create transaction',
        variant: 'destructive',
      });
    }
  };

  const approveTransaction = async (transactionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cash_transactions')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Transaction approved',
      });

      fetchTransactions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve transaction',
        variant: 'destructive',
      });
    }
  };

  const rejectTransaction = async (transactionId: string, reason: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cash_transactions')
        .update({
          status: 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Transaction rejected',
      });

      fetchTransactions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject transaction',
        variant: 'destructive',
      });
    }
  };

  // Helper function to calculate accounting figures
  const calculateAccountingFigures = () => {
    const userTransactions = transactions.filter(t => t.employee_id === user?.id && t.status === 'approved');
    
    const credit = userTransactions
      .filter(t => t.type === 'request' || (t.type === 'reimbursement' && t.amount > 0))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const debit = userTransactions
      .filter(t => t.type === 'expense' || t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const balance = credit - debit;
    
    return { credit, debit, balance };
  };

  const { credit, debit, balance } = calculateAccountingFigures();

  const openDialog = (type: 'request' | 'expense') => {
    setDialogType(type);
    setFormData({
      ...formData,
      type: type === 'expense' ? 'expense' : 'request'
    });
    setShowCreateDialog(true);
  };

  const getViewModeOptions = () => {
    const options = [{ value: 'my', label: t('myRequests') }];
    
    if (userRole === 'manager') {
      options.push({ value: 'team', label: t('teamRequests') });
    }
    
    if (userRole === 'hr_admin' || userRole === 'administrator') {
      options.push(
        { value: 'team', label: t('teamRequests') },
        { value: 'all', label: t('allRequests') }
      );
    }
    
    return options;
  };

  const getStatusColor = (status: CashTransaction['status']) => {
    switch (status) {
      case 'pending': return 'default';
      case 'approved': return 'outline';
      case 'rejected': return 'destructive';
      case 'paid': return 'secondary';
      default: return 'default';
    }
  };

  const getTypeColor = (type: CashTransaction['type']) => {
    switch (type) {
      case 'request': return 'outline';
      case 'expense': return 'secondary';
      case 'reimbursement': return 'default';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('cashControl')}</h1>
          <p className="text-muted-foreground">{t('cashControlDescription')}</p>
        </div>
        <Button onClick={() => openDialog('request')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t('newTransaction')}
        </Button>
      </div>

      {/* Create Transaction Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogType === 'expense' ? t('expenseReport') : t('cashRequest')}
              </DialogTitle>
              <DialogDescription>
                {dialogType === 'expense' 
                  ? t('expenseReportDescription')
                  : t('cashRequestDescription')
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTransaction} className="space-y-4">
              {/* First Row: Type and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">{t('type')}</Label>
                  <Select onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={dialogType === 'expense' ? t('expenseReport') : t('cashRequest')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="request">{translateTransactionType('request')}</SelectItem>
                      <SelectItem value="expense">{translateTransactionType('expense')}</SelectItem>
                      <SelectItem value="reimbursement">{translateTransactionType('reimbursement')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">{t('category')}</Label>
                  <Select onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">{translateCategory('general')}</SelectItem>
                      <SelectItem value="travel">{translateCategory('travel')}</SelectItem>
                      <SelectItem value="meals">{translateCategory('meals')}</SelectItem>
                      <SelectItem value="supplies">{translateCategory('supplies')}</SelectItem>
                      <SelectItem value="equipment">{translateCategory('equipment')}</SelectItem>
                      <SelectItem value="training">{translateCategory('training')}</SelectItem>
                      <SelectItem value="groceries">{translateCategory('groceries')}</SelectItem>
                      <SelectItem value="others">{translateCategory('others')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Second Row: Amount and Currency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">{t('amount')}</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    placeholder={t('amount')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">{t('currency')}</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="HKD" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HKD">HKD - Hong Kong Dollar</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                      <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t('description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt">{t('receipt')}</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="receipt-file"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('receipt-file')?.click()}
                        disabled={uploadingFile}
                        className="w-full justify-start"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingFile ? t('uploading') : t('uploadReceipt')}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const input = document.getElementById('receipt-file') as HTMLInputElement;
                        if (input) {
                          input.capture = 'environment';
                          input.click();
                        }
                      }}
                      disabled={uploadingFile}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.receipt_url && (
                    <div className="text-sm text-muted-foreground">
                      ✓ {t('receiptUploaded')}
                    </div>
                  )}
                  <Input
                    type="url"
                    placeholder={t('enterReceiptUrl')}
                    value={formData.receipt_url}
                    onChange={(e) => setFormData({ ...formData, receipt_url: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit">{t('submit')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      {/* Summary Cards - Accounting Format */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('credit')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              ${credit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{t('moneyReceived')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('debit')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ${debit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{t('moneySpent')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('balance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
              ${balance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">{t('netPosition')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        {transactions.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">{t('noTransactionsFound')}</p>
            </CardContent>
          </Card>
        ) : (
          transactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      {transaction.currency} {transaction.amount.toFixed(2)}
                      <Badge variant={getTypeColor(transaction.type)}>
                        {translateTransactionType(transaction.type)}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{transaction.description}</CardDescription>
                  </div>
                  <Badge variant={getStatusColor(transaction.status)}>
                    {translateStatus(transaction.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>
                        {transaction.employee ? 
                          `${transaction.employee.first_name} ${transaction.employee.last_name}` : 
                          t('unknown')
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
                    </div>
                    <Badge variant="outline">{translateCategory(transaction.category)}</Badge>
                    {transaction.receipt_url && (
                      <a 
                        href={transaction.receipt_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {t('receipt')}
                      </a>
                    )}
                  </div>
                  {canApprove && transaction.status === 'pending' && transaction.employee_id !== user?.id && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approveTransaction(transaction.id)}
                        className="text-success border-success hover:bg-success hover:text-success-foreground"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {t('approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectTransaction(transaction.id, 'Rejected by manager')}
                        className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-4 w-4 mr-1" />
                        {t('reject')}
                      </Button>
                    </div>
                  )}
                </div>
                {transaction.rejection_reason && (
                  <div className="mt-2 p-2 bg-destructive/10 rounded-md">
                    <p className="text-sm text-destructive">
                      <strong>{t('reasonForRejection')}</strong> {transaction.rejection_reason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CashControl;