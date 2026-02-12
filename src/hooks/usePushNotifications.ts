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

      // Check if push notifications are available (requires Firebase on Android)
      let permStatus;
      try {
        permStatus = await PushNotifications.checkPermissions();
      } catch (checkErr) {
        console.warn('Push notifications not available on this device (Firebase may not be configured):', checkErr);
        return;
      }

      // Request permission if not yet determined
      if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
        try {
          permStatus = await PushNotifications.requestPermissions();
        } catch (reqErr) {
          console.warn('Push notification permission request failed:', reqErr);
          return;
        }
      }
      
      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission denied');
        return;
      }

      // Register - this can crash if Firebase is not configured
      try {
        await PushNotifications.register();
      } catch (regErr) {
        console.warn('Push notification registration failed (Firebase may not be configured):', regErr);
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
      });

      // Handle notification action (user tapped on notification)
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed:', notification);
        const data = notification.notification.data;
        if (data?.type === 'chat_message') {
          window.location.href = '/chat';
        }
      });

    } catch (err) {
      // Catch-all: never let push notification setup crash the app
      console.warn('Push notifications unavailable:', err);
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
