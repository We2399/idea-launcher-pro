import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, CheckSquare, MessageCircle, DollarSign, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function MobileBottomNav() {
  const location = useLocation();
  const { t } = useLanguage();
  
  const navItems = [
    { icon: Home, label: t('home'), href: '/' },
    { icon: CheckSquare, label: t('tasks'), href: '/tasks' },
    { icon: MessageCircle, label: t('chat'), href: '/chat', isCenter: true },
    { icon: DollarSign, label: t('money'), href: '/cash-control' },
    { icon: FileText, label: t('docs'), href: '/profile' },
  ];
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 pb-safe">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                to={item.href}
                className="relative -mt-6"
              >
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <Icon className="h-6 w-6 text-primary-foreground" />
                </div>
              </Link>
            );
          }
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 max-w-[72px] py-2 ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium truncate max-w-full">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
