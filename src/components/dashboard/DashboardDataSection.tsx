import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, TrendingUp, Calendar } from 'lucide-react';
import { useEnhancedDashboardStats } from '@/hooks/useEnhancedDashboardStats';
import { LeaveTypeBreakdown } from '@/components/dashboard/LeaveTypeBreakdown';
import { ProfileRequestsCard } from '@/components/dashboard/ProfileRequestsCard';
import { StorageCentreAlert } from '@/components/dashboard/StorageCentreAlert';
import { DocumentIssuesCard } from '@/components/dashboard/DocumentIssuesCard';
import { AdminMissingDocumentsCard } from '@/components/dashboard/AdminMissingDocumentsCard';
import { MissingDocumentsAlert } from '@/components/profile/MissingDocumentsAlert';
import { EmployeeDiscussionAlertsCard } from '@/components/dashboard/EmployeeDiscussionAlertsCard';
import { AdminPendingDiscussionsCard } from '@/components/dashboard/AdminPendingDiscussionsCard';
import { AdminNeedsReplyCard } from '@/components/dashboard/AdminNeedsReplyCard';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { PayrollCard } from '@/components/dashboard/PayrollCard';

/**
 * All dashboard data (stats, alerts, payroll) lives here so it can be
 * lazy-loaded and staged-mounted separately from the static navigation shell.
 * This prevents the Android WebView from being overwhelmed by 15+ concurrent
 * Supabase queries at mount time.
 */
function DashboardDataSection() {
  const { userRole } = useAuth();
  const { t } = useLanguage();
  const stats = useEnhancedDashboardStats();

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Quick Actions */}
      <QuickActions />

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="card-professional animate-slide-up">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10 ring-1 ring-accent/20">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-foreground">
                  {stats.loading ? (
                    <div className="h-8 w-12 bg-muted animate-pulse rounded" />
                  ) : (
                    stats.pendingRequests
                  )}
                </div>
                <div className="text-sm text-muted-foreground font-medium">{t('pendingRequests')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-professional animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-foreground">
                  {stats.loading ? (
                    <div className="h-8 w-12 bg-muted animate-pulse rounded" />
                  ) : (
                    stats.totalRequests
                  )}
                </div>
                <div className="text-sm text-muted-foreground font-medium">{t('totalThisYear')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-professional animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-foreground">
                  {stats.loading ? (
                    <div className="h-8 w-12 bg-muted animate-pulse rounded" />
                  ) : (
                    stats.leaveBalances.reduce((sum, balance) => sum + balance.remainingDays, 0)
                  )}
                </div>
                <div className="text-sm text-muted-foreground font-medium">{t('daysRemaining')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <ProfileRequestsCard 
          stats={stats.profileChangeRequests} 
          loading={stats.loading}
        />
      </div>

      {/* Payroll Card */}
      <PayrollCard />

      {/* Role-specific alerts */}
      {(userRole === 'administrator' || userRole === 'hr_admin') && (
        <div className="space-y-4">
          <AdminMissingDocumentsCard />
          <StorageCentreAlert />
          <AdminPendingDiscussionsCard />
          <AdminNeedsReplyCard />
        </div>
      )}
      {userRole === 'employee' && (
        <div className="space-y-4">
          <MissingDocumentsAlert />
          <DocumentIssuesCard />
          <EmployeeDiscussionAlertsCard />
        </div>
      )}
      
      {/* Detailed Leave Breakdown */}
      <LeaveTypeBreakdown 
        leaveBalances={stats.leaveBalances} 
        loading={stats.loading}
      />
    </div>
  );
}

export default DashboardDataSection;
