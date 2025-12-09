import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOrganization } from '@/hooks/useOrganization';
import { useLanguage } from '@/contexts/LanguageContext';
import { InviteEmployeeDialog } from './InviteEmployeeDialog';
import { Building2, Users, Crown, TrendingUp, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function OrganizationManager() {
  const { t } = useLanguage();
  const { 
    organization, 
    members, 
    isOwner, 
    loading, 
    employeeCount, 
    canAddMoreEmployees,
    upgradeTier,
    refetch 
  } = useOrganization();

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
        <CardContent className="py-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('noOrganization')}</h3>
          <p className="text-muted-foreground">{t('noOrganizationDescription')}</p>
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
                  <h4 className="font-semibold">{t('miniTier')}</h4>
                  <p className="text-sm text-muted-foreground">{t('miniTierDescription')}</p>
                  <p className="text-lg font-bold">1-5 {t('employeesCount')}</p>
                  <Button onClick={() => handleUpgrade('mini')} className="w-full">
                    {t('upgrade')}
                  </Button>
                </div>
              )}
              {(organization.subscription_tier === 'free' || organization.subscription_tier === 'mini') && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold">{t('smeTier')}</h4>
                  <p className="text-sm text-muted-foreground">{t('smeTierDescription')}</p>
                  <p className="text-lg font-bold">6-20 {t('employeesCount')}</p>
                  <Button onClick={() => handleUpgrade('sme')} className="w-full">
                    {t('upgrade')}
                  </Button>
                </div>
              )}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">{t('enterpriseTier')}</h4>
                <p className="text-sm text-muted-foreground">{t('enterpriseTierDescription')}</p>
                <p className="text-lg font-bold">21-50 {t('employeesCount')}</p>
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
