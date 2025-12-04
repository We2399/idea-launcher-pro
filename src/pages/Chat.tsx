import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  sender_profile?: {
    first_name: string | null;
    last_name: string | null;
  };
}

const Chat = () => {
  const { user, userRole } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // For employees, chat with admins. For admins, we could show a list of conversations
  // For simplicity, we'll use a "support" channel concept where employees message admins
  const SUPPORT_CHANNEL = 'support';

  // Fetch messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['chat-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return data as ChatMessage[];
    },
    enabled: !!user?.id,
  });

  // Fetch profiles for message senders
  const { data: profiles = {} } = useQuery({
    queryKey: ['chat-profiles', messages],
    queryFn: async () => {
      if (!messages.length) return {};
      
      const userIds = [...new Set(messages.map(m => m.sender_id))];
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (error) {
        console.error('Error fetching profiles:', error);
        return {};
      }

      return data.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, { first_name: string | null; last_name: string | null }>);
    },
    enabled: messages.length > 0,
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('chat-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
          // Show notification for new messages
          if (payload.new && (payload.new as ChatMessage).sender_id !== user.id) {
            toast({
              title: t('newMessage'),
              description: (payload.new as ChatMessage).content.substring(0, 50) + '...',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `sender_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, t]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    const markAsRead = async () => {
      if (!user?.id || !messages.length) return;
      
      const unreadMessages = messages.filter(
        m => m.receiver_id === user.id && !m.read_at
      );
      
      if (unreadMessages.length > 0) {
        await supabase
          .from('chat_messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadMessages.map(m => m.id));
      }
    };

    markAsRead();
  }, [messages, user?.id]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user?.id || sending) return;

    setSending(true);
    
    // For employees, send to first admin found. For admins, this would be different.
    // In a real app, you'd have a proper recipient selection
    let receiverId = user.id; // Default fallback
    
    // Get an admin to send to (if employee) or the last conversation partner
    if (userRole === 'employee') {
      const { data: admins } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['hr_admin', 'administrator'])
        .limit(1);
      
      if (admins && admins.length > 0) {
        receiverId = admins[0].user_id;
      }
    } else {
      // For admins, reply to the last message sender
      const lastReceivedMessage = [...messages].reverse().find(m => m.sender_id !== user.id);
      if (lastReceivedMessage) {
        receiverId = lastReceivedMessage.sender_id;
      }
    }

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content: newMessage.trim(),
      });

    if (error) {
      console.error('Error sending message:', error);
      toast({
        title: t('error'),
        description: t('messageSendError'),
        variant: 'destructive',
      });
    } else {
      setNewMessage('');
    }
    
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getSenderName = (senderId: string) => {
    if (senderId === user?.id) return t('you');
    const profile = profiles[senderId];
    if (profile) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || t('unknown');
    }
    return t('support');
  };

  const getInitials = (senderId: string) => {
    if (senderId === user?.id) return 'ME';
    const profile = profiles[senderId];
    if (profile) {
      return `${(profile.first_name || '')[0] || ''}${(profile.last_name || '')[0] || ''}`.toUpperCase() || 'U';
    }
    return 'JJ';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-200px)]">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-background rounded-t-lg">
        <Link to="/" className="md:hidden">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Avatar className="h-10 w-10 bg-primary">
          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
            JJ
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">{t('chatTitle')}</h2>
          <p className="text-xs text-muted-foreground">{t('chatSubtitle')}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>{t('noMessages')}</p>
            <p className="text-sm">{t('startConversation')}</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end gap-2 max-w-[80%] ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={`text-xs ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                      {getInitials(message.sender_id)}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-background text-foreground border border-border rounded-bl-md'
                    }`}
                  >
                    {!isOwnMessage && (
                      <p className="text-xs font-medium mb-1 opacity-70">
                        {getSenderName(message.sender_id)}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {isOwnMessage && message.read_at && (
                        <span className="ml-2">✓✓</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-background rounded-b-lg">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chatPlaceholder')}
            className="flex-1 rounded-full"
            disabled={sending}
          />
          <Button 
            onClick={handleSend} 
            size="icon" 
            className="rounded-full h-10 w-10"
            disabled={!newMessage.trim() || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
