import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeePayrollView } from '@/components/payroll/EmployeePayrollView';
import { HRPayrollView } from '@/components/payroll/HRPayrollView';
import { AdminPayrollView } from '@/components/payroll/AdminPayrollView';

export default function Payroll() {
  const { userRole } = useAuth();
  const { t } = useLanguage();

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAdmin = userRole === 'administrator';
  const isHR = userRole === 'hr_admin';
  const isEmployee = userRole === 'employee';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('payroll')}</h1>
        <p className="text-muted-foreground mt-2">{t('payrollDescription')}</p>
      </div>

      {isEmployee && <EmployeePayrollView />}

      {(isHR || isAdmin) && (
        <Tabs defaultValue={isAdmin ? "approval" : "manage"} className="w-full">
          <TabsList>
            {isAdmin && (
              <TabsTrigger value="approval">{t('approvalQueue')}</TabsTrigger>
            )}
            <TabsTrigger value="manage">{t('managePayroll')}</TabsTrigger>
            <TabsTrigger value="history">{t('payrollHistory')}</TabsTrigger>
          </TabsList>

          {isAdmin && (
            <TabsContent value="approval">
              <AdminPayrollView />
            </TabsContent>
          )}

          <TabsContent value="manage">
            <HRPayrollView />
          </TabsContent>

          <TabsContent value="history">
            <HRPayrollView showHistoryOnly />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
