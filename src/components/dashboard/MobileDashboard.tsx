import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardCounts } from '@/hooks/useDashboardCounts';
import { useTaskStatusCounts } from '@/hooks/useTaskStatusCounts';
import { useUnreadMessagesCount } from '@/hooks/useUnreadMessagesCount';
import { CheckSquare, Calendar, DollarSign, MessageCircle, FileText, Wallet, User, Search, Sparkles, Star } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Badge } from '@/components/ui/badge';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import jiejieLadyIcon from '@/assets/jiejie-lady-icon.png';
import { MissingDocumentsAlert } from '@/components/profile/MissingDocumentsAlert';
import { AdminMissingDocumentsCard } from '@/components/dashboard/AdminMissingDocumentsCard';

interface Employee {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
}

export function MobileDashboard() {
  const { user, userRole, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const counts = useDashboardCounts();
  const taskCounts = useTaskStatusCounts();
  const { unreadCount: unreadMessages } = useUnreadMessagesCount();
  const { isImpersonating, impersonatedUserId, startImpersonation } = useImpersonation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [impersonationOpen, setImpersonationOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  
  const isAdmin = userRole === 'administrator' || userRole === 'hr_admin';
  
  // Fetch user's first name and avatar
  useEffect(() => {
    const fetchUserProfile = async () => {
      const targetUserId = isImpersonating ? impersonatedUserId : user?.id;
      if (!targetUserId) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', targetUserId)
          .maybeSingle();
        
        if (data?.first_name) {
          setUserName(data.first_name);
        }
      } catch (err) {
        console.warn('Failed to fetch user profile:', err);
      }
      
      // Check for avatar in profile_documents (separate try/catch so profile name still works)
      try {
        const { data: avatarDoc } = await supabase
          .from('profile_documents')
          .select('file_path')
          .eq('user_id', isImpersonating ? impersonatedUserId! : user!.id)
          .eq('document_type', 'avatar')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (avatarDoc?.file_path) {
          const { data: signedUrl } = await supabase.storage
            .from('profile-documents')
            .createSignedUrl(avatarDoc.file_path, 3600);
          if (signedUrl?.signedUrl) {
            setAvatarUrl(signedUrl.signedUrl);
          }
        } else {
          setAvatarUrl(null);
        }
      } catch (err) {
        console.warn('Failed to fetch avatar:', err);
        setAvatarUrl(null);
      }
    };
    
    fetchUserProfile();
  }, [user?.id, isImpersonating, impersonatedUserId]);
  
  const getInitials = () => {
    if (userName) return userName.charAt(0).toUpperCase();
    return isAdmin ? 'E' : 'H';
  };

  // Fetch employees when impersonation dialog opens
  useEffect(() => {
    if (impersonationOpen && isAdmin) {
      fetchEmployees();
    }
  }, [impersonationOpen, isAdmin]);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email, department, position')
        .order('first_name');
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const searchLower = searchQuery.toLowerCase();
    return (
      emp.first_name?.toLowerCase().includes(searchLower) ||
      emp.last_name?.toLowerCase().includes(searchLower) ||
      emp.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleImpersonate = (employee: Employee) => {
    startImpersonation(employee.user_id);
    toast({
      title: t('impersonationStarted') || 'Impersonation Started',
      description: `${t('nowViewingAs') || 'Now viewing as'} ${employee.first_name} ${employee.last_name}`
    });
    setImpersonationOpen(false);
    navigate('/');
  };

  const getEmployeeInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };
  
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

  // Get color-coded task badge info
  const getTaskBadgeInfo = () => {
    const { counts } = taskCounts;
    const total = counts.pending + counts.inProgress + counts.completedUnacknowledged;
    
    if (total === 0) return null;
    
    // Priority: red (new) > amber (in progress) > green (completed but not acknowledged)
    let bgColor = 'bg-emerald-500';
    let borderColor = 'border-emerald-200/50 dark:border-emerald-800/30';
    let lightBg = 'bg-emerald-50 dark:bg-emerald-950/30';
    let iconBg = 'bg-emerald-100 dark:bg-emerald-900/50';
    let iconColor = 'text-emerald-600 dark:text-emerald-400';
    
    if (counts.pending > 0) {
      bgColor = 'bg-red-500';
      borderColor = 'border-red-200/50 dark:border-red-800/30';
      lightBg = 'bg-red-50 dark:bg-red-950/30';
      iconBg = 'bg-red-100 dark:bg-red-900/50';
      iconColor = 'text-red-600 dark:text-red-400';
    } else if (counts.inProgress > 0) {
      bgColor = 'bg-amber-500';
      borderColor = 'border-amber-200/50 dark:border-amber-800/30';
      lightBg = 'bg-amber-50 dark:bg-amber-950/30';
      iconBg = 'bg-amber-100 dark:bg-amber-900/50';
      iconColor = 'text-amber-600 dark:text-amber-400';
    }
    
    return { count: total, bgColor, borderColor, lightBg, iconBg, iconColor };
  };

  const taskBadgeInfo = getTaskBadgeInfo();
  const taskDisplayCount = taskBadgeInfo?.count || (userRole === 'employee' ? counts.pendingTasks : counts.allPendingTasks);
  const leaveRequests = userRole === 'employee' ? counts.pendingLeaveRequests : counts.pendingLeaveApprovals;

  return (
    <div className="md:hidden min-h-screen bg-gradient-to-b from-background via-background to-muted/30 pb-20 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float" />
      <div className="absolute top-60 -left-32 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-40 right-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      {/* Header with glass effect */}
      <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 text-white px-4 pt-3 pb-10 rounded-b-[2rem] shadow-xl">
        {/* Decorative sparkles */}
        <div className="absolute top-4 right-20 animate-pulse-soft">
          <Sparkles className="h-4 w-4 text-white/30" />
        </div>
        <div className="absolute bottom-6 left-10 animate-pulse-soft" style={{ animationDelay: '0.5s' }}>
          <Star className="h-3 w-3 text-white/20" />
        </div>
        
        {/* Top row: Brand + Language switcher */}
        <div className="flex items-center justify-between relative z-10 mb-3">
          <div className="flex items-center gap-3">
            {/* Jie Jie Lady Icon with glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-md animate-pulse-soft" />
              <img 
                src={jiejieLadyIcon} 
                alt="Jie Jie" 
                className="h-10 w-10 rounded-full ring-2 ring-white/30 shadow-lg relative z-10"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t('appNameLine1')}</h1>
              <p className="text-white/70 text-xs">{t('appNameLine2')}</p>
            </div>
          </div>
          <LanguageSwitcher variant="pills" />
        </div>
        
        {/* Second row: User avatar + Employer View button (separated) */}
        <div className="flex items-center justify-end gap-2 relative z-10">
          {/* User Profile Avatar */}
          <Link to="/profile">
            <Avatar className="h-8 w-8 ring-2 ring-white/40 shadow-lg hover:scale-110 transition-transform">
              <AvatarImage src={avatarUrl || undefined} alt="Profile" />
              <AvatarFallback className="bg-white/30 text-primary-foreground text-sm font-medium">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          {/* Employer View button - only for admin */}
          {isAdmin && (
            <Dialog open={impersonationOpen} onOpenChange={setImpersonationOpen}>
              <DialogTrigger asChild>
                <button className="card-glass rounded-full px-3 py-1.5 hover:bg-white/30 transition-all duration-300 hover:scale-105">
                  <span className="text-xs text-primary-foreground font-medium">
                    {t('employerView')}
                  </span>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto card-glass border-white/20">
                <DialogHeader>
                  <DialogTitle className="text-gradient">{t('switchView') || 'Switch View'}</DialogTitle>
                  <DialogDescription>
                    {t('selectEmployeeToView') || 'Select an employee to view the system as them'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('searchEmployees') || 'Search employees...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {loadingEmployees ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                      </div>
                    ) : filteredEmployees.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {searchQuery ? (t('noEmployeesFound') || 'No employees found') : (t('noEmployees') || 'No employees')}
                      </p>
                    ) : (
                      filteredEmployees.map((employee) => (
                        <div
                          key={employee.user_id}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-accent/50 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                          onClick={() => handleImpersonate(employee)}
                        >
                          <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getEmployeeInitials(employee.first_name, employee.last_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {employee.first_name} {employee.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{employee.position}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      {/* White separator line */}
      <div className="h-1 w-full bg-white/80 shadow-sm" />

      {/* Content */}
      <div className="px-4 mt-4 space-y-4 relative z-10">
        {/* Greeting Card with glass effect and illustration */}
        <div className="card-glass rounded-2xl p-5 shadow-lg border border-white/20 relative overflow-hidden">
          {/* Decorative gradient blob */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-2xl" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">
                {getGreeting()}, <span className="text-gradient">{getDisplayName()}</span>!
              </h2>
              <p className="text-muted-foreground text-sm mt-1">{t('hereTodaySummary')}</p>
            </div>
            {/* Illustration placeholder */}
            <div className="hidden xs:block relative">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary/60 animate-pulse-soft" />
              </div>
            </div>
          </div>
        </div>

        {/* Missing Documents Alerts */}
        {isAdmin ? <AdminMissingDocumentsCard /> : <MissingDocumentsAlert />}

        {/* Stats Cards with glassmorphism */}
        <div className="grid grid-cols-3 gap-3">
          <Link to="/tasks" className="group">
            <div className="card-glass rounded-2xl p-3 relative shadow-md border border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-active:scale-95">
              {taskBadgeInfo && (
                <Badge 
                  className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground h-5 min-w-[20px] flex items-center justify-center px-1.5 text-[10px] shadow-lg animate-bounce-soft"
                >
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
                <Badge 
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-white h-5 min-w-[20px] flex items-center justify-center px-1.5 text-[10px] shadow-lg animate-bounce-soft"
                >
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

        {/* Quick Access Grid with feature cards */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-semibold text-foreground">{t('quickActions')}</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Link to="/calendar" className="group">
              <div className="card-glass rounded-xl p-3 flex flex-col items-center gap-2 shadow-sm border border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-active:scale-95">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/10 ring-1 ring-green-500/20">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-xs font-medium text-foreground text-center leading-tight">{t('calendar')}</span>
              </div>
            </Link>
            <Link to="/payroll" className="group">
              <div className="card-glass rounded-xl p-3 flex flex-col items-center gap-2 shadow-sm border border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-active:scale-95">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/10 ring-1 ring-purple-500/20">
                  <Wallet className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-foreground text-center leading-tight">{t('payroll')}</span>
              </div>
            </Link>
            <Link to="/profile" className="group">
              <div className="card-glass rounded-xl p-3 flex flex-col items-center gap-2 shadow-sm border border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-active:scale-95">
                <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 ring-1 ring-cyan-500/20">
                  <User className="h-5 w-5 text-cyan-600" />
                </div>
                <span className="text-xs font-medium text-foreground text-center leading-tight">{t('profile')}</span>
              </div>
            </Link>
            <Link to="/cash-control" className="group">
              <div className="card-glass rounded-xl p-3 flex flex-col items-center gap-2 shadow-sm border border-white/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-active:scale-95">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/10 ring-1 ring-amber-500/20">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-foreground text-center leading-tight">{t('expenses')}</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Chat Quick Action with enhanced styling */}
        <div>
          <Link to="/chat" className="group block">
            <div className="card-glass rounded-2xl p-4 flex items-center gap-4 shadow-md border border-white/10 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl group-active:scale-[0.98] relative overflow-hidden">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 ring-1 ring-primary/20 relative z-10">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 relative z-10">
                <span className="text-sm font-semibold text-foreground">{t('sendMessage')}</span>
                <p className="text-xs text-muted-foreground">{t('chatWithTeam') || 'Connect with your team'}</p>
              </div>
              <Sparkles className="h-5 w-5 text-primary/40 animate-pulse-soft relative z-10" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
