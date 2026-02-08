import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useChatNotificationSound } from '@/hooks/useChatNotificationSound';
import { toast } from '@/hooks/use-toast';

interface UserPreferences {
  chat_sound_enabled: boolean;
  chat_toast_enabled: boolean;
}

export const useUnreadMessagesCount = () => {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUserId } = useImpersonation();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { playNotificationSound } = useChatNotificationSound();
  const previousCountRef = useRef<number>(0);
  const preferencesRef = useRef<UserPreferences>({ chat_sound_enabled: true, chat_toast_enabled: true });

  const targetUserId = isImpersonating ? impersonatedUserId : user?.id;

  // Check if user is currently on the chat page
  const isOnChatPage = location.pathname === '/chat';

  // Fetch user preferences
  const fetchPreferences = useCallback(async () => {
    if (!targetUserId) return;
    
    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('chat_sound_enabled, chat_toast_enabled')
        .eq('user_id', targetUserId)
        .maybeSingle();
      
      if (data) {
        preferencesRef.current = {
          chat_sound_enabled: data.chat_sound_enabled ?? true,
          chat_toast_enabled: data.chat_toast_enabled ?? true,
        };
      }
    } catch (error) {
      console.log('Could not fetch user preferences:', error);
    }
  }, [targetUserId]);

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

  // Fetch sender info for notification
  const fetchSenderInfo = async (senderId: string): Promise<string> => {
    try {
      const { data } = await supabase
        .from('profiles_chat_view')
        .select('first_name, last_name')
        .eq('user_id', senderId)
        .single();
      
      if (data) {
        const name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
        return name || 'Someone';
      }
    } catch (error) {
      console.log('Could not fetch sender info:', error);
    }
    return 'Someone';
  };

  useEffect(() => {
    fetchPreferences();
    fetchUnreadCount();

    // Refetch every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [targetUserId, fetchPreferences]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!targetUserId) return;

    const channel = supabase
      .channel('unread-messages-count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        async (payload) => {
          const newMessage = payload.new as { 
            sender_id: string; 
            receiver_id: string; 
            read_at: string | null;
            content: string;
          };
          
          // Only trigger for messages sent TO this user (not from self)
          if (newMessage.receiver_id === targetUserId && !newMessage.read_at) {
            // Skip notifications if user is on the chat page (Chat.tsx handles it)
            if (!isOnChatPage) {
              // Play sound if enabled
              if (preferencesRef.current.chat_sound_enabled) {
                playNotificationSound();
              }
              
              // Show toast if enabled
              if (preferencesRef.current.chat_toast_enabled) {
                const senderName = await fetchSenderInfo(newMessage.sender_id);
                const messagePreview = newMessage.content.length > 60 
                  ? newMessage.content.substring(0, 60) + '...' 
                  : newMessage.content;
                
                toast({
                  title: `💬 ${senderName}`,
                  description: messagePreview,
                });
              }
            }
          }
          
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetUserId, playNotificationSound, isOnChatPage]);

  return { unreadCount, isLoading, refetch: fetchUnreadCount };
};
