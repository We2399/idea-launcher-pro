import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Calendar,
  FileText,
  Users,
  BarChart3,
  User,
  Home,
  Settings,
  CheckSquare,
  DollarSign,
  Wallet
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePendingDocumentsCount } from '@/hooks/usePendingDocumentsCount';
import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';

const getPersonalItems = (t: (key: string) => string) => [
  { title: t('dashboard'), url: '/', icon: Home },
  { title: t('leaveRequests'), url: '/requests', icon: FileText },
  { title: t('calendar'), url: '/calendar', icon: Calendar },
  { title: t('tasks'), url: '/tasks', icon: CheckSquare },
  { title: t('cashControl'), url: '/cash-control', icon: DollarSign },
  { title: t('profile'), url: '/profile', icon: User },
];

const getManagementItems = (t: (key: string) => string) => [
  { title: t('employees'), url: '/employees', icon: Users },
  { title: 'Storage Centre', url: '/storage-centre', icon: FileText },
  { title: t('reports'), url: '/reports', icon: BarChart3 },
  { title: t('payroll'), url: '/payroll', icon: Wallet },
  { title: t('settings'), url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const { userRole } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const currentPath = location.pathname;
  const { data: pendingCount } = usePendingDocumentsCount();

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-primary-foreground font-medium" : "hover:bg-sidebar-accent/50";

  // Build navigation items based on role
  let navigationItems: typeof getPersonalItems extends (...args: any) => infer R ? R : never = [];
  
  if (userRole === 'administrator') {
    // Administrator: Only management pages
    navigationItems = getManagementItems(t);
  } else if (userRole === 'hr_admin') {
    // HR Admin: Personal + management pages
    navigationItems = [...getPersonalItems(t), ...getManagementItems(t)];
  } else {
    // Employee: Only personal pages
    navigationItems = getPersonalItems(t);
  }

  // On mobile, never collapse. On desktop, respect the collapsed state
  const collapsed = !isMobile && state === 'collapsed';

  const handleMobileNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar 
      className={collapsed ? "w-16" : "w-64"}
      collapsible={isMobile ? "offcanvas" : "icon"}
    >
      <SidebarContent className="pt-4">
        {/* Logo Section */}
        <NavLink 
          to="/" 
          onClick={handleMobileNavClick}
          className={`px-4 mb-6 flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Home className="h-6 w-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">SME EmpRecord</span>
              <span className="text-xs text-muted-foreground">Hub</span>
            </div>
          )}
        </NavLink>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {navigationItems.map((item) => {
                const isStorageCentre = item.url === '/storage-centre';
                const showBadge = isStorageCentre && pendingCount && pendingCount > 0 && (userRole === 'administrator' || userRole === 'hr_admin');
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                      <NavLink 
                        to={item.url} 
                        end 
                        onClick={handleMobileNavClick}
                        className={({ isActive }) => 
                          `relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                            isActive 
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm" 
                              : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground"
                          }`
                        }
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && (
                          <div className="flex items-center justify-between flex-1">
                            <span className="text-sm">{item.title}</span>
                            {showBadge && (
                              <div className="flex items-center gap-2">
                                <span className="relative inline-flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/60"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
                                </span>
                                <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                                  {pendingCount}
                                </Badge>
                              </div>
                            )}
                          </div>
                        )}
                        {collapsed && showBadge && (
                          <Badge variant="destructive" className="h-4 w-4 p-0 text-[10px] flex items-center justify-center absolute -top-1 -right-1">
                            {pendingCount > 9 ? '9+' : pendingCount}
                          </Badge>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}