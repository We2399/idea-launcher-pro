import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Building2, Users, Crown, Loader2, ExternalLink, RefreshCw, CreditCard } from 'lucide-react';
import { UpgradeTierDialog } from './UpgradeTierDialog';
import { STRIPE_TIERS } from '@/lib/stripeTiers';

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
  const { subscription, checkSubscription } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [employeeCounts, setEmployeeCounts] = useState<Record<string, number>>({});

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
      
      // Fetch employee counts for each organization
      const counts: Record<string, number> = {};
      for (const org of data) {
        const { count } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id);
        counts[org.id] = count || 0;
      }
      setEmployeeCounts(counts);
    }
    setLoading(false);
  };

  const handleManageSubscription = async () => {
    setOpeningPortal(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      toast({
        title: t('error'),
        description: error.message || 'Failed to open subscription portal',
        variant: 'destructive',
      });
    } finally {
      setOpeningPortal(false);
    }
  };

  const handleUpgradeClick = (org: Organization) => {
    setSelectedOrg(org);
    setUpgradeDialogOpen(true);
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'free': return t('trialTier') || 'Trial';
      case 'mini': return t('seTier') || 'SE';
      case 'sme': return t('smeTier') || 'SME';
      case 'enterprise': return t('enterpriseTier') || 'Enterprise';
      default: return tier;
    }
  };

  const getTierColor = (tier: string): "outline" | "secondary" | "default" | "destructive" => {
    switch (tier) {
      case 'free': return 'outline';
      case 'mini': return 'secondary';
      case 'sme': return 'default';
      case 'enterprise': return 'destructive';
      default: return 'outline';
    }
  };

  const getTierPrice = (tier: string) => {
    switch (tier) {
      case 'free': return '$0/mo';
      case 'mini': return '$28/mo';
      case 'sme': return '$88/mo';
      case 'enterprise': return '$168/mo';
      default: return '';
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
    <>
      <div className="space-y-6">
        {/* Subscription Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('subscriptionStatus') || 'Subscription Status'}
            </CardTitle>
            <CardDescription>
              {t('subscriptionStatusDescription') || 'View and manage your Stripe subscription'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('status') || 'Status'}:</span>
                  {subscription.subscribed ? (
                    <Badge variant="default" className="bg-green-500">
                      {subscription.status === 'trialing' ? 'Trial Active' : 'Active'}
                    </Badge>
                  ) : (
                    <Badge variant="outline">No Subscription</Badge>
                  )}
                </div>
                {subscription.subscriptionEnd && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {subscription.status === 'trialing' ? 'Trial ends' : 'Renews'}: {' '}
                    {new Date(subscription.subscriptionEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => checkSubscription()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('refresh') || 'Refresh'}
                </Button>
                {subscription.subscribed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManageSubscription}
                    disabled={openingPortal}
                  >
                    {openingPortal ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    {t('manageSubscription') || 'Manage Subscription'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organizations Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              {t('manageSubscriptions') || 'Organization Tiers'}
            </CardTitle>
            <CardDescription>
              {t('manageSubscriptionsDescription') || 'Upgrade organization subscription tiers'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {organizations.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {t('noOrganizations') || 'No organizations found'}
              </p>
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
                          <span>
                            {employeeCounts[org.id] || 0} / {org.max_employees} {t('employees') || 'employees'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge variant={getTierColor(org.subscription_tier)}>
                          {getTierLabel(org.subscription_tier)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getTierPrice(org.subscription_tier)}
                        </p>
                      </div>
                      {org.subscription_tier !== 'enterprise' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpgradeClick(org)}
                        >
                          <Crown className="h-4 w-4 mr-1" />
                          {t('upgrade') || 'Upgrade'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tier Pricing Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('availablePlans') || 'Available Plans'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(STRIPE_TIERS).map(([key, tier]) => (
                <div key={key} className="p-4 border rounded-lg">
                  <h3 className="font-semibold">{tier.name}</h3>
                  <p className="text-2xl font-bold mt-2">
                    ${tier.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Up to {tier.maxEmployees} employees
                  </p>
                  {tier.trialMonths && (
                    <Badge variant="secondary" className="mt-2">
                      {tier.trialMonths}-month free trial
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Dialog */}
      {selectedOrg && (
        <UpgradeTierDialog
          open={upgradeDialogOpen}
          onOpenChange={setUpgradeDialogOpen}
          currentTier={selectedOrg.subscription_tier}
          currentMax={selectedOrg.max_employees}
          employeeCount={employeeCounts[selectedOrg.id] || 0}
          organizationId={selectedOrg.id}
          onUpgradeSuccess={() => {
            fetchOrganizations();
            checkSubscription();
          }}
        />
      )}
    </>
  );
}
