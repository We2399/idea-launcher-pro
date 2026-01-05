import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';

export const useUnreadMessagesCount = () => {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUserId } = useImpersonation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const targetUserId = isImpersonating ? impersonatedUserId : user?.id;

  const fetchUnreadCount = async () => {
    if (!targetUserId) {
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', targetUserId)
        .is('read_at', null);

      if (error) {
        console.error('Error fetching unread messages count:', error);
        return;
      }

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread messages count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    // Refetch every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [targetUserId]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!targetUserId) return;

    const channel = supabase
      .channel('unread-messages-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          // Refetch count on any message change
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetUserId]);

  return { unreadCount, isLoading, refetch: fetchUnreadCount };
};
