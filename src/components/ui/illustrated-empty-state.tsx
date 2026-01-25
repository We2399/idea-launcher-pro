import React from 'react';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  MessageCircle, 
  Calendar, 
  CheckSquare, 
  Users, 
  Wallet,
  Search,
  Bell,
  FolderOpen,
  Heart
} from 'lucide-react';

type IllustrationType = 
  | 'documents' 
  | 'messages' 
  | 'calendar' 
  | 'tasks' 
  | 'employees' 
  | 'payroll'
  | 'search'
  | 'notifications'
  | 'folder'
  | 'welcome';

interface IllustratedEmptyStateProps {
  type: IllustrationType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const illustrations: Record<IllustrationType, { icon: React.ElementType; colors: string }> = {
  documents: { icon: FileText, colors: 'from-primary/20 to-accent/20' },
  messages: { icon: MessageCircle, colors: 'from-primary/20 to-primary/5' },
  calendar: { icon: Calendar, colors: 'from-accent/20 to-primary/10' },
  tasks: { icon: CheckSquare, colors: 'from-primary/15 to-accent/15' },
  employees: { icon: Users, colors: 'from-primary/20 to-primary/5' },
  payroll: { icon: Wallet, colors: 'from-accent/25 to-accent/5' },
  search: { icon: Search, colors: 'from-muted to-muted/50' },
  notifications: { icon: Bell, colors: 'from-primary/15 to-accent/10' },
  folder: { icon: FolderOpen, colors: 'from-muted to-background' },
  welcome: { icon: Heart, colors: 'from-accent/20 to-primary/15' },
};

export function IllustratedEmptyState({
  type,
  title,
  description,
  action,
  className,
}: IllustratedEmptyStateProps) {
  const { icon: Icon, colors } = illustrations[type];

  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-6 text-center', className)}>
      {/* Decorative illustration */}
      <div className="relative mb-6">
        {/* Background circles */}
        <div className={cn(
          'absolute inset-0 rounded-full bg-gradient-to-br blur-2xl opacity-60 animate-pulse',
          colors
        )} 
        style={{ transform: 'scale(1.5)' }}
        />
        
        {/* Floating decorative elements */}
        <div className="absolute -top-2 -right-3 w-3 h-3 rounded-full bg-accent/40 animate-float" />
        <div className="absolute -bottom-1 -left-4 w-2 h-2 rounded-full bg-primary/30 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 -right-6 w-1.5 h-1.5 rounded-full bg-primary/20 animate-float" style={{ animationDelay: '0.5s' }} />
        
        {/* Main icon container */}
        <div className={cn(
          'relative w-24 h-24 rounded-3xl bg-gradient-to-br flex items-center justify-center',
          'shadow-lg border border-white/50 dark:border-white/10',
          'transform transition-transform duration-500 hover:scale-105',
          colors
        )}>
          <Icon className="w-10 h-10 text-primary/70" strokeWidth={1.5} />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed mb-4">
          {description}
        </p>
      )}
      
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
