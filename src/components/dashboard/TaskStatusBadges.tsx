import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useTaskStatusCounts } from '@/hooks/useTaskStatusCounts';

interface TaskStatusBadgesProps {
  compact?: boolean;
}

export function TaskStatusBadges({ compact = false }: TaskStatusBadgesProps) {
  const { counts } = useTaskStatusCounts();
  
  // Don't show anything if no counts
  const total = counts.pending + counts.inProgress + counts.completedUnacknowledged;
  if (total === 0) return null;

  if (compact) {
    // Use the most urgent color
    let bgColor = 'bg-emerald-500';
    if (counts.pending > 0) {
      bgColor = 'bg-red-500';
    } else if (counts.inProgress > 0) {
      bgColor = 'bg-amber-500';
    }
    
    return (
      <Badge 
        className={`${bgColor} text-white h-6 min-w-[24px] flex items-center justify-center px-2 shadow-lg animate-pulse z-10`}
      >
        {total > 99 ? '99+' : total}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {counts.pending > 0 && (
        <Badge 
          className="bg-red-500 hover:bg-red-600 text-white h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs shadow-sm"
          title="New tasks"
        >
          {counts.pending}
        </Badge>
      )}
      {counts.inProgress > 0 && (
        <Badge 
          className="bg-amber-500 hover:bg-amber-600 text-white h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs shadow-sm"
          title="In progress"
        >
          {counts.inProgress}
        </Badge>
      )}
      {counts.completedUnacknowledged > 0 && (
        <Badge 
          className="bg-emerald-500 hover:bg-emerald-600 text-white h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs shadow-sm"
          title="Completed - pending acknowledgment"
        >
          {counts.completedUnacknowledged}
        </Badge>
      )}
    </div>
  );
}

// Standalone badge component for dashboard cards
export function TaskCardBadge() {
  const { counts } = useTaskStatusCounts();
  
  const total = counts.pending + counts.inProgress + counts.completedUnacknowledged;
  
  if (total === 0) return null;
  
  // Determine color based on priority: red > amber > green
  let bgColor = 'bg-emerald-500';
  if (counts.pending > 0) {
    bgColor = 'bg-red-500';
  } else if (counts.inProgress > 0) {
    bgColor = 'bg-amber-500';
  }
  
  return (
    <Badge 
      className={`absolute -top-2 -right-2 ${bgColor} text-white h-6 min-w-[24px] flex items-center justify-center px-2 shadow-lg animate-pulse z-10`}
    >
      {total > 99 ? '99+' : total}
    </Badge>
  );
}
