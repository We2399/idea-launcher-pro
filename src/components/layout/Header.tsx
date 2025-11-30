import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogOut, User, Shield, Crown, UserCog, X } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { ImpersonationPanel } from '@/components/admin/ImpersonationPanel';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export function Header() {
  const { user, userRole, signOut } = useAuth();
  const { t } = useLanguage();
  const { isImpersonating, impersonatedUserId, endImpersonation } = useImpersonation();
  const [profile, setProfile] = useState<{ first_name: string; last_name: string } | null>(null);
  const [impersonatedProfile, setImpersonatedProfile] = useState<{ first_name: string; last_name: string } | null>(null);
  const [impersonationOpen, setImpersonationOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  useEffect(() => {
    if (impersonatedUserId) {
      fetchImpersonatedProfile();
    } else {
      setImpersonatedProfile(null);
    }
  }, [impersonatedUserId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      // Fallback to email if profile fetch fails
      setProfile(null);
    }
  };

  const fetchImpersonatedProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', impersonatedUserId)
        .single();

      if (error) throw error;
      setImpersonatedProfile(data);
    } catch (error) {
      console.error('Failed to fetch impersonated profile');
      setImpersonatedProfile(null);
    }
  };

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'administrator': return 'default';
      case 'hr_admin': return 'destructive';
      case 'manager': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'administrator': return Shield;
      case 'hr_admin': return Crown;
      case 'manager': return Shield;
      default: return User;
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'administrator': return t('roleAdministrator');
      case 'hr_admin': return t('roleHrAdmin');
      case 'manager': return t('roleManager');
      case 'employee': return t('roleEmployee');
      default: return t('roleEmployee');
    }
  };

  const RoleIcon = getRoleIcon(userRole);
  
  const displayName = profile 
    ? `${profile.first_name} ${profile.last_name}` 
    : user?.email;

  return (
    <div className="relative">
      {/* Impersonation Banner */}
      {isImpersonating && impersonatedProfile && (
        <Alert className="rounded-none border-x-0 border-t-0 bg-orange-100 border-orange-400">
          <UserCog className="h-4 w-4 text-orange-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-orange-900 font-medium">
              Viewing as: {impersonatedProfile.first_name} {impersonatedProfile.last_name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={endImpersonation}
              className="text-orange-900 hover:text-orange-950 hover:bg-orange-200"
            >
              <X className="h-4 w-4 mr-1" />
              End Impersonation
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Desktop Header - Horizontal Layout */}
      <header className="safe-area-header sticky top-0 z-40 hidden md:flex border-b border-border bg-background items-center justify-between px-4 min-h-16">
        <div className="flex items-center gap-3 min-w-0 flex-shrink">
          <SidebarTrigger className="h-8 w-8 p-1" />
          <h1 className="text-xl font-semibold text-foreground truncate">
            SME EmpRecord Hub
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <LanguageSwitcher />
          {user && (
            <>
              <NotificationBell />
              {userRole === 'administrator' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImpersonationOpen(true)}
                  className="flex items-center gap-2"
                >
                  <UserCog className="h-4 w-4" />
                  <span>Switch User</span>
                </Button>
              )}
              <Badge variant={getRoleColor(userRole)} className="flex items-center gap-1 text-xs px-2">
                <RoleIcon className="h-3 w-3" />
                <span>
                  {getRoleLabel(userRole)}
                  {isImpersonating && impersonatedProfile && (
                    <span className="text-xs"> (viewing {impersonatedProfile.first_name})</span>
                  )}
                </span>
              </Badge>
              <span className="text-sm text-muted-foreground hidden lg:inline truncate max-w-[150px]">{displayName}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOut}
                title={t('signOut')}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('signOut')}
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Mobile Header - Vertical Stacked Layout */}
      <header className="safe-area-header sticky top-0 z-40 md:hidden border-b border-border bg-background">
        {/* Top Row: Sidebar + Title */}
        <div className="flex items-center gap-2 px-2 py-2">
          <SidebarTrigger className="h-8 w-8 p-1 flex-shrink-0" />
          <h1 className="text-sm font-semibold text-foreground truncate">
            SME EmpRecord Hub
          </h1>
        </div>

        {/* Bottom Row: Actions */}
        {user && (
          <div className="flex items-center justify-between gap-2 px-2 pb-2 border-t border-border/50 pt-2">
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <NotificationBell />
              <Badge variant={getRoleColor(userRole)} className="flex items-center gap-1 text-xs px-2">
                <RoleIcon className="h-3 w-3" />
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              className="h-8 px-2"
              title={t('signOut')}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </header>

      <ImpersonationPanel 
        open={impersonationOpen} 
        onOpenChange={setImpersonationOpen}
      />
    </div>
  );
}