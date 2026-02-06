import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserPreferences {
  chat_sound_enabled: boolean;
  chat_toast_enabled: boolean;
}

const defaultPreferences: UserPreferences = {
  chat_sound_enabled: true,
  chat_toast_enabled: true,
};

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    if (!user?.id) {
      setPreferences(defaultPreferences);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('chat_sound_enabled, chat_toast_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          chat_sound_enabled: data.chat_sound_enabled,
          chat_toast_enabled: data.chat_toast_enabled,
        });
      } else {
        // No preferences exist yet, use defaults
        setPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = useCallback(async (key: keyof UserPreferences, value: boolean) => {
    if (!user?.id) return;

    // Optimistically update local state
    setPreferences(prev => ({ ...prev, [key]: value }));

    try {
      // Check if preferences row exists
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing row
        const { error } = await supabase
          .from('user_preferences')
          .update({ [key]: value, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Insert new row
        const { error } = await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            [key]: value,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating user preference:', error);
      // Revert on error
      fetchPreferences();
    }
  }, [user?.id, fetchPreferences]);

  return {
    preferences,
    isLoading,
    updatePreference,
    refetch: fetchPreferences,
  };
};
