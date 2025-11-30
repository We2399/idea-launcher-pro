import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePayrollNotifications } from '@/hooks/usePayrollNotifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

const Notifications = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Fetch all notifications (both read and unread)
  const { data: allNotifications, isLoading } = useQuery({
    queryKey: ['all-notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_notifications')
        .select('*, payroll_records(*)')
        .eq('sent_to', user!.id)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('payroll_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-notifications'] });
      
      toast({
        title: t('success'),
        description: t('notificationMarkedAsRead'),
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: t('error'),
        description: t('failedToMarkAsRead'),
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('payroll_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('sent_to', user!.id)
        .is('read_at', null);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-notifications'] });
      
      toast({
        title: t('success'),
        description: t('allNotificationsMarkedAsRead'),
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: t('error'),
        description: t('failedToMarkAllAsRead'),
        variant: 'destructive',
      });
    }
  };

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'sent_to_employee':
        return t('payrollSentNotification');
      case 'confirmed':
        return t('payrollConfirmedNotification');
      case 'disputed':
        return t('payrollDisputedNotification');
      case 'approved':
        return t('payrollApprovedNotification');
      default:
        return t('notification');
    }
  };

  const filteredNotifications = selectedType
    ? allNotifications?.filter((n) => n.notification_type === selectedType)
    : allNotifications;

  const unreadCount = allNotifications?.filter((n) => !n.read_at).length || 0;

  return (
    <div className="min-h-screen safe-area-screen px-4 md:px-8 pb-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8" />
            {t('notificationsTitle')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 
              ? `${unreadCount} ${t('unreadNotifications')}`
              : t('noUnreadNotifications')
            }
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" size="sm">
            <CheckCheck className="h-4 w-4 mr-2" />
            {t('markAllAsRead')}
          </Button>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedType === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedType(null)}
        >
          {t('all')}
        </Button>
        <Button
          variant={selectedType === 'sent_to_employee' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedType('sent_to_employee')}
        >
          {t('sent')}
        </Button>
        <Button
          variant={selectedType === 'confirmed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedType('confirmed')}
        >
          {t('confirmed')}
        </Button>
        <Button
          variant={selectedType === 'disputed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedType('disputed')}
        >
          {t('disputed')}
        </Button>
        <Button
          variant={selectedType === 'approved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedType('approved')}
        >
          {t('approved')}
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">{t('loading')}</p>
            </CardContent>
          </Card>
        ) : !filteredNotifications || filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('noNotifications')}</p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id}
              className={notification.read_at ? 'opacity-60' : 'border-primary/50'}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getNotificationTitle(notification.notification_type)}
                      {!notification.read_at && (
                        <Badge variant="default" className="text-xs">
                          {t('new')}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {formatDistanceToNow(new Date(notification.sent_at), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  {!notification.read_at && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                    >
                      {t('markAsRead')}
                    </Button>
                  )}
                </div>
              </CardHeader>
              {notification.message && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
