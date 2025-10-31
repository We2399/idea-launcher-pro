import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, Archive } from 'lucide-react';

interface DocumentStatusBadgeProps {
  status: 'pending_approval' | 'active' | 'rejected' | 'replaced';
}

export function DocumentStatusBadge({ status }: DocumentStatusBadgeProps) {
  const variants = {
    pending_approval: {
      variant: 'secondary' as const,
      icon: Clock,
      label: 'Pending Approval',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    },
    active: {
      variant: 'default' as const,
      icon: CheckCircle,
      label: 'Active',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    },
    rejected: {
      variant: 'destructive' as const,
      icon: XCircle,
      label: 'Rejected',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    },
    replaced: {
      variant: 'outline' as const,
      icon: Archive,
      label: 'Replaced',
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  };

  const config = variants[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
