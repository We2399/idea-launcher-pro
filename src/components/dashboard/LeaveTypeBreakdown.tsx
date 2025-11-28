import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Calendar, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslationHelpers } from '@/lib/translations';

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
  const { translateLeaveType } = useTranslationHelpers();
  
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leaveBalances.map((balance) => {
            const remainingPercentage = balance.totalDays > 0 
              ? (balance.remainingDays / balance.totalDays) * 100 
              : 0;
            
            return (
              <Card key={balance.leaveTypeId} variant="glass" className="card-glow p-6 space-y-4 hover:scale-105 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full shadow-sm" 
                      style={{ backgroundColor: balance.color }}
                    />
                    <span className="font-semibold text-sm">{translateLeaveType(balance.leaveTypeName)}</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center space-y-3">
                  <CircularProgress 
                    value={remainingPercentage}
                    size={100}
                    strokeWidth={10}
                    color={balance.color}
                    showPercentage={true}
                  />
                  
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold text-foreground">
                      {balance.remainingDays}
                      <span className="text-sm text-muted-foreground font-normal">/{balance.totalDays}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('daysRemaining')}
                    </div>
                  </div>
                  
                  <div className="flex justify-between w-full text-xs text-muted-foreground pt-2 border-t border-border/50">
                    <span>{t('used')}: <span className="font-semibold text-foreground">{balance.usedDays}</span></span>
                    <span>{t('remaining')}: <span className="font-semibold text-foreground">{balance.remainingDays}</span></span>
                  </div>
                </div>
              </Card>
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