import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardCounts } from '@/hooks/useDashboardCounts';
import { CheckSquare, Calendar, DollarSign, MessageCircle } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Badge } from '@/components/ui/badge';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { supabase } from '@/integrations/supabase/client';

export function MobileDashboard() {
  const { user, userRole } = useAuth();
  const { t } = useLanguage();
  const counts = useDashboardCounts();
  const { isImpersonating, impersonatedUserId } = useImpersonation();
  const [userName, setUserName] = useState<string>('');
  
  const isAdmin = userRole === 'administrator' || userRole === 'hr_admin';
  
  // Fetch user's first name
  useEffect(() => {
    const fetchUserName = async () => {
      const targetUserId = isImpersonating ? impersonatedUserId : user?.id;
      if (!targetUserId) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('user_id', targetUserId)
        .single();
      
      if (data?.first_name) {
        setUserName(data.first_name);
      }
    };
    
    fetchUserName();
  }, [user?.id, isImpersonating, impersonatedUserId]);
  
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning');
    if (hour < 18) return t('goodAfternoon');
    return t('goodEvening');
  };
  
  const getDisplayName = () => {
    if (userName) return userName;
    return isAdmin ? t('employer') : t('helper');
  };

  const tasksPending = userRole === 'employee' ? counts.pendingTasks : counts.allPendingTasks;
  const leaveRequests = userRole === 'employee' ? counts.pendingLeaveRequests : counts.pendingLeaveApprovals;

  return (
    <div className="md:hidden min-h-screen bg-muted/30 pb-20">
      {/* Hermes Orange Header */}
      <div className="bg-gradient-to-br from-hermes to-hermes-dark text-white px-4 pt-safe pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-2xl font-bold">{t('appNameLine1')}</h1>
            <p className="text-primary-foreground/80 text-sm">{t('appNameLine2')}</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="pills" />
            <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-0 rounded-full px-3 py-1">
              {isAdmin ? '👤 ' + t('employerView') : '👤 ' + t('helperView')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-4 space-y-4">
        {/* Greeting Card */}
        <div className="bg-background rounded-2xl p-4 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            {getGreeting()}, {getDisplayName()}!
          </h2>
          <p className="text-muted-foreground text-sm">{t('hereTodaySummary')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/tasks">
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 border border-amber-200/50 dark:border-amber-800/30">
              <div className="flex justify-center mb-2">
                <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/50">
                  <CheckSquare className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-center text-foreground">{tasksPending}</p>
              <p className="text-sm text-center text-muted-foreground">{t('tasksPending')}</p>
            </div>
          </Link>
          
          <Link to="/requests">
            <div className="bg-purple-50 dark:bg-purple-950/30 rounded-2xl p-4 border border-purple-200/50 dark:border-purple-800/30">
              <div className="flex justify-center mb-2">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/50">
                  <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-center text-foreground">{leaveRequests}</p>
              <p className="text-sm text-center text-muted-foreground">{t('leaveRequests')}</p>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">{t('quickActions')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/cash-control">
              <div className="bg-background rounded-2xl p-4 border border-border flex items-center gap-3 hover:bg-muted/50 transition-colors">
                <DollarSign className="h-5 w-5 text-rose-500" />
                <span className="text-sm font-medium text-foreground">{t('recordExpense')}</span>
              </div>
            </Link>
            <Link to="/chat">
              <div className="bg-background rounded-2xl p-4 border border-border flex items-center gap-3 hover:bg-muted/50 transition-colors">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-foreground">{t('sendMessage')}</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
