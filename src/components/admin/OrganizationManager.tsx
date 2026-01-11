import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrganization } from '@/hooks/useOrganization';
import { useLanguage } from '@/contexts/LanguageContext';
import { InviteEmployeeDialog } from './InviteEmployeeDialog';
import { Building2, Users, Crown, TrendingUp, Loader2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { STRIPE_TIERS } from '@/lib/stripeTiers';

export function OrganizationManager() {
  const { t } = useLanguage();
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<'individual' | 'company'>('company');
  const [creating, setCreating] = useState(false);
  const { 
    organization, 
    members, 
    isOwner, 
    loading, 
    employeeCount, 
    canAddMoreEmployees,
    createOrganization,
    upgradeTier,
    refetch 
  } = useOrganization();

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) {
      toast({
        title: t('error'),
        description: t('pleaseEnterOrganizationName'),
        variant: 'destructive',
      });
      return;
    }
    
    setCreating(true);
    const result = await createOrganization(orgName.trim(), orgType);
    setCreating(false);
    
    if (result) {
      toast({
        title: t('success'),
        description: t('organizationCreated'),
      });
    } else {
      toast({
        title: t('error'),
        description: t('organizationCreationFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleUpgrade = async (tier: 'mini' | 'sme' | 'enterprise') => {
    const success = await upgradeTier(tier);
    if (success) {
      toast({
        title: t('success'),
        description: t('subscriptionUpgraded'),
      });
    } else {
      toast({
        title: t('error'),
        description: t('upgradeFailed'),
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!organization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('createOrganization')}
          </CardTitle>
          <CardDescription>{t('createOrganizationDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">{t('organizationName')}</Label>
            <Input
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder={t('enterOrganizationName')}
            />
          </div>
          
          <div className="space-y-2">
            <Label>{t('organizationType')}</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={orgType === 'individual' ? 'default' : 'outline'}
                onClick={() => setOrgType('individual')}
                className="h-auto py-3 flex-col"
              >
                <span className="font-medium">{t('individualOrganization')}</span>
                <span className="text-xs opacity-80">{t('freeTier')} - 1 {t('employeeRole')}</span>
              </Button>
              <Button
                type="button"
                variant={orgType === 'company' ? 'default' : 'outline'}
                onClick={() => setOrgType('company')}
                className="h-auto py-3 flex-col"
              >
                <span className="font-medium">{t('companyOrganization')}</span>
                <span className="text-xs opacity-80">{t('miniTier')} - 5 {t('employeesCount')}</span>
              </Button>
            </div>
          </div>
          
          <Button 
            onClick={handleCreateOrganization} 
            className="w-full"
            disabled={creating || !orgName.trim()}
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {t('createOrganization')}
          </Button>
        </CardContent>
      </Card>
    );
  }

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

  return (
    <div className="space-y-6">
      {/* Organization Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {organization.name}
              </CardTitle>
              <CardDescription>
                {organization.organization_type === 'individual' ? t('individualOrganization') : t('companyOrganization')}
              </CardDescription>
            </div>
            <Badge variant={getTierColor(organization.subscription_tier) as any}>
              {getTierLabel(organization.subscription_tier)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('employeesCount')}</p>
                <p className="text-2xl font-bold">{employeeCount} / {organization.max_employees}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Crown className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t('subscriptionPlan')}</p>
                <p className="text-2xl font-bold">{getTierLabel(organization.subscription_tier)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">{t('status')}</p>
                <p className="text-2xl font-bold text-green-600">{t('active')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Employees */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>{t('inviteEmployees')}</CardTitle>
            <CardDescription>{t('inviteEmployeesDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <InviteEmployeeDialog onInviteSent={refetch} />
          </CardContent>
        </Card>
      )}

      {/* Upgrade Options */}
      {isOwner && organization.subscription_tier !== 'enterprise' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('upgradePlan')}</CardTitle>
            <CardDescription>{t('upgradePlanDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {organization.subscription_tier === 'free' && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold">{t('seTier') || 'SE'}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('seTierDescription') || `For small teams: 1 admin + up to ${STRIPE_TIERS.se.maxEmployees} employees`}
                  </p>
                  <p className="text-sm text-muted-foreground">(${STRIPE_TIERS.se.price}/month)</p>
                  <p className="text-lg font-bold">1-{STRIPE_TIERS.se.maxEmployees} {t('employeesCount')}</p>
                  <Button onClick={() => handleUpgrade('mini')} className="w-full">
                    {t('upgrade')}
                  </Button>
                </div>
              )}
              {(organization.subscription_tier === 'free' || organization.subscription_tier === 'mini') && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold">{t('smeTier')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('smeTierDescription') || `For growing teams: 1 admin + up to ${STRIPE_TIERS.sme.maxEmployees} employees`}
                  </p>
                  <p className="text-sm text-muted-foreground">(${STRIPE_TIERS.sme.price}/month)</p>
                  <p className="text-lg font-bold">{STRIPE_TIERS.se.maxEmployees + 1}-{STRIPE_TIERS.sme.maxEmployees} {t('employeesCount')}</p>
                  <Button onClick={() => handleUpgrade('sme')} className="w-full">
                    {t('upgrade')}
                  </Button>
                </div>
              )}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">{t('enterpriseTier')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('enterpriseTierDescription') || `For large teams: 1 admin + ${STRIPE_TIERS.sme.maxEmployees + 1}-${STRIPE_TIERS.enterprise.maxEmployees} employees`}
                </p>
                <p className="text-sm text-muted-foreground">(${STRIPE_TIERS.enterprise.price}/month)</p>
                <p className="text-lg font-bold">{STRIPE_TIERS.sme.maxEmployees + 1}-{STRIPE_TIERS.enterprise.maxEmployees} {t('employeesCount')}</p>
                <Button onClick={() => handleUpgrade('enterprise')} className="w-full">
                  {t('upgrade')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('organizationMembers')}</CardTitle>
          <CardDescription>{t('viewAllMembers')}</CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{t('noMembersYet')}</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {member.profiles?.first_name} {member.profiles?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.profiles?.email}</p>
                  </div>
                  <Badge variant="outline">{member.role}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
