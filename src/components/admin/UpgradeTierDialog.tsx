import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Users, Check, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { STRIPE_TIERS } from '@/lib/stripeTiers';

interface UpgradeTierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: string;
  currentMax: number;
  employeeCount: number;
  organizationId?: string;
  onUpgradeSuccess?: () => void;
}

const tierOptions = [
  { tier: 'trial' as const, key: 'trial', employees: 2, price: '$0/month', trialNote: '3-month free trial' },
  { tier: 'se' as const, key: 'se', employees: 9, price: '$28/month' },
  { tier: 'sme' as const, key: 'sme', employees: 50, price: '$88/month' },
  { tier: 'enterprise' as const, key: 'enterprise', employees: 100, price: '$168/month' },
];

export const UpgradeTierDialog = ({
  open,
  onOpenChange,
  currentTier,
  currentMax,
  employeeCount,
  organizationId,
  onUpgradeSuccess
}: UpgradeTierDialogProps) => {
  const { t } = useLanguage();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    if (!selectedTier) return;
    
    const tierConfig = STRIPE_TIERS[selectedTier];
    if (!tierConfig) {
      toast({
        title: t('error'),
        description: 'Invalid tier selected',
        variant: 'destructive',
      });
      return;
    }

    // Check if price ID is configured
    if (tierConfig.price_id.includes('REPLACE_ME')) {
      toast({
        title: t('error'),
        description: 'Stripe products not configured. Please set up products in Stripe Dashboard first.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpgrading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId: tierConfig.price_id,
          tierId: selectedTier,
          organizationId: organizationId,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
        toast({
          title: t('success'),
          description: 'Redirecting to checkout...',
        });
        onOpenChange(false);
        onUpgradeSuccess?.();
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: t('error'),
        description: error.message || 'Failed to start checkout',
        variant: 'destructive',
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'free':
      case 'trial': return t('trialTier') || 'Trial';
      case 'mini':
      case 'se': return t('seTier') || 'SE';
      case 'sme': return t('smeTier') || 'SME';
      case 'enterprise': return t('enterpriseTier') || 'Enterprise';
      default: return tier;
    }
  };

  // Map current DB tier to tier order
  const getTierOrder = (tier: string): number => {
    const orderMap: Record<string, number> = {
      'free': 0,
      'trial': 0,
      'mini': 1,
      'se': 1,
      'sme': 2,
      'enterprise': 3,
    };
    return orderMap[tier] ?? -1;
  };

  const currentTierOrder = getTierOrder(currentTier);
  const availableTiers = tierOptions.filter(opt => getTierOrder(opt.key) > currentTierOrder);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-hermes" />
            {t('upgradeRequired')}
          </DialogTitle>
          <DialogDescription>
            {t('upgradeDescription')?.replace('{current}', String(employeeCount)).replace('{max}', String(currentMax)) ||
              `You have ${employeeCount} employees but your plan only supports ${currentMax}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4">
          {availableTiers.map((option) => (
            <button
              key={option.key}
              onClick={() => setSelectedTier(option.key)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selectedTier === option.key
                  ? 'border-hermes bg-hermes/5'
                  : 'border-border hover:border-hermes/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{getTierLabel(option.key)}</span>
                    {selectedTier === option.key && (
                      <Check className="h-4 w-4 text-hermes" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{t('upToEmployees')?.replace('{count}', String(option.employees)) || 
                      `Up to ${option.employees} employees`}</span>
                  </div>
                  {option.trialNote && (
                    <div className="text-xs text-hermes mt-1">{option.trialNote}</div>
                  )}
                </div>
                <Badge variant="secondary">{option.price}</Badge>
              </div>
            </button>
          ))}
        </div>

        {availableTiers.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            {t('alreadyMaxTier') || 'You are already on the highest tier.'}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={!selectedTier || isUpgrading}
            className="bg-hermes hover:bg-hermes-dark"
          >
            {isUpgrading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('processing') || 'Processing...'}
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                {t('upgradeNow') || 'Upgrade Now'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
