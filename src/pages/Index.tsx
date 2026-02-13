import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, FileText, Users, BarChart3, User, CheckSquare, DollarSign } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// Staged loading: delays heavy component mounting to prevent Android WebView crash
function useStagedLoad(delayMs: number) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);
  return ready;
}

const LoadingPlaceholder = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-8 h-8 border-3 border-muted border-t-primary rounded-full animate-spin" />
  </div>
);

// Lazy-load ALL data-heavy components to prevent simultaneous query storms
const MobileDashboardLazy = React.lazy(() => 
  import('@/components/dashboard/MobileDashboard').then(m => ({ default: m.MobileDashboard }))
);
const DashboardDataSection = React.lazy(() => import('@/components/dashboard/DashboardDataSection'));

const Index = () => {
  const { user, userRole } = useAuth();
  const { impersonatedUserId } = useImpersonation();
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  // Delay mounting data-heavy sections to let the shell render first
  const dataReady = useStagedLoad(600);
  
  const isImpersonating = userRole === 'administrator' && impersonatedUserId;

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
              <Button size="lg" className="w-full">{t('getStarted')}</Button>
            </Link>
            <div className="text-sm text-muted-foreground">{t('secureEfficientEasy')}</div>
          </div>
        </div>
      </div>
    );
  }

  // Mobile: lazy load the entire mobile dashboard
  if (isMobile) {
    if (!dataReady) return <LoadingPlaceholder />;
    return (
      <Suspense fallback={<LoadingPlaceholder />}>
        <MobileDashboardLazy />
      </Suspense>
    );
  }

  // Desktop: show static navigation cards immediately, lazy-load stats below
  const dashboardCards = [
    { title: t('leaveRequests'), icon: FileText, href: '/requests' },
    { title: t('calendar'), icon: Calendar, href: '/calendar' },
    { title: t('profile'), icon: User, href: '/profile' },
    { title: t('tasks'), icon: CheckSquare, href: '/tasks' },
    { title: t('cashControl'), icon: DollarSign, href: '/cash-control' },
  ];

  if (userRole === 'hr_admin' || userRole === 'administrator') {
    dashboardCards.push(
      { title: t('employees'), icon: Users, href: '/employees' },
      { title: t('reports'), icon: BarChart3, href: '/reports' },
    );
  }

  return (
    <div className="min-h-screen safe-area-screen px-4 md:px-8 pb-6 md:pb-10 space-y-6 md:space-y-8 relative overflow-y-auto">
      {/* Header - renders instantly */}
      <div className="text-center md:text-left space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {userRole === 'administrator' 
            ? (isImpersonating ? 'Dashboard - Viewing Employee Data' : 'Administrator Dashboard')
            : t('welcomeBack')}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {userRole === 'administrator' 
            ? (isImpersonating 
                ? "Managing selected employee's information and requests" 
                : 'System-wide management and settings')
            : t('dashboardSubtitle')}
        </p>
      </div>

      {/* Navigation cards - static, no data queries */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} to={card.href}>
              <div className="card-glass relative rounded-2xl p-4 md:p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95 border-border/50">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="p-3 md:p-4 rounded-xl bg-gradient-primary shadow-sm">
                    <Icon className="h-6 w-6 md:h-7 md:w-7 text-white" />
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-foreground leading-tight">
                    {card.title}
                  </h3>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Data-heavy sections: only mount after delay to prevent WebView crash */}
      {dataReady ? (
        <Suspense fallback={<LoadingPlaceholder />}>
          <DashboardDataSection />
        </Suspense>
      ) : (
        <LoadingPlaceholder />
      )}
    </div>
  );
};

export default Index;
