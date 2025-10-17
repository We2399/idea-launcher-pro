import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface LeaveTypeBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  totalDays: number;
  remainingDays: number;
  usedDays: number;
  color: string;
}

interface LeaveTypeBreakdownProps {
  leaveBalances: LeaveTypeBalance[];
  loading: boolean;
}

export function LeaveTypeBreakdown({ leaveBalances, loading }: LeaveTypeBreakdownProps) {
  const { userRole } = useAuth();
  const { t } = useLanguage();
  
  if (loading) {
    return (
      <Card className="card-professional col-span-full animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('leaveBalanceDetails')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-2 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRemaining = leaveBalances.reduce((sum, balance) => sum + balance.remainingDays, 0);
  const totalUsed = leaveBalances.reduce((sum, balance) => sum + balance.usedDays, 0);
  const totalAllocated = leaveBalances.reduce((sum, balance) => sum + balance.totalDays, 0);

  return (
    <Card className="card-professional col-span-full animate-slide-up">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {userRole === 'employee' ? (
              <Calendar className="h-5 w-5" />
            ) : (
              <Users className="h-5 w-5" />
            )}
            {userRole === 'employee' ? t('myLeaveBalance') : t('teamLeaveOverview')}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {totalRemaining} {t('of')} {totalAllocated} {t('daysRemaining')}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leaveBalances.map((balance) => {
            const usagePercentage = balance.totalDays > 0 
              ? (balance.usedDays / balance.totalDays) * 100 
              : 0;
            
            return (
              <div key={balance.leaveTypeId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: balance.color }}
                    />
                    <span className="font-medium text-sm">{balance.leaveTypeName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {balance.remainingDays}/{balance.totalDays}
                  </span>
                </div>
                <div className="space-y-1">
                  <Progress 
                    value={100 - usagePercentage} 
                    className="h-2"
                    style={{
                      '--progress-foreground': balance.color
                    } as React.CSSProperties}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{t('used')}: {balance.usedDays}</span>
                    <span>{t('remaining')}: {balance.remainingDays}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {totalAllocated === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t('noLeaveAllocations')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}