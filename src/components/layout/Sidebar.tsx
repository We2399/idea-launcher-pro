import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Calendar,
  FileText,
  Users,
  BarChart3,
  User,
  Home,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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

const baseItems = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Leave Requests', url: '/requests', icon: FileText },
  { title: 'Calendar', url: '/calendar', icon: Calendar },
  { title: 'Profile', url: '/profile', icon: User },
];

const managerItems = [
  { title: 'Team Management', url: '/employees', icon: Users },
];

const hrItems = [
  { title: 'Reports', url: '/reports', icon: BarChart3 },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { userRole } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-primary-foreground font-medium" : "hover:bg-sidebar-accent/50";

  // Build navigation items based on role
  let navigationItems = [...baseItems];
  
  if (userRole === 'manager' || userRole === 'hr_admin') {
    navigationItems = [...navigationItems, ...managerItems];
  }
  
  if (userRole === 'hr_admin') {
    navigationItems = [...navigationItems, ...hrItems];
  }

  const collapsed = state === 'collapsed';

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"}>
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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