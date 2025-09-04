import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Shield, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut, userRole } = useAuth();

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'hr_admin':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'manager':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'hr_admin':
        return Shield;
      case 'manager':
        return Users;
      default:
        return User;
    }
  };

  const RoleIcon = getRoleIcon(userRole);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Leave Management System</h1>
            <Badge variant="outline" className={getRoleColor(userRole)}>
              <RoleIcon className="h-3 w-3 mr-1" />
              {userRole?.replace('_', ' ').toUpperCase() || 'EMPLOYEE'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Welcome, {user?.email}
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}