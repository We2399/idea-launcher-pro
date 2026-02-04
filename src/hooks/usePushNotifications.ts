import { useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePushNotifications = () => {
  const { user } = useAuth();

  const registerToken = useCallback(async (token: string, platform: 'ios' | 'android' | 'web') => {
    if (!user?.id) {
      console.log('No user logged in, skipping token registration');
      return;
    }

    try {
      // Upsert the token (insert or update if exists)
      const { error } = await supabase
        .from('device_tokens')
        .upsert(
          {
            user_id: user.id,
            token,
            platform,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,token',
          }
        );

      if (error) {
        console.error('Error registering device token:', error);
      } else {
        console.log('Device token registered successfully');
      }
    } catch (err) {
      console.error('Failed to register device token:', err);
    }
  }, [user?.id]);

  const unregisterToken = useCallback(async (token: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('device_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('token', token);

      if (error) {
        console.error('Error unregistering device token:', error);
      } else {
        console.log('Device token unregistered successfully');
      }
    } catch (err) {
      console.error('Failed to unregister device token:', err);
    }
  }, [user?.id]);

  const initializePushNotifications = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      console.log('Not a native platform, skipping push notification setup');
      return;
    }

    try {
      // Dynamic import for Capacitor Push Notifications
      const { PushNotifications } = await import('@capacitor/push-notifications');
      
      // Request permission
      const permStatus = await PushNotifications.requestPermissions();
      
      if (permStatus.receive === 'granted') {
        // Register for push notifications
        await PushNotifications.register();
      } else {
        console.log('Push notification permission denied');
        return;
      }

      // Listen for registration success
      PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success, token:', token.value);
        const platform = Capacitor.getPlatform() as 'ios' | 'android';
        await registerToken(token.value, platform);
      });

      // Listen for registration error
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
      });

      // Handle notification received while app is in foreground
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification);
        // The app is open, so we don't need to do anything special
        // The real-time subscription will handle updating the UI
      });

      // Handle notification action (user tapped on notification)
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed:', notification);
        // Navigate to the chat or relevant screen
        const data = notification.notification.data;
        if (data?.type === 'chat_message') {
          // Could navigate to chat here
          window.location.href = '/chat';
        }
      });

    } catch (err) {
      console.error('Failed to initialize push notifications:', err);
    }
  }, [registerToken]);

  useEffect(() => {
    if (user?.id) {
      initializePushNotifications();
    }
  }, [user?.id, initializePushNotifications]);

  return {
    registerToken,
    unregisterToken,
    initializePushNotifications,
  };
};
