import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useChatNotificationSound } from '@/hooks/useChatNotificationSound';
import { toast } from '@/hooks/use-toast';

export const useUnreadMessagesCount = () => {
  const { user } = useAuth();
  const { isImpersonating, impersonatedUserId } = useImpersonation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { playNotificationSound } = useChatNotificationSound();
  const previousCountRef = useRef<number>(0);
  const location = useLocation();
  const preferencesRef = useRef({ chat_sound_enabled: true, chat_toast_enabled: true });

  const targetUserId = isImpersonating ? impersonatedUserId : user?.id;
  const isOnChatPage = location.pathname === '/chat';

  // Fetch user preferences
  const fetchPreferences = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('chat_sound_enabled, chat_toast_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        preferencesRef.current = {
          chat_sound_enabled: data.chat_sound_enabled,
          chat_toast_enabled: data.chat_toast_enabled,
        };
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    }
  }, [user?.id]);

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
            receiver_id: string; 
            read_at: string | null;
            sender_id: string;
            content: string;
          };
          
          // Only notify when a new unread message is for this user
          if (newMessage.receiver_id === targetUserId && !newMessage.read_at) {
            // Re-fetch preferences to ensure we have latest settings
            await fetchPreferences();
            
            // Play sound if enabled
            if (preferencesRef.current.chat_sound_enabled) {
              playNotificationSound();
            }
            
            // Show toast notification only when NOT on chat page and if enabled
            if (!isOnChatPage && preferencesRef.current.chat_toast_enabled) {
              // Fetch sender name for the toast
              const { data: senderProfile } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('user_id', newMessage.sender_id)
                .single();
              
              const senderName = senderProfile 
                ? `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() || 'Someone'
                : 'Someone';
              
              const previewText = newMessage.content.length > 50 
                ? newMessage.content.substring(0, 50) + '...' 
                : newMessage.content;
              
              toast({
                title: `💬 New message from ${senderName}`,
                description: previewText,
              });
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
  }, [targetUserId, playNotificationSound, isOnChatPage, fetchPreferences]);

  return { unreadCount, isLoading, refetch: fetchUnreadCount };
};
