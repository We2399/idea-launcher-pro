import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface ImpersonationContextType {
  impersonatedUserId: string | null;
  isImpersonating: boolean;
  startImpersonation: (userId: string) => void;
  endImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const { userRole } = useAuth();
  const [impersonatedUserId, setImpersonatedUserId] = useState<string | null>(null);

  // Load impersonation state from sessionStorage on mount
  useEffect(() => {
    if (userRole === 'administrator') {
      const stored = sessionStorage.getItem('impersonated_user_id');
      if (stored) {
        setImpersonatedUserId(stored);
      }
    }
  }, [userRole]);

  const startImpersonation = async (userId: string) => {
    if (userRole !== 'administrator') {
      console.error('Only administrators can impersonate users');
      return;
    }
    
    setImpersonatedUserId(userId);
    sessionStorage.setItem('impersonated_user_id', userId);
    
    // Log impersonation start to audit logs
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'IMPERSONATION_START',
        table_name: 'profiles',
        record_id: userId,
        new_values: { impersonated_user_id: userId },
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to log impersonation start:', error);
    }
  };

  const endImpersonation = async () => {
    const previousUserId = impersonatedUserId;
    setImpersonatedUserId(null);
    sessionStorage.removeItem('impersonated_user_id');
    
    // Log impersonation end to audit logs
    if (previousUserId) {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: { user } } = await supabase.auth.getUser();
        
        await supabase.from('audit_logs').insert({
          user_id: user?.id,
          action: 'IMPERSONATION_END',
          table_name: 'profiles',
          record_id: previousUserId,
          old_values: { impersonated_user_id: previousUserId },
          user_agent: navigator.userAgent
        });
      } catch (error) {
        console.error('Failed to log impersonation end:', error);
      }
    }
  };

  const value = {
    impersonatedUserId,
    isImpersonating: impersonatedUserId !== null,
    startImpersonation,
    endImpersonation
  };

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
}
