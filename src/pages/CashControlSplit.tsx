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
import { Plus, DollarSign, Receipt, Check, X, Upload, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
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
  affects_balance: boolean;
  created_at: string;
  updated_at: string;
  employee?: {
    first_name: string;
    last_name: string;
    email: string;
    cash_balance: number;
  };
  approver?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const CashControl = () => {
  const { user, userRole } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { translateStatus, translateTransactionType, translateCategory } = useTranslationHelpers();
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [cashBalance, setCashBalance] = useState(0);
  const [requestData, setRequestData] = useState({
    amount: '',
    currency: 'HKD',
    description: '',
    category: 'general'
  });
  const [reportData, setReportData] = useState({
    amount: '',
    currency: 'HKD',
    type: 'expense' as 'expense' | 'reimbursement',
    category: 'general',
    description: '',
    receipt_url: ''
  });
  const [uploadingFile, setUploadingFile] = useState(false);

  const canApprove = userRole === 'manager' || userRole === 'hr_admin';

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchCashBalance();
    }
  }, [user, userRole]);

  const fetchCashBalance = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('cash_balance')
        .eq('user_id', user?.id)
        .single();

      if (profileData) {
        setCashBalance(profileData.cash_balance || 0);
      }
    } catch (error) {
      console.error('Error fetching cash balance:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('cash_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      if (transactionsData) {
        // Fetch profiles for employees and approvers
        const userIds = [...new Set([
          ...transactionsData.map(t => t.employee_id),
          ...transactionsData.map(t => t.approved_by).filter(Boolean)
        ])];

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, email, cash_balance')
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
        title: t('error'),
        description: error.message || t('failedToFetch'),
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

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      setReportData({ ...reportData, receipt_url: publicUrl });

      toast({
        title: t('success'),
        description: t('receiptUploadSuccess'),
      });

      return publicUrl;
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('receiptUploadError'),
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleCashRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cash_transactions')
        .insert({
          employee_id: user.id,
          amount: parseFloat(requestData.amount),
          currency: requestData.currency,
          type: 'request',
          category: requestData.category,
          description: requestData.description,
          affects_balance: true
        });

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('cashRequestSuccess'),
      });

      setShowRequestDialog(false);
      setRequestData({
        amount: '',
        currency: 'HKD',
        description: '',
        category: 'general'
      });
      fetchTransactions();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('failedToCreate'),
        variant: 'destructive',
      });
    }
  };

  const handleExpenseReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cash_transactions')
        .insert({
          employee_id: user.id,
          amount: parseFloat(reportData.amount),
          currency: reportData.currency,
          type: reportData.type,
          category: reportData.category,
          description: reportData.description,
          receipt_url: reportData.receipt_url || null,
          affects_balance: false
        });

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('expenseReportSuccess'),
      });

      setShowReportDialog(false);
      setReportData({
        amount: '',
        currency: 'HKD',
        type: 'expense',
        category: 'general',
        description: '',
        receipt_url: ''
      });
      fetchTransactions();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('failedToSubmit'),
        variant: 'destructive',
      });
    }
  };

  const approveTransaction = async (transactionId: string) => {
    if (!user) return;

    try {
      const transaction = transactions.find(t => t.id === transactionId);
      
      const updates: any = {
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString()
      };

      // If it's a cash request that affects balance, update the employee's balance
      if (transaction?.type === 'request' && transaction.affects_balance) {
        const { error: balanceError } = await supabase
          .from('profiles')
          .update({
            cash_balance: (transaction.employee?.cash_balance || 0) + transaction.amount
          })
          .eq('user_id', transaction.employee_id);

        if (balanceError) throw balanceError;
      }

      const { error } = await supabase
        .from('cash_transactions')
        .update(updates)
        .eq('id', transactionId);

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('transactionApproved'),
      });

      fetchTransactions();
      fetchCashBalance();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('failedToApprove'),
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
        title: t('success'),
        description: t('transactionRejected'),
      });

      fetchTransactions();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('failedToReject'),
        variant: 'destructive',
      });
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t('cashControlTitle')}</h1>
          <p className="text-sm md:text-base text-muted-foreground">{t('cashControlDescription')}</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full md:w-auto">
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center justify-center gap-2 w-full sm:w-auto">
                <DollarSign className="h-4 w-4" />
                {t('cashRequest')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] md:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('cashRequestTitle')}</DialogTitle>
                <DialogDescription>
                  {t('cashRequestDescription')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCashRequest} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">{t('amount')}</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={requestData.amount}
                      onChange={(e) => setRequestData({ ...requestData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">{t('currency')}</Label>
                    <Select value={requestData.currency} onValueChange={(value) => setRequestData({ ...requestData, currency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HKD">HKD</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CNY">CNY</SelectItem>
                        <SelectItem value="IDR">IDR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">{t('category')}</Label>
                  <Select value={requestData.category} onValueChange={(value) => setRequestData({ ...requestData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">{translateCategory('general')}</SelectItem>
                      <SelectItem value="travel">{translateCategory('travel')}</SelectItem>
                      <SelectItem value="supplies">{translateCategory('officeSupplies')}</SelectItem>
                      <SelectItem value="training">{translateCategory('training')}</SelectItem>
                      <SelectItem value="others">{translateCategory('others')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t('description')}</Label>
                  <Textarea
                    id="description"
                    value={requestData.description}
                    onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                    placeholder={t('cashRequestPlaceholder')}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowRequestDialog(false)}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit">{t('submit')}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center justify-center gap-2 w-full sm:w-auto">
                <Receipt className="h-4 w-4" />
                {t('expenseReport')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] md:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('expenseReportTitle')}</DialogTitle>
                <DialogDescription>
                  {t('expenseReportDescription')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleExpenseReport} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">{t('type')}</Label>
                    <Select value={reportData.type} onValueChange={(value: any) => setReportData({ ...reportData, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">{translateTransactionType('expense')}</SelectItem>
                        <SelectItem value="reimbursement">{translateTransactionType('reimbursement')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">{t('category')}</Label>
                    <Select value={reportData.category} onValueChange={(value) => setReportData({ ...reportData, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">{translateCategory('general')}</SelectItem>
                        <SelectItem value="travel">{translateCategory('travel')}</SelectItem>
                        <SelectItem value="meals">{translateCategory('meals')}</SelectItem>
                        <SelectItem value="supplies">{translateCategory('officeSupplies')}</SelectItem>
                        <SelectItem value="equipment">{translateCategory('equipment')}</SelectItem>
                        <SelectItem value="training">{translateCategory('training')}</SelectItem>
                        <SelectItem value="groceries">{translateCategory('groceries')}</SelectItem>
                        <SelectItem value="others">{translateCategory('others')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">{t('amount')}</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={reportData.amount}
                      onChange={(e) => {
                        let amount = e.target.value;
                        // For expenses, automatically make negative if positive number entered
                        if (reportData.type === 'expense' && amount && !amount.startsWith('-') && parseFloat(amount) > 0) {
                          amount = '-' + amount;
                        }
                        setReportData({ ...reportData, amount });
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">{t('currency')}</Label>
                    <Select value={reportData.currency} onValueChange={(value) => setReportData({ ...reportData, currency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HKD">HKD</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CNY">CNY</SelectItem>
                        <SelectItem value="IDR">IDR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t('description')}</Label>
                  <Textarea
                    id="description"
                    value={reportData.description}
                    onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
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
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
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
                    {reportData.receipt_url && (
                      <div className="text-sm text-muted-foreground">
                        ✓ {t('receiptUploaded')}
                      </div>
                    )}
                    <Input
                      type="url"
                      placeholder={t('enterReceiptUrl')}
                      value={reportData.receipt_url}
                      onChange={(e) => setReportData({ ...reportData, receipt_url: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowReportDialog(false)}>
                    {t('cancel')}
                  </Button>
                  <Button type="submit">{t('submit')}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cash Balance Display */}
      {userRole === 'employee' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t('cashBalance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-primary">
              ${cashBalance.toFixed(2)}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {t('availableCashBalance')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards - Accounting Format */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('credit')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-green-600">
              ${transactions
                .filter(t => t.employee_id === user?.id && t.status === 'approved' && (t.type === 'request' || t.type === 'reimbursement'))
                .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('moneyReceived')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('debit')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-red-600">
              ${transactions
                .filter(t => t.employee_id === user?.id && t.status === 'approved' && t.type === 'expense')
                .reduce((sum, t) => sum + Math.abs(t.amount), 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('moneySpent')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('balance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              ${(
                transactions
                  .filter(t => t.employee_id === user?.id && t.status === 'approved' && (t.type === 'request' || t.type === 'reimbursement'))
                  .reduce((sum, t) => sum + Math.abs(t.amount), 0) -
                transactions
                  .filter(t => t.employee_id === user?.id && t.status === 'approved' && t.type === 'expense')
                  .reduce((sum, t) => sum + Math.abs(t.amount), 0)
              ).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('netPosition')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">{t('recentTransactions')}</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            {canApprove ? t('manageCashRequests') : t('yourCashHistory')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-sm md:text-base text-muted-foreground">
                {t('noTransactionsFound')}
              </div>
            ) : isMobile ? (
              // Mobile Card Layout
              transactions.map((transaction) => (
                <Card key={transaction.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getStatusColor(transaction.status)}>
                          {translateStatus(transaction.status)}
                        </Badge>
                        <Badge variant="outline">
                          {translateTransactionType(transaction.type)}
                        </Badge>
                        {transaction.affects_balance && (
                          <Badge variant="secondary">{t('affectsBalance')}</Badge>
                        )}
                      </div>
                      <div className="text-lg font-bold whitespace-nowrap">
                        {transaction.currency} ${Math.abs(transaction.amount).toFixed(2)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="font-medium text-sm">
                      {transaction.description}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">{t('employee')}:</span>
                        <div className="font-medium">
                          {transaction.employee && `${transaction.employee.first_name} ${transaction.employee.last_name}`}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('category')}:</span>
                        <div className="font-medium">{translateCategory(transaction.category)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('requestDate')}:</span>
                        <div className="font-medium">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      {transaction.receipt_url && (
                        <div className="col-span-2">
                          <a 
                            href={transaction.receipt_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-xs flex items-center gap-1"
                          >
                            <Receipt className="h-3 w-3" />
                            {t('receipt')}
                          </a>
                        </div>
                      )}
                    </div>
                    {transaction.rejection_reason && (
                      <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                        <span className="font-medium">{t('rejectionReason')}:</span> {transaction.rejection_reason}
                      </div>
                    )}
                    {canApprove && transaction.status === 'pending' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => approveTransaction(transaction.id)}
                          className="flex-1"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {t('approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const reason = prompt(t('reasonForRejection'));
                            if (reason) rejectTransaction(transaction.id, reason);
                          }}
                          className="flex-1"
                        >
                          <X className="h-4 w-4 mr-1" />
                          {t('reject')}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              // Desktop List Layout
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getStatusColor(transaction.status)}>
                        {translateStatus(transaction.status)}
                      </Badge>
                      <Badge variant="outline">
                        {translateTransactionType(transaction.type)}
                      </Badge>
                      {transaction.affects_balance && (
                        <Badge variant="secondary">{t('affectsBalance')}</Badge>
                      )}
                    </div>
                    <div className="font-medium">
                      {transaction.description}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                      <span>
                        {transaction.employee && `${transaction.employee.first_name} ${transaction.employee.last_name}`}
                      </span>
                      <span>•</span>
                      <span>{translateCategory(transaction.category)}</span>
                      <span>•</span>
                      <span>{new Date(transaction.created_at).toLocaleDateString()}</span>
                      {transaction.receipt_url && (
                        <>
                          <span>•</span>
                          <a 
                            href={transaction.receipt_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <Receipt className="h-3 w-3" />
                            {t('receipt')}
                          </a>
                        </>
                      )}
                    </div>
                    {transaction.rejection_reason && (
                      <div className="text-sm text-destructive">
                        {t('rejectionReason')}: {transaction.rejection_reason}
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-2 ml-4">
                    <div className="text-xl font-semibold whitespace-nowrap">
                      {transaction.currency} ${Math.abs(transaction.amount).toFixed(2)}
                    </div>
                    {canApprove && transaction.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveTransaction(transaction.id)}
                          className="h-8"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          {t('approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const reason = prompt(t('reasonForRejection'));
                            if (reason) rejectTransaction(transaction.id, reason);
                          }}
                          className="h-8"
                        >
                          <X className="h-3 w-3 mr-1" />
                          {t('reject')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashControl;