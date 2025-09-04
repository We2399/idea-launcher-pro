import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, User, Shield, Crown } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function Header() {
  const { user, userRole, signOut } = useAuth();

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'hr_admin': return 'destructive';
      case 'manager': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'hr_admin': return Crown;
      case 'manager': return Shield;
      default: return User;
    }
  };

  const RoleIcon = getRoleIcon(userRole);

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <h1 className="text-xl font-semibold text-foreground">Leave Management System</h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <div className="flex items-center gap-2">
              <Badge variant={getRoleColor(userRole)} className="flex items-center gap-1">
                <RoleIcon className="h-3 w-3" />
                {userRole || 'employee'}
              </Badge>
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={signOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </>
        )}
      </div>
    </header>
  );
}