import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardCounts } from '@/hooks/useDashboardCounts';
import { useTaskStatusCounts } from '@/hooks/useTaskStatusCounts';
import { CheckSquare, Calendar, DollarSign, MessageCircle, FileText, Wallet, User, Search } from 'lucide-react';
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

interface Employee {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
}

export function MobileDashboard() {
  const { user, userRole } = useAuth();
  const { t } = useLanguage();
  const counts = useDashboardCounts();
  const taskCounts = useTaskStatusCounts();
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
      
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', targetUserId)
        .single();
      
      if (data?.first_name) {
        setUserName(data.first_name);
      }
      
      // Check for avatar in profile_documents
      const { data: avatarDoc } = await supabase
        .from('profile_documents')
        .select('file_path')
        .eq('user_id', targetUserId)
        .eq('document_type', 'avatar')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
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
    <div className="md:hidden min-h-screen bg-muted/30 pb-20">
      {/* Hermes Orange Header - positioned at top */}
      <div className="bg-gradient-to-br from-hermes to-hermes-dark text-white px-4 pt-3 pb-8 rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('appNameLine1')}</h1>
            <p className="text-primary-foreground/80 text-sm">{t('appNameLine2')}</p>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="pills" />
            {isAdmin ? (
              <Dialog open={impersonationOpen} onOpenChange={setImpersonationOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 bg-white/20 rounded-full px-2 py-1 hover:bg-white/30 transition-colors">
                    <Avatar className="h-6 w-6 border border-white/30">
                      <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                      <AvatarFallback className="bg-white/20 text-primary-foreground text-xs">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-primary-foreground font-medium pr-1">
                      {t('employerView')}
                    </span>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t('switchView') || 'Switch View'}</DialogTitle>
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
                        className="pl-10"
                      />
                    </div>
                    <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                      {loadingEmployees ? (
                        <p className="text-sm text-muted-foreground text-center py-4">{t('loading') || 'Loading...'}</p>
                      ) : filteredEmployees.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {searchQuery ? (t('noEmployeesFound') || 'No employees found') : (t('noEmployees') || 'No employees')}
                        </p>
                      ) : (
                        filteredEmployees.map((employee) => (
                          <div
                            key={employee.user_id}
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                            onClick={() => handleImpersonate(employee)}
                          >
                            <Avatar className="h-9 w-9">
                              <AvatarFallback>
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
            ) : (
              <Link to="/profile">
                <div className="flex items-center gap-2 bg-white/20 rounded-full px-2 py-1 hover:bg-white/30 transition-colors">
                  <Avatar className="h-6 w-6 border border-white/30">
                    <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                    <AvatarFallback className="bg-white/20 text-primary-foreground text-xs">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-primary-foreground font-medium pr-1 max-w-[60px] truncate">
                    {userName || t('profile')}
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content - more space from header */}
      <div className="px-4 mt-4 space-y-4">
        {/* Greeting Card */}
        <div className="bg-background rounded-2xl p-4 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            {getGreeting()}, {getDisplayName()}!
          </h2>
          <p className="text-muted-foreground text-sm">{t('hereTodaySummary')}</p>
        </div>

        {/* Stats Cards - Tasks & Leave */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/tasks">
            <div className={`${taskBadgeInfo?.lightBg || 'bg-amber-50 dark:bg-amber-950/30'} rounded-2xl p-3 border ${taskBadgeInfo?.borderColor || 'border-amber-200/50 dark:border-amber-800/30'} relative`}>
              {taskBadgeInfo && (
                <Badge 
                  className={`absolute -top-1 -right-1 ${taskBadgeInfo.bgColor} text-white h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs shadow-sm`}
                >
                  {taskBadgeInfo.count > 99 ? '99+' : taskBadgeInfo.count}
                </Badge>
              )}
              <div className="flex justify-center mb-1">
                <div className={`p-2 rounded-full ${taskBadgeInfo?.iconBg || 'bg-amber-100 dark:bg-amber-900/50'}`}>
                  <CheckSquare className={`h-5 w-5 ${taskBadgeInfo?.iconColor || 'text-amber-600 dark:text-amber-400'}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-center text-foreground">{taskDisplayCount}</p>
              <p className="text-xs text-center text-muted-foreground">{t('tasksPending')}</p>
            </div>
          </Link>
          
          <Link to="/requests">
            <div className="bg-purple-50 dark:bg-purple-950/30 rounded-2xl p-3 border border-purple-200/50 dark:border-purple-800/30">
              <div className="flex justify-center mb-1">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50">
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-center text-foreground">{leaveRequests}</p>
              <p className="text-xs text-center text-muted-foreground">{t('leaveRequests')}</p>
            </div>
          </Link>
        </div>

        {/* Quick Access Grid - All Features */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">{t('quickActions')}</h3>
          <div className="grid grid-cols-4 gap-2">
            <Link to="/calendar">
              <div className="bg-background rounded-xl p-3 border border-border flex flex-col items-center gap-1 hover:bg-muted/50 transition-colors">
                <Calendar className="h-5 w-5 text-blue-500" />
                <span className="text-xs font-medium text-foreground text-center">{t('calendar')}</span>
              </div>
            </Link>
            <Link to="/payroll">
              <div className="bg-background rounded-xl p-3 border border-border flex flex-col items-center gap-1 hover:bg-muted/50 transition-colors">
                <Wallet className="h-5 w-5 text-green-500" />
                <span className="text-xs font-medium text-foreground text-center">{t('payroll')}</span>
              </div>
            </Link>
            <Link to="/profile">
              <div className="bg-background rounded-xl p-3 border border-border flex flex-col items-center gap-1 hover:bg-muted/50 transition-colors">
                <User className="h-5 w-5 text-indigo-500" />
                <span className="text-xs font-medium text-foreground text-center">{t('profile')}</span>
              </div>
            </Link>
            <Link to="/cash-control">
              <div className="bg-background rounded-xl p-3 border border-border flex flex-col items-center gap-1 hover:bg-muted/50 transition-colors">
                <DollarSign className="h-5 w-5 text-rose-500" />
                <span className="text-xs font-medium text-foreground text-center">{t('expenses')}</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Chat Quick Action */}
        <div>
          <Link to="/chat">
            <div className="bg-gradient-to-r from-hermes to-hermes-dark rounded-2xl p-4 flex items-center gap-3 hover:opacity-90 transition-opacity">
              <MessageCircle className="h-6 w-6 text-white" />
              <span className="text-sm font-medium text-white">{t('sendMessage')}</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
