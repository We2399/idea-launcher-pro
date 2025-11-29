import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Calendar, FileText, CheckSquare, Users, BarChart3, ClipboardList } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

export function QuickActions() {
  const { userRole } = useAuth();
  const { t } = useLanguage();
  
  const employeeActions = [
    {
      icon: FileText,
      label: t('newLeaveRequest'),
      href: '/calendar',
      gradient: 'from-blue-500 to-blue-600',
      description: t('submitLeaveRequestDescription')
    },
    {
      icon: Calendar,
      label: t('viewCalendar'),
      href: '/calendar',
      gradient: 'from-emerald-500 to-emerald-600',
      description: t('leaveCalendarDescription')
    },
    {
      icon: CheckSquare,
      label: t('myTasks'),
      href: '/tasks',
      gradient: 'from-purple-500 to-purple-600',
      description: t('manageTasks')
    }
  ];
  
  const adminActions = [
    {
      icon: ClipboardList,
      label: t('reviewRequests'),
      href: '/requests',
      gradient: 'from-orange-500 to-orange-600',
      description: t('manageLeaveRequestsDescription')
    },
    {
      icon: Users,
      label: t('manageEmployees'),
      href: '/employees',
      gradient: 'from-indigo-500 to-indigo-600',
      description: t('manageTeamRequestsDescription')
    },
    {
      icon: BarChart3,
      label: t('viewReports'),
      href: '/reports',
      gradient: 'from-rose-500 to-rose-600',
      description: t('viewLeaveReportsDescription')
    }
  ];
  
  const actions = userRole === 'employee' ? employeeActions : adminActions;
  
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground hidden md:block">{t('quickActions')}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} to={action.href}>
              <button className={`w-full py-6 md:py-8 rounded-2xl bg-gradient-to-br ${action.gradient} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95`}>
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 md:p-4 rounded-full bg-white/20 backdrop-blur-sm">
                    <Icon className="h-7 w-7 md:h-8 md:w-8 text-white" />
                  </div>
                  <span className="text-white font-semibold text-sm md:text-base px-2 text-center leading-tight">
                    {action.label}
                  </span>
                </div>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
