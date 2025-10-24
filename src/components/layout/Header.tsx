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

      <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 gap-2">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <SidebarTrigger />
          <h1 className="text-base md:text-xl font-semibold text-foreground truncate">SME EmpRecord Hub</h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <LanguageSwitcher />
          {user && (
            <>
              {userRole === 'administrator' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImpersonationOpen(true)}
                  className="flex items-center gap-2"
                >
                  <UserCog className="h-4 w-4" />
                  <span className="hidden md:inline">Switch User</span>
                </Button>
              )}
              <div className="hidden sm:flex items-center gap-2">
                <Badge variant={getRoleColor(userRole)} className="flex items-center gap-1">
                  <RoleIcon className="h-3 w-3" />
                  <span className="hidden md:inline">
                    {getRoleLabel(userRole)}
                    {isImpersonating && ' (Impersonating)'}
                  </span>
                </Badge>
                <span className="text-sm text-muted-foreground hidden lg:inline truncate max-w-[150px]">{displayName}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t('signOut')}</span>
              </Button>
            </>
          )}
        </div>
      </header>

      <ImpersonationPanel 
        open={impersonationOpen} 
        onOpenChange={setImpersonationOpen}
      />
    </div>
  );
}