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
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
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

const getBaseItems = (t: (key: string) => string) => [
  { title: t('dashboard'), url: '/', icon: Home },
  { title: t('leaveRequests'), url: '/requests', icon: FileText },
  { title: t('calendar'), url: '/calendar', icon: Calendar },
  { title: t('tasks'), url: '/tasks', icon: CheckSquare },
  { title: t('cashControl'), url: '/cash-control', icon: DollarSign },
  { title: t('profile'), url: '/profile', icon: User },
];

const getManagerItems = (t: (key: string) => string) => [
  { title: t('employees'), url: '/employees', icon: Users },
];

const getAdminItems = (t: (key: string) => string) => [
  { title: t('reports'), url: '/reports', icon: BarChart3 },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state, isMobile } = useSidebar();
  const { userRole } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-primary-foreground font-medium" : "hover:bg-sidebar-accent/50";

  // Build navigation items based on role
  let navigationItems = [...getBaseItems(t)];
  
  if (userRole === 'manager' || userRole === 'hr_admin') {
    navigationItems = [...navigationItems, ...getManagerItems(t)];
  }
  
  if (userRole === 'hr_admin') {
    navigationItems = [...navigationItems, ...getAdminItems(t)];
  }

  const collapsed = state === 'collapsed';

  return (
    <Sidebar 
      className={collapsed ? "w-16" : "w-64"}
      collapsible={isMobile ? "offcanvas" : "icon"}
    >
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => 
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
                          isActive 
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm" 
                            : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}