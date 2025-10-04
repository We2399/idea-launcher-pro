import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Calendar, FileText, Users, BarChart3, User, Clock, TrendingUp } from 'lucide-react';
import { useEnhancedDashboardStats } from '@/hooks/useEnhancedDashboardStats';
import { LeaveTypeBreakdown } from '@/components/dashboard/LeaveTypeBreakdown';
import { ProfileRequestsCard } from '@/components/dashboard/ProfileRequestsCard';

const Index = () => {
  const { user, userRole } = useAuth();
  const { t } = useLanguage();
  const stats = useEnhancedDashboardStats();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
        <div className="text-center space-y-6 max-w-md mx-auto p-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Leave Management System</h1>
            <p className="text-xl text-muted-foreground">
              Streamline your organization's leave management process
            </p>
          </div>
          
          <div className="space-y-4">
            <Link to="/auth">
              <Button size="lg" className="w-full">
                Get Started
              </Button>
            </Link>
            
            <div className="text-sm text-muted-foreground">
              Secure • Efficient • Easy to Use
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dashboardCards = [
    {
      title: t('leaveRequests'),
      description: 'Submit and manage your leave requests',
      icon: FileText,
      href: '/requests',
      color: 'from-blue-500/10 to-blue-600/10 border-blue-500/20'
    },
    {
      title: t('calendar'),
      description: 'View leave calendar and upcoming time off',
      icon: Calendar,
      href: '/calendar',
      color: 'from-green-500/10 to-green-600/10 border-green-500/20'
    },
    {
      title: t('profile'),
      description: 'Update your personal information',
      icon: User,
      href: '/profile',
      color: 'from-purple-500/10 to-purple-600/10 border-purple-500/20'
    }
  ];

  // Add manager/HR specific cards
  if (userRole === 'manager' || userRole === 'hr_admin') {
    dashboardCards.push({
      title: t('employees'),
      description: 'Manage your team\'s leave requests',
      icon: Users,
      href: '/employees',
      color: 'from-orange-500/10 to-orange-600/10 border-orange-500/20'
    });
  }

  if (userRole === 'hr_admin') {
    dashboardCards.push({
      title: t('reports'),
      description: 'View comprehensive leave reports',
      icon: BarChart3,
      href: '/reports',
      color: 'from-red-500/10 to-red-600/10 border-red-500/20'
    });
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome Back!</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage your leave requests and stay updated with your team's schedule
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {dashboardCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} to={card.href}>
              <Card className="card-professional h-full transition-all duration-300 hover:scale-105 animate-fade-in">
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
                <div className="text-sm text-muted-foreground font-medium">Total This Year</div>
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
                <div className="text-sm text-muted-foreground font-medium">Days Remaining</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <ProfileRequestsCard 
          stats={stats.profileChangeRequests} 
          loading={stats.loading}
        />
      </div>
      
      {/* Detailed Leave Breakdown */}
      <LeaveTypeBreakdown 
        leaveBalances={stats.leaveBalances} 
        loading={stats.loading}
      />
    </div>
  );
};

export default Index;
