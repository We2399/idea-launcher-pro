import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useTaskStatusCounts } from '@/hooks/useTaskStatusCounts';

interface TaskStatusBadgesProps {
  showOnlyUnseen?: boolean;
  compact?: boolean;
}

export function TaskStatusBadges({ showOnlyUnseen = true, compact = false }: TaskStatusBadgesProps) {
  const { counts, unseenCounts } = useTaskStatusCounts();
  
  const displayCounts = showOnlyUnseen ? unseenCounts : counts;
  
  // Don't show anything if no counts
  if (displayCounts.pending === 0 && displayCounts.inProgress === 0 && displayCounts.completed === 0) {
    return null;
  }

  if (compact) {
    // Single badge with total unseen count
    const total = displayCounts.pending + displayCounts.inProgress + displayCounts.completed;
    if (total === 0) return null;
    
    // Use the most urgent color
    let bgColor = 'bg-emerald-500'; // default green
    if (displayCounts.pending > 0) {
      bgColor = 'bg-red-500';
    } else if (displayCounts.inProgress > 0) {
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
      {displayCounts.pending > 0 && (
        <Badge 
          className="bg-red-500 hover:bg-red-600 text-white h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs shadow-sm"
          title="New tasks"
        >
          {displayCounts.pending}
        </Badge>
      )}
      {displayCounts.inProgress > 0 && (
        <Badge 
          className="bg-amber-500 hover:bg-amber-600 text-white h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs shadow-sm"
          title="In progress"
        >
          {displayCounts.inProgress}
        </Badge>
      )}
      {displayCounts.completed > 0 && (
        <Badge 
          className="bg-emerald-500 hover:bg-emerald-600 text-white h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs shadow-sm"
          title="Completed"
        >
          {displayCounts.completed}
        </Badge>
      )}
    </div>
  );
}

// Standalone badge component for dashboard cards
export function TaskCardBadge() {
  const { unseenCounts } = useTaskStatusCounts();
  
  const total = unseenCounts.pending + unseenCounts.inProgress + unseenCounts.completed;
  
  if (total === 0) return null;
  
  // Determine color based on priority: red > yellow > green
  let bgColor = 'bg-emerald-500';
  if (unseenCounts.pending > 0) {
    bgColor = 'bg-red-500';
  } else if (unseenCounts.inProgress > 0) {
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
