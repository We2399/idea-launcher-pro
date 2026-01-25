import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  href?: string;
  variant?: 'default' | 'primary' | 'accent' | 'muted';
  className?: string;
}

const variantStyles = {
  default: {
    container: 'bg-card hover:shadow-card-hover',
    icon: 'bg-primary/10 text-primary',
    value: 'text-foreground',
  },
  primary: {
    container: 'bg-gradient-to-br from-primary to-primary/80 hover:from-primary/95 hover:to-primary/75',
    icon: 'bg-white/20 text-primary-foreground',
    value: 'text-primary-foreground',
  },
  accent: {
    container: 'bg-gradient-to-br from-accent to-accent/80 hover:from-accent/95 hover:to-accent/75',
    icon: 'bg-white/20 text-accent-foreground',
    value: 'text-accent-foreground',
  },
  muted: {
    container: 'bg-muted/50 hover:bg-muted/70',
    icon: 'bg-foreground/10 text-muted-foreground',
    value: 'text-foreground',
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  href,
  variant = 'default',
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];
  
  const content = (
    <div
      className={cn(
        'relative p-4 rounded-2xl border border-border/50 shadow-card transition-all duration-300',
        'group cursor-pointer transform hover:-translate-y-0.5',
        styles.container,
        className
      )}
    >
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br from-primary/5 to-accent/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className={cn(
            'text-xs font-medium uppercase tracking-wider',
            variant === 'default' || variant === 'muted' ? 'text-muted-foreground' : 'text-primary-foreground/70'
          )}>
            {title}
          </p>
          <p className={cn('text-3xl font-bold tracking-tight', styles.value)}>
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1.5">
              <span className={cn(
                'text-xs font-medium px-1.5 py-0.5 rounded-full',
                trend.isPositive 
                  ? 'bg-primary/10 text-primary dark:bg-primary/20' 
                  : 'bg-destructive/10 text-destructive dark:bg-destructive/20'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
        
        <div className={cn(
          'p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110',
          styles.icon
        )}>
          <Icon className="w-5 h-5" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}
