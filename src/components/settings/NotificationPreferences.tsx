import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Volume2 } from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';

export function NotificationPreferences() {
  const { preferences, isLoading, updatePreference } = useUserPreferences();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t('notificationPreferences') || 'Notification Preferences'}
        </CardTitle>
        <CardDescription>
          {t('notificationPreferencesDescription') || 'Control how you receive chat notifications'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="chat-sound" className="text-base font-medium">
                {t('chatNotificationSound') || 'Chat notification sound'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('chatNotificationSoundDescription') || 'Play a sound when you receive a new chat message'}
              </p>
            </div>
          </div>
          <Switch
            id="chat-sound"
            checked={preferences.chat_sound_enabled}
            onCheckedChange={(checked) => updatePreference('chat_sound_enabled', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div className="space-y-0.5">
              <Label htmlFor="chat-toast" className="text-base font-medium">
                {t('chatToastNotification') || 'Chat toast notification'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('chatToastNotificationDescription') || 'Show a popup notification when you receive a new chat message'}
              </p>
            </div>
          </div>
          <Switch
            id="chat-toast"
            checked={preferences.chat_toast_enabled}
            onCheckedChange={(checked) => updatePreference('chat_toast_enabled', checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
