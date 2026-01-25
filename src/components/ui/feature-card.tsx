import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeatureCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  href?: string;
  badge?: string | number;
  variant?: 'default' | 'primary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const sizeStyles = {
  sm: {
    container: 'p-3',
    icon: 'w-8 h-8 p-1.5',
    title: 'text-xs',
    description: 'text-[10px]',
  },
  md: {
    container: 'p-4',
    icon: 'w-10 h-10 p-2',
    title: 'text-sm',
    description: 'text-xs',
  },
  lg: {
    container: 'p-5',
    icon: 'w-12 h-12 p-2.5',
    title: 'text-base',
    description: 'text-sm',
  },
};

const variantStyles = {
  default: {
    container: 'bg-card border-border hover:border-primary/30 hover:shadow-card-hover',
    icon: 'bg-gradient-to-br from-primary/10 to-primary/5 text-primary',
    iconHover: 'group-hover:from-primary/20 group-hover:to-primary/10',
  },
  primary: {
    container: 'bg-gradient-to-br from-primary to-primary/85 border-primary/20 hover:from-primary/95 hover:to-primary/80',
    icon: 'bg-white/20 text-primary-foreground',
    iconHover: 'group-hover:bg-white/30',
  },
  outline: {
    container: 'bg-transparent border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5',
    icon: 'bg-muted text-muted-foreground group-hover:text-primary',
    iconHover: 'group-hover:bg-primary/10',
  },
};

export function FeatureCard({
  title,
  description,
  icon: Icon,
  href,
  badge,
  variant = 'default',
  size = 'md',
  className,
  onClick,
}: FeatureCardProps) {
  const sizeStyle = sizeStyles[size];
  const variantStyle = variantStyles[variant];

  const content = (
    <div
      className={cn(
        'relative rounded-2xl border shadow-sm transition-all duration-300 cursor-pointer group',
        'transform hover:-translate-y-0.5',
        sizeStyle.container,
        variantStyle.container,
        className
      )}
      onClick={onClick}
    >
      {/* Badge */}
      {badge !== undefined && (
        <div className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-accent text-accent-foreground text-[10px] font-semibold flex items-center justify-center shadow-sm animate-scale-spring">
          {typeof badge === 'number' && badge > 99 ? '99+' : badge}
        </div>
      )}

      <div className="flex flex-col items-center text-center gap-2">
        {/* Icon */}
        <div
          className={cn(
            'rounded-xl flex items-center justify-center transition-all duration-300',
            sizeStyle.icon,
            variantStyle.icon,
            variantStyle.iconHover
          )}
        >
          <Icon className="w-full h-full" strokeWidth={1.5} />
        </div>

        {/* Text */}
        <div>
          <p
            className={cn(
              'font-semibold leading-tight',
              sizeStyle.title,
              variant === 'primary' ? 'text-primary-foreground' : 'text-foreground'
            )}
          >
            {title}
          </p>
          {description && (
            <p
              className={cn(
                'mt-0.5 leading-snug',
                sizeStyle.description,
                variant === 'primary' ? 'text-primary-foreground/70' : 'text-muted-foreground'
              )}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}
