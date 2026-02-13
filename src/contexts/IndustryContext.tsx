import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type IndustryType = 'household' | 'business';

interface IndustryContextType {
  industryType: IndustryType;
  setIndustryType: (type: IndustryType) => void;
  loading: boolean;
}

const IndustryContext = createContext<IndustryContextType | undefined>(undefined);

export const useIndustry = () => {
  const context = useContext(IndustryContext);
  if (!context) {
    throw new Error('useIndustry must be used within an IndustryProvider');
  }
  return context;
};

interface IndustryProviderProps {
  children: ReactNode;
}

export const IndustryProvider: React.FC<IndustryProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [industryType, setIndustryType] = useState<IndustryType>('household');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchIndustryType = async () => {
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        // First check if user is an organization owner
        const { data: ownedOrg, error: ownedOrgError } = await supabase
          .from('organizations')
          .select('industry_type')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (ownedOrgError) {
          console.warn('Failed to fetch owned org:', ownedOrgError);
        }

        if (!cancelled && ownedOrg?.industry_type) {
          setIndustryType(ownedOrg.industry_type as IndustryType);
          setLoading(false);
          return;
        }

        // Check if user is a member of an organization
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) {
          console.warn('Failed to fetch profile org:', profileError);
        }

        if (!cancelled && profile?.organization_id) {
          const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('industry_type')
            .eq('id', profile.organization_id)
            .maybeSingle();

          if (orgError) {
            console.warn('Failed to fetch org:', orgError);
          }

          if (!cancelled && org?.industry_type) {
            setIndustryType(org.industry_type as IndustryType);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch industry type:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchIndustryType();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <IndustryContext.Provider value={{ industryType, setIndustryType, loading }}>
      {children}
    </IndustryContext.Provider>
  );
};
