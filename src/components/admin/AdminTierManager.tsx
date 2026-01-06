import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Building2, Users, Crown, Loader2 } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  organization_type: 'individual' | 'company';
  subscription_tier: 'free' | 'mini' | 'sme' | 'enterprise';
  max_employees: number;
  owner_id: string;
}

export function AdminTierManager() {
  const { t } = useLanguage();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrganizations(data);
    }
    setLoading(false);
  };

  const handleUpgrade = async (orgId: string, newTier: 'free' | 'mini' | 'sme' | 'enterprise') => {
    setUpgrading(orgId);
    
    const maxEmployeesMap: Record<string, number> = {
      free: 1,
      mini: 9,
      sme: 50,
      enterprise: 100
    };

    const { error } = await supabase
      .from('organizations')
      .update({
        subscription_tier: newTier,
        max_employees: maxEmployeesMap[newTier]
      })
      .eq('id', orgId);

    if (error) {
      toast({
        title: t('error'),
        description: t('upgradeFailed'),
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('success'),
        description: t('subscriptionUpgraded'),
      });
      fetchOrganizations();
    }
    
    setUpgrading(null);
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'free': return t('freeTier');
      case 'mini': return t('miniTier');
      case 'sme': return t('smeTier');
      case 'enterprise': return t('enterpriseTier');
      default: return tier;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'outline';
      case 'mini': return 'secondary';
      case 'sme': return 'default';
      case 'enterprise': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          {t('manageSubscriptions')}
        </CardTitle>
        <CardDescription>{t('manageSubscriptionsDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        {organizations.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">{t('noOrganizations')}</p>
        ) : (
          <div className="space-y-4">
            {organizations.map((org) => (
              <div 
                key={org.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{org.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{org.max_employees} {t('employeesMax')}</span>
                      <Badge variant={getTierColor(org.subscription_tier) as any} className="ml-2">
                        {getTierLabel(org.subscription_tier)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select
                    value={org.subscription_tier}
                    onValueChange={(value) => handleUpgrade(org.id, value as any)}
                    disabled={upgrading === org.id}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">{t('freeTier')} (1)</SelectItem>
                      <SelectItem value="mini">{t('miniTier')} (9)</SelectItem>
                      <SelectItem value="sme">{t('smeTier')} (50)</SelectItem>
                      <SelectItem value="enterprise">{t('enterpriseTier')} (100)</SelectItem>
                    </SelectContent>
                  </Select>
                  {upgrading === org.id && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
