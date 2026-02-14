import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardCounts } from '@/hooks/useDashboardCounts';
import { useTaskStatusCounts } from '@/hooks/useTaskStatusCounts';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';
import { CheckSquare, FileText, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MissingDocumentsAlert } from '@/components/profile/MissingDocumentsAlert';
import { AdminMissingDocumentsCard } from '@/components/dashboard/AdminMissingDocumentsCard';

/**
 * MobileDashboardData: contains ALL data hooks (Supabase queries + realtime).
 * This component is lazy-loaded and mounted only after a 2s delay so the
 * Android WebView is stable before any network activity starts.
 */
function MobileDashboardData() {
  const { userRole } = useAuth();
  const { t } = useLanguage();
  const counts = useDashboardCounts();
  const taskCounts = useTaskStatusCounts();
  const { unreadCount: unreadMessages } = useUnreadMessagesCount();

  const isAdmin = userRole === 'administrator' || userRole === 'hr_admin';

  // Get color-coded task badge info
  const getTaskBadgeInfo = () => {
    const { counts: tc } = taskCounts;
    const total = tc.pending + tc.inProgress + tc.completedUnacknowledged;
    if (total === 0) return null;

    let bgColor = 'bg-emerald-500';
    if (tc.pending > 0) bgColor = 'bg-red-500';
    else if (tc.inProgress > 0) bgColor = 'bg-amber-500';

    return { count: total, bgColor };
  };

  const taskBadgeInfo = getTaskBadgeInfo();
  const taskDisplayCount = taskBadgeInfo?.count || (userRole === 'employee' ? counts.pendingTasks : counts.allPendingTasks);
  const leaveRequests = userRole === 'employee' ? counts.pendingLeaveRequests : counts.pendingLeaveApprovals;

  return (
    <div className="space-y-4">
      {/* Missing Documents Alerts */}
      {isAdmin ? <AdminMissingDocumentsCard /> : <MissingDocumentsAlert />}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Link to="/tasks" className="group">
          <div className="card-glass rounded-2xl p-3 relative shadow-md border border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-active:scale-95">
            {taskBadgeInfo && (
              <Badge className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground h-5 min-w-[20px] flex items-center justify-center px-1.5 text-[10px] shadow-lg animate-bounce-soft">
                {taskBadgeInfo.count > 99 ? '99+' : taskBadgeInfo.count}
              </Badge>
            )}
            <div className="flex flex-col items-center gap-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 ring-1 ring-primary/20 shadow-inner">
                <CheckSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{taskDisplayCount}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{t('tasksPending')}</p>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/requests" className="group">
          <div className="card-glass rounded-2xl p-3 shadow-md border border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-active:scale-95">
            <div className="flex flex-col items-center gap-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 ring-1 ring-blue-500/20 shadow-inner">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{leaveRequests}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{t('leaveRequests')}</p>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/chat" className="group">
          <div className="card-glass rounded-2xl p-3 relative shadow-md border border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-active:scale-95">
            {unreadMessages > 0 && (
              <Badge className="absolute -top-1.5 -right-1.5 bg-destructive text-white h-5 min-w-[20px] flex items-center justify-center px-1.5 text-[10px] shadow-lg animate-bounce-soft">
                {unreadMessages > 99 ? '99+' : unreadMessages}
              </Badge>
            )}
            <div className="flex flex-col items-center gap-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 ring-1 ring-emerald-500/20 shadow-inner">
                <MessageCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{unreadMessages}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{t('messages')}</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default MobileDashboardData;
