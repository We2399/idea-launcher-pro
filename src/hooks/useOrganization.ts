import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Organization {
  id: string;
  name: string;
  organization_type: 'individual' | 'company';
  subscription_tier: 'free' | 'mini' | 'sme' | 'enterprise';
  max_employees: number;
  owner_id: string;
  created_at: string;
}

interface OrganizationMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    position: string;
  };
}

export const useOrganization = () => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [employeeCount, setEmployeeCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchOrganization();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchOrganization = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      // First check if user has organization_id in profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, is_employer')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.organization_id) {
        // Fetch the organization directly
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .maybeSingle();

        if (org) {
          setOrganization(org);
          setIsOwner(org.owner_id === user.id);
          await fetchMembers(org.id);
          setLoading(false);
          return;
        }
      }

      // Fallback: Check if user owns an organization
      const { data: ownedOrg } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (ownedOrg) {
        setOrganization(ownedOrg);
        setIsOwner(true);
        await fetchMembers(ownedOrg.id);
      } else {
        // Check if user is a member of an organization
        const { data: membership } = await supabase
          .from('organization_members')
          .select(`
            *,
            organizations:organization_id (*)
          `)
          .eq('user_id', user.id)
          .maybeSingle();

        if (membership?.organizations) {
          setOrganization(membership.organizations as unknown as Organization);
          setIsOwner(false);
          await fetchMembers((membership.organizations as any).id);
        }
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (orgId: string) => {
    const { data, count } = await supabase
      .from('organization_members')
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name,
          email,
          position
        )
      `, { count: 'exact' })
      .eq('organization_id', orgId);

    if (data) {
      setMembers(data as unknown as OrganizationMember[]);
      setEmployeeCount(count || 0);
    }
  };

  const createOrganization = async (name: string, type: 'individual' | 'company') => {
    if (!user) return null;

    const maxEmployees = type === 'individual' ? 1 : 5;
    const tier = type === 'individual' ? 'free' : 'mini';

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name,
        organization_type: type,
        subscription_tier: tier,
        max_employees: maxEmployees,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating organization:', error);
      return null;
    }

    // Update profile with organization_id
    await supabase
      .from('profiles')
      .update({ 
        organization_id: data.id,
        is_employer: true 
      })
      .eq('user_id', user.id);

    setOrganization(data);
    setIsOwner(true);
    return data;
  };

  const upgradeTier = async (newTier: 'mini' | 'sme' | 'enterprise') => {
    if (!organization || !isOwner) return false;

    const maxEmployeesMap = {
      mini: 5,
      sme: 20,
      enterprise: 50
    };

    const { error } = await supabase
      .from('organizations')
      .update({
        subscription_tier: newTier,
        max_employees: maxEmployeesMap[newTier]
      })
      .eq('id', organization.id);

    if (!error) {
      fetchOrganization();
      return true;
    }
    return false;
  };

  const canAddMoreEmployees = () => {
    if (!organization) return false;
    return employeeCount < organization.max_employees;
  };

  return {
    organization,
    members,
    isOwner,
    loading,
    employeeCount,
    canAddMoreEmployees,
    createOrganization,
    upgradeTier,
    refetch: fetchOrganization
  };
};
