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
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{t('quickActions')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} to={action.href}>
              <Card className="card-glass group relative overflow-hidden h-full transition-all duration-300 hover:scale-105 hover:shadow-elevated border-border/50">
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300" 
                     style={{ backgroundImage: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)))` }} />
                <div className="p-6 relative">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} shadow-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {action.label}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
