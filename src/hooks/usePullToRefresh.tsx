import { useEffect, useRef, useState } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useIsMobile } from './use-mobile';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
}: UsePullToRefreshOptions) => {
  const isMobile = useIsMobile();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const scrollableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMobile || !scrollableRef.current) return;

    const element = scrollableRef.current;
    let startY = 0;
    let currentY = 0;
    let isPulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Only allow pull-to-refresh when at the top of the page
      if (element.scrollTop === 0 && !isRefreshing) {
        startY = e.touches[0].clientY;
        touchStartY.current = startY;
        isPulling = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;

      currentY = e.touches[0].clientY;
      const distance = currentY - startY;

      if (distance > 0) {
        // Prevent default scrolling behavior
        e.preventDefault();
        
        // Apply resistance to make pulling feel natural
        const adjustedDistance = distance / resistance;
        setPullDistance(adjustedDistance);

        // Haptic feedback when reaching threshold
        if (adjustedDistance >= threshold && adjustedDistance < threshold + 5) {
          Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {
            // Haptics may not be available on web
          });
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;
      
      isPulling = false;

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        
        // Success haptic feedback
        Haptics.impact({ style: ImpactStyle.Heavy }).catch(() => {});
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
        }
      } else {
        // Animate back to zero
        setPullDistance(0);
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, isRefreshing, pullDistance, threshold, resistance, onRefresh]);

  return {
    scrollableRef,
    isRefreshing,
    pullDistance,
    isPulled: pullDistance >= threshold,
  };
};
