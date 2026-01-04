import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, ArrowLeft, Users, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

interface Contact {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  unread_count: number;
  last_message?: string;
  last_message_time?: string;
}

const Chat = () => {
  const { user, userRole } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch available contacts based on role
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['chat-contacts', user?.id, userRole],
    queryFn: async () => {
      if (!user?.id) return [];

      // For employees: show admins they can message
      // For admins: show employees who have messaged them OR all employees
      type AppRole = 'employee' | 'hr_admin' | 'administrator';
      let roleFilter: AppRole[];
      
      if (userRole === 'employee') {
        roleFilter = ['hr_admin', 'administrator'];
      } else {
        roleFilter = ['employee'];
      }

      // Get users with the target roles
      const { data: usersWithRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', roleFilter);

      if (rolesError || !usersWithRoles?.length) {
        console.error('Error fetching roles:', rolesError);
        return [];
      }

      const userIds = usersWithRoles.map(u => u.user_id);

      // Get profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return [];
      }

      // Get unread message counts and last message for each contact
      const contactsWithDetails: Contact[] = await Promise.all(
        profiles.map(async (profile) => {
          const roleInfo = usersWithRoles.find(u => u.user_id === profile.user_id);
          
          // Count unread messages from this contact
          const { count: unreadCount } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', profile.user_id)
            .eq('receiver_id', user.id)
            .is('read_at', null);

          // Get last message
          const { data: lastMsg } = await supabase
            .from('chat_messages')
            .select('content, created_at')
            .or(`and(sender_id.eq.${profile.user_id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${profile.user_id})`)
            .order('created_at', { ascending: false })
            .limit(1);

          return {
            user_id: profile.user_id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            role: roleInfo?.role || 'employee',
            unread_count: unreadCount || 0,
            last_message: lastMsg?.[0]?.content,
            last_message_time: lastMsg?.[0]?.created_at,
          };
        })
      );

      // Sort by last message time (most recent first), then by unread count
      return contactsWithDetails.sort((a, b) => {
        if (a.last_message_time && b.last_message_time) {
          return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        }
        if (a.last_message_time) return -1;
        if (b.last_message_time) return 1;
        return b.unread_count - a.unread_count;
      });
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Fetch messages for selected contact
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['chat-messages', user?.id, selectedContact?.user_id],
    queryFn: async () => {
      if (!user?.id || !selectedContact?.user_id) return [];
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact.user_id}),and(sender_id.eq.${selectedContact.user_id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return data as ChatMessage[];
    },
    enabled: !!user?.id && !!selectedContact?.user_id,
  });

  // Subscribe to real-time updates - listen to all messages for this user
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`chat-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          // Only process if this message involves the current user
          if (newMessage.sender_id !== user.id && newMessage.receiver_id !== user.id) {
            return;
          }
          
          // Immediately refetch to show the new message
          queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
          queryClient.invalidateQueries({ queryKey: ['chat-contacts'] });
          
          // Show toast notification for incoming messages (not from self, and not from currently selected contact)
          if (newMessage.sender_id !== user.id) {
            const isFromSelectedContact = selectedContact?.user_id === newMessage.sender_id;
            if (!isFromSelectedContact) {
              toast({
                title: t('newMessage'),
                description: newMessage.content.substring(0, 50) + (newMessage.content.length > 50 ? '...' : ''),
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Chat realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, t, selectedContact?.user_id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when viewing conversation
  useEffect(() => {
    const markAsRead = async () => {
      if (!user?.id || !selectedContact?.user_id || !messages.length) return;
      
      const unreadMessages = messages.filter(
        m => m.sender_id === selectedContact.user_id && m.receiver_id === user.id && !m.read_at
      );
      
      if (unreadMessages.length > 0) {
        await supabase
          .from('chat_messages')
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadMessages.map(m => m.id));
        
        queryClient.invalidateQueries({ queryKey: ['chat-contacts'] });
      }
    };

    markAsRead();
  }, [messages, user?.id, selectedContact?.user_id, queryClient]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user?.id || !selectedContact?.user_id || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        sender_id: user.id,
        receiver_id: selectedContact.user_id,
        content: messageContent,
      });

    if (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent); // Restore message on error
      toast({
        title: t('error'),
        description: t('messageSendError'),
        variant: 'destructive',
      });
    } else {
      // Immediately refresh messages to show sent message
      queryClient.invalidateQueries({ queryKey: ['chat-messages', user.id, selectedContact.user_id] });
      queryClient.invalidateQueries({ queryKey: ['chat-contacts'] });
    }
    
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getContactName = (contact: Contact) => {
    return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || t('unknown');
  };

  const getInitials = (contact: Contact) => {
    return `${(contact.first_name || '')[0] || ''}${(contact.last_name || '')[0] || ''}`.toUpperCase() || 'U';
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'administrator':
        return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{t('administrator')}</span>;
      case 'hr_admin':
        return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{t('hrAdmin')}</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{t('employee')}</span>;
    }
  };

  // Contact List View
  if (!selectedContact) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-200px)]">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-background rounded-t-lg">
          <Link to="/" className="md:hidden">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Users className="h-6 w-6 text-primary" />
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">{t('chatTitle')}</h2>
            <p className="text-xs text-muted-foreground">{t('selectContact')}</p>
          </div>
        </div>

        {/* Contact List */}
        <ScrollArea className="flex-1 bg-muted/30">
          {loadingContacts ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
              <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
              <p>{t('noContacts')}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {contacts.map((contact) => (
                <button
                  key={contact.user_id}
                  onClick={() => setSelectedContact(contact)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(contact)}
                      </AvatarFallback>
                    </Avatar>
                    {contact.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {contact.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">
                        {getContactName(contact)}
                      </span>
                      {getRoleBadge(contact.role)}
                    </div>
                    {contact.last_message && (
                      <p className="text-sm text-muted-foreground truncate">
                        {contact.last_message}
                      </p>
                    )}
                  </div>
                  {contact.last_message_time && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(contact.last_message_time).toLocaleDateString()}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  }

  // Chat View with Selected Contact
  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-200px)]">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-background rounded-t-lg">
        <Button variant="ghost" size="icon" onClick={() => setSelectedContact(null)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10 bg-primary">
          <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
            {getInitials(selectedContact)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">{getContactName(selectedContact)}</h2>
          <div className="flex items-center gap-2">
            {getRoleBadge(selectedContact.role)}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
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
                      {isOwnMessage ? 'ME' : getInitials(selectedContact)}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-background text-foreground border border-border rounded-bl-md'
                    }`}
                  >
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
