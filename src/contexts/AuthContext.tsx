import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getTierByProductId } from '@/lib/stripeTiers';

interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  status: string;
  tierKey: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  userRole: string | null;
  subscription: SubscriptionState;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultSubscription: SubscriptionState = {
  subscribed: false,
  productId: null,
  subscriptionEnd: null,
  status: 'none',
  tierKey: null,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionState>(defaultSubscription);

  const checkSubscription = useCallback(async () => {
    if (!session) {
      setSubscription(defaultSubscription);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      if (data) {
        // Find tier key from product ID
        let tierKey: string | null = null;
        if (data.product_id) {
          const tier = getTierByProductId(data.product_id);
          if (tier) {
            // Find the key for this tier
            const { STRIPE_TIERS } = await import('@/lib/stripeTiers');
            tierKey = Object.entries(STRIPE_TIERS).find(
              ([_, t]) => t.product_id === data.product_id
            )?.[0] || null;
          }
        }

        setSubscription({
          subscribed: data.subscribed || false,
          productId: data.product_id || null,
          subscriptionEnd: data.subscription_end || null,
          status: data.status || 'none',
          tierKey,
        });
      }
    } catch (err) {
      console.error('Failed to check subscription:', err);
    }
  }, [session]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        try {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Fetch user role when user logs in
          if (session?.user) {
            Promise.resolve(
              supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .maybeSingle()
            ).then(({ data: roleData, error }) => {
              if (error) {
                console.error('Error fetching role:', error);
                setUserRole('employee');
              } else {
                setUserRole(roleData?.role ?? 'employee');
              }
            }).catch((err) => {
              console.warn('Role fetch failed, defaulting to employee:', err);
              setUserRole('employee');
            });
          } else {
            setUserRole(null);
            setSubscription(defaultSubscription);
          }
          
          setLoading(false);
        } catch (err) {
          console.warn('Auth state change handler error:', err);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.warn('getSession failed:', err);
      setLoading(false);
    });

    return () => authSubscription.unsubscribe();
  }, []);

  // Check subscription when session changes - delayed to avoid burst of requests on login
  useEffect(() => {
    if (session) {
      const timer = setTimeout(() => {
        checkSubscription();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [session, checkSubscription]);

  // Periodically check subscription (every 60 seconds)
  useEffect(() => {
    if (!session) return;
    
    const interval = setInterval(() => {
      checkSubscription();
    }, 60000);

    return () => clearInterval(interval);
  }, [session, checkSubscription]);

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata
        }
      });

      // Role is now handled by the database trigger
      
      if (error) {
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Please check your email to confirm your account."
        });
      }
      
      return { error };
    } catch (err) {
      console.error('Unexpected sign-up error:', err);
      toast({
        title: "Sign Up Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast({
          title: "Sign In Error",
          description: error.message,
          variant: "destructive"
        });
      }
      
      return { error };
    } catch (err) {
      console.error('Unexpected sign-in error:', err);
      toast({
        title: "Sign In Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return { error: err };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      // Treat missing session as already signed out to avoid noisy toasts
      if (error && !/Auth session missing/i.test(error.message)) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      setUser(null);
      setSession(null);
      setUserRole(null);
      setSubscription(defaultSubscription);
      toast({
        title: "Success",
        description: "Signed out successfully"
      });
    } catch (err) {
      console.warn('Sign out error:', err);
      // Force clear state even on error
      setUser(null);
      setSession(null);
      setUserRole(null);
      setSubscription(defaultSubscription);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    userRole,
    subscription,
    checkSubscription,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
