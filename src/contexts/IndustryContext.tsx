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
    const fetchIndustryType = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // First check if user is an organization owner
        const { data: ownedOrg } = await supabase
          .from('organizations')
          .select('industry_type')
          .eq('owner_id', user.id)
          .maybeSingle();

        if (ownedOrg?.industry_type) {
          setIndustryType(ownedOrg.industry_type as IndustryType);
          setLoading(false);
          return;
        }

        // Check if user is a member of an organization
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile?.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('industry_type')
            .eq('id', profile.organization_id)
            .maybeSingle();

          if (org?.industry_type) {
            setIndustryType(org.industry_type as IndustryType);
          }
        }
      } catch (error) {
        console.error('Failed to fetch industry type:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIndustryType();
  }, [user]);

  return (
    <IndustryContext.Provider value={{ industryType, setIndustryType, loading }}>
      {children}
    </IndustryContext.Provider>
  );
};
