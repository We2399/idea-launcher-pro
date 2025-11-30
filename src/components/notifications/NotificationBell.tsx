import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePayrollNotifications } from '@/hooks/usePayrollNotifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
  const { t } = useLanguage();
  const { data: notifications, refetch } = usePayrollNotifications();
  const [open, setOpen] = useState(false);
  const unreadCount = notifications?.length || 0;

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('payroll_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      
      await refetch();
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative h-9 w-9 p-0"
          aria-label={t('notifications')}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center px-1 text-xs bg-destructive text-destructive-foreground"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">{t('notifications')}</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} {t('new')}
            </Badge>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {!notifications || notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {t('noNotifications')}
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 5).map((notification) => (
                <div 
                  key={notification.id}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {notification.notification_type === 'sent_to_employee' && t('payrollSentNotification')}
                        {notification.notification_type === 'confirmed' && t('payrollConfirmedNotification')}
                        {notification.notification_type === 'disputed' && t('payrollDisputedNotification')}
                        {notification.notification_type === 'approved' && t('payrollApprovedNotification')}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.sent_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications && notifications.length > 0 && (
          <div className="p-2 border-t">
            <Link to="/notifications" onClick={() => setOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full">
                {t('viewAllNotifications')}
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
