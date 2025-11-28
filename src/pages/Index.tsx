import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Calendar, FileText, Users, BarChart3, User, Clock, TrendingUp, CheckSquare, DollarSign } from 'lucide-react';
import { useEnhancedDashboardStats } from '@/hooks/useEnhancedDashboardStats';
import { useDashboardCounts } from '@/hooks/useDashboardCounts';
import { LeaveTypeBreakdown } from '@/components/dashboard/LeaveTypeBreakdown';
import { ProfileRequestsCard } from '@/components/dashboard/ProfileRequestsCard';
import { StorageCentreAlert } from '@/components/dashboard/StorageCentreAlert';
import { DocumentIssuesCard } from '@/components/dashboard/DocumentIssuesCard';
import { EmployeeDiscussionAlertsCard } from '@/components/dashboard/EmployeeDiscussionAlertsCard';
import { AdminPendingDiscussionsCard } from '@/components/dashboard/AdminPendingDiscussionsCard';
import { AdminNeedsReplyCard } from '@/components/dashboard/AdminNeedsReplyCard';
import { QuickActions } from '@/components/dashboard/QuickActions';

const Index = () => {
  const { user, userRole } = useAuth();
  const { impersonatedUserId } = useImpersonation();
  const { t } = useLanguage();
  const stats = useEnhancedDashboardStats();
  const counts = useDashboardCounts();
  
  // Show impersonation indicator for administrators
  const isImpersonating = userRole === 'administrator' && impersonatedUserId;

  // Helper function to get pending count for each card
  const getPendingCountForCard = (href: string): number => {
    const isEmployee = userRole === 'employee';
    
    switch(href) {
      case '/requests': 
        return isEmployee ? counts.pendingLeaveRequests : counts.pendingLeaveApprovals;
      case '/cash-control': 
        return isEmployee ? counts.pendingCashRequests : counts.pendingCashApprovals;
      case '/profile': 
        return isEmployee 
          ? counts.pendingProfileChanges + counts.documentsNeedingReply
          : counts.pendingProfileApprovals;
      case '/employees': 
        return counts.pendingDocumentApprovals + counts.discussionsNeedingReply;
      case '/tasks':
        return isEmployee ? counts.pendingTasks : counts.allPendingTasks;
      default: 
        return 0;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen safe-area-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="text-center space-y-6 max-w-md mx-auto p-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">{t('leaveManagementSystem')}</h1>
            <p className="text-xl text-muted-foreground">{t('landingSubtitle')}</p>
          </div>
          
          <div className="space-y-4">
            <Link to="/auth">
              <Button size="lg" className="w-full">
                {t('getStarted')}
              </Button>
            </Link>
            
            <div className="text-sm text-muted-foreground">
              {t('secureEfficientEasy')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dashboardCards = [
    {
      title: t('leaveRequests'),
      description: t('manageLeaveRequestsDescription'),
      icon: FileText,
      href: '/requests',
      color: 'from-blue-500/10 to-blue-600/10 border-blue-500/20'
    },
    {
      title: t('calendar'),
      description: t('dashboardCalendarDescription'),
      icon: Calendar,
      href: '/calendar',
      color: 'from-green-500/10 to-green-600/10 border-green-500/20'
    },
    {
      title: t('profile'),
      description: t('updatePersonalInfoDescription'),
      icon: User,
      href: '/profile',
      color: 'from-purple-500/10 to-purple-600/10 border-purple-500/20'
    }
  ];

  // Add Tasks card for all users
  dashboardCards.push({
    title: t('tasks'),
    description: t('manageTasks'),
    icon: CheckSquare,
    href: '/tasks',
    color: 'from-cyan-500/10 to-cyan-600/10 border-cyan-500/20'
  });

  // Add Cash Control card for all users
  dashboardCards.push({
    title: t('cashControl'),
    description: t('cashControlDescription'),
    icon: DollarSign,
    href: '/cash-control',
    color: 'from-amber-500/10 to-amber-600/10 border-amber-500/20'
  });

  // Add management-specific cards for hr_admin and administrator
  if (userRole === 'hr_admin' || userRole === 'administrator') {
    dashboardCards.push({
      title: t('employees'),
      description: t('manageTeamRequestsDescription'),
      icon: Users,
      href: '/employees',
      color: 'from-orange-500/10 to-orange-600/10 border-orange-500/20'
    });
    
    dashboardCards.push({
      title: t('reports'),
      description: t('viewLeaveReportsDescription'),
      icon: BarChart3,
      href: '/reports',
      color: 'from-red-500/10 to-red-600/10 border-red-500/20'
    });
  }

  return (
    <div className="min-h-screen safe-area-screen px-4 md:px-8 pb-6 md:pb-10 space-y-6 md:space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {userRole === 'administrator' 
            ? (isImpersonating ? `Dashboard - Viewing Employee Data` : 'Administrator Dashboard')
            : t('welcomeBack')}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {userRole === 'administrator' 
            ? (isImpersonating 
                ? 'Managing selected employee\'s information and requests' 
                : 'System-wide management and settings')
            : t('dashboardSubtitle')}
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          const pendingCount = getPendingCountForCard(card.href);
          
          return (
            <Link key={card.title} to={card.href}>
              <Card variant="glass" className="card-glow h-full transition-all duration-300 hover:scale-105 animate-fade-in relative border-border/50">
                {pendingCount > 0 && (
                  <Badge 
                    className="absolute top-2 right-2 bg-primary text-primary-foreground h-6 min-w-[24px] flex items-center justify-center px-2 shadow-lg animate-pulse"
                  >
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </Badge>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-primary shadow-sm">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg font-semibold">{card.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {card.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Real-time Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="card-professional animate-slide-up">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
                <Clock className="h-6 w-6 text-orange-600" />
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
              <div className="p-3 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                <Calendar className="h-6 w-6 text-emerald-600" />
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

       {/* Role-specific alerts */}
       {(userRole === 'administrator' || userRole === 'hr_admin') && (
         <div className="mt-4 space-y-4">
           <StorageCentreAlert />
           <AdminPendingDiscussionsCard />
           <AdminNeedsReplyCard />
         </div>
       )}
       {userRole === 'employee' && (
         <div className="mt-4 space-y-4">
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
};

export default Index;
