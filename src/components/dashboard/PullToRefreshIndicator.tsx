import { Loader2, ArrowDown } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  isRefreshing: boolean;
  pullDistance: number;
  threshold: number;
}

export const PullToRefreshIndicator = ({
  isRefreshing,
  pullDistance,
  threshold,
}: PullToRefreshIndicatorProps) => {
  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const isPulled = pullDistance >= threshold;

  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-300 ease-out"
      style={{
        transform: `translateY(${Math.min(pullDistance, threshold + 20)}px)`,
        opacity: Math.min(pullDistance / 50, 1),
      }}
    >
      <div className="bg-background/95 backdrop-blur-sm rounded-full p-3 shadow-lg border border-border/50">
        {isRefreshing ? (
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        ) : (
          <div className="relative">
            <ArrowDown
              className={`h-5 w-5 transition-all duration-300 ${
                isPulled ? 'text-primary scale-110' : 'text-muted-foreground'
              }`}
              style={{
                transform: `rotate(${isPulled ? '360deg' : '0deg'})`,
              }}
            />
            <svg
              className="absolute -inset-2"
              style={{ transform: 'rotate(-90deg)' }}
            >
              <circle
                cx="18"
                cy="18"
                r="16"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className={isPulled ? 'text-primary' : 'text-muted-foreground/30'}
                strokeDasharray={`${progress} 100`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
