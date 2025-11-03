import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePayrollCounts } from '@/hooks/usePayrollNotifications';
import { useNavigate } from 'react-router-dom';
import { Wallet, AlertCircle, Clock, CheckCircle } from 'lucide-react';

export function PayrollCard() {
  const { t } = useLanguage();
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { pendingConfirmations, pendingApprovals, overdueConfirmations, disputedCount } = usePayrollCounts();

  if (userRole === 'employee') {
    if (!pendingConfirmations || pendingConfirmations === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            {t('payroll')}
          </CardTitle>
          <CardDescription>{t('confirmPaymentReceipt')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="font-semibold text-yellow-900">{t('pendingConfirmation')}</div>
                  <div className="text-sm text-yellow-800">
                    {pendingConfirmations} {t('paymentsAwaitingConfirmation')}
                  </div>
                </div>
              </div>
              <Badge variant="secondary">{pendingConfirmations}</Badge>
            </div>
            <Button onClick={() => navigate('/payroll')} className="w-full">
              {t('viewPayroll')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userRole === 'administrator') {
    if (!pendingApprovals && !disputedCount) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            {t('payrollApprovals')}
          </CardTitle>
          <CardDescription>{t('reviewAndApprovePayroll')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingApprovals > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">{t('pendingApprovals')}</span>
                </div>
                <Badge variant="secondary">{pendingApprovals}</Badge>
              </div>
            )}
            {disputedCount > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">{t('disputedPayrolls')}</span>
                </div>
                <Badge variant="destructive">{disputedCount}</Badge>
              </div>
            )}
            <Button onClick={() => navigate('/payroll')} className="w-full">
              {t('managePayroll')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userRole === 'hr_admin') {
    if (!overdueConfirmations && !disputedCount) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            {t('payrollManagement')}
          </CardTitle>
          <CardDescription>{t('monitorPayrollStatus')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {overdueConfirmations > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">{t('overdueConfirmations')}</span>
                </div>
                <Badge variant="secondary">{overdueConfirmations}</Badge>
              </div>
            )}
            {disputedCount > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">{t('disputedPayrolls')}</span>
                </div>
                <Badge variant="destructive">{disputedCount}</Badge>
              </div>
            )}
            <Button onClick={() => navigate('/payroll')} className="w-full">
              {t('managePayroll')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
