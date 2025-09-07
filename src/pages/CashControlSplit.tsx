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
        title: 'Success',
        description: 'Cash request submitted for approval',
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
        title: 'Error',
        description: error.message || 'Failed to create cash request',
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
        title: 'Success',
        description: 'Expense report submitted successfully',
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
        title: 'Error',
        description: error.message || 'Failed to create expense report',
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
        title: 'Success',
        description: 'Transaction approved',
      });

      fetchTransactions();
      fetchCashBalance();
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('cashControlTitle')}</h1>
          <p className="text-muted-foreground">Manage cash requests and expense reports</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                + {t('cashRequest')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cash Request</DialogTitle>
                <DialogDescription>
                  Request cash advance from the company
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCashRequest} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    <Select onValueChange={(value) => setRequestData({ ...requestData, currency: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="HKD" />
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
                  <Select onValueChange={(value) => setRequestData({ ...requestData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="General" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="supplies">Office Supplies</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t('description')}</Label>
                  <Textarea
                    id="description"
                    value={requestData.description}
                    onChange={(e) => setRequestData({ ...requestData, description: e.target.value })}
                    placeholder="Please explain why you need this cash advance..."
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
              <Button variant="outline" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                + {t('newReport')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Expense Report</DialogTitle>
                <DialogDescription>
                  Submit an expense or reimbursement report
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleExpenseReport} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">{t('amount')}</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={reportData.amount}
                      onChange={(e) => setReportData({ ...reportData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">{t('currency')}</Label>
                    <Select onValueChange={(value) => setReportData({ ...reportData, currency: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="HKD" />
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">{t('type')}</Label>
                    <Select onValueChange={(value: any) => setReportData({ ...reportData, type: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Expense" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="reimbursement">Reimbursement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">{t('category')}</Label>
                    <Select onValueChange={(value) => setReportData({ ...reportData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="General" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="meals">Meals</SelectItem>
                        <SelectItem value="supplies">Office Supplies</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="groceries">Groceries</SelectItem>
                        <SelectItem value="others">Others</SelectItem>
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
                          {uploadingFile ? 'Uploading...' : 'Upload Receipt'}
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
                        ✓ Receipt uploaded successfully
                      </div>
                    )}
                    <Input
                      type="url"
                      placeholder="Or enter receipt URL manually"
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
            <div className="text-3xl font-bold text-primary">
              ${cashBalance.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Available cash balance
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('totalRequested')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${transactions
                .filter(t => t.employee_id === user?.id && t.status === 'pending')
                .reduce((sum, t) => sum + t.amount, 0)
                .toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('approved')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${transactions
                .filter(t => t.employee_id === user?.id && t.status === 'approved')
                .reduce((sum, t) => sum + t.amount, 0)
                .toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('rejected')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${transactions
                .filter(t => t.employee_id === user?.id && t.status === 'rejected')
                .reduce((sum, t) => sum + t.amount, 0)
                .toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${transactions
                .filter(t => {
                  const transactionDate = new Date(t.created_at);
                  const now = new Date();
                  return t.employee_id === user?.id && 
                         transactionDate.getMonth() === now.getMonth() &&
                         transactionDate.getFullYear() === now.getFullYear();
                })
                .reduce((sum, t) => sum + t.amount, 0)
                .toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            {canApprove ? 'Manage cash requests and expense reports' : 'Your cash transaction history'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found
              </div>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                      <Badge variant="outline">
                        {transaction.type}
                      </Badge>
                      {transaction.affects_balance && (
                        <Badge variant="secondary">Affects Balance</Badge>
                      )}
                    </div>
                    <div className="font-medium">
                      {transaction.description}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {transaction.employee && `${transaction.employee.first_name} ${transaction.employee.last_name}`} • 
                      {transaction.category} • 
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </div>
                    {transaction.rejection_reason && (
                      <div className="text-sm text-red-600">
                        Reason: {transaction.rejection_reason}
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-2">
                    <div className="text-xl font-semibold">
                      {transaction.currency} ${transaction.amount.toFixed(2)}
                    </div>
                    {canApprove && transaction.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveTransaction(transaction.id)}
                          className="h-8"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const reason = prompt('Reason for rejection:');
                            if (reason) rejectTransaction(transaction.id, reason);
                          }}
                          className="h-8"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Reject
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