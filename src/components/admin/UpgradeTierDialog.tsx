import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Users, Check } from 'lucide-react';

interface UpgradeTierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: string;
  currentMax: number;
  employeeCount: number;
  onUpgrade: (tier: 'mini' | 'sme' | 'enterprise') => Promise<boolean>;
}

const tierOptions = [
  { tier: 'mini' as const, employees: 9, price: '$18/month' },
  { tier: 'sme' as const, employees: 50, price: '$58/month' },
  { tier: 'enterprise' as const, employees: 100, price: '$98/month' },
];

export const UpgradeTierDialog = ({
  open,
  onOpenChange,
  currentTier,
  currentMax,
  employeeCount,
  onUpgrade
}: UpgradeTierDialogProps) => {
  const { t } = useLanguage();
  const [selectedTier, setSelectedTier] = useState<'mini' | 'sme' | 'enterprise' | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    if (!selectedTier) return;
    
    setIsUpgrading(true);
    const success = await onUpgrade(selectedTier);
    setIsUpgrading(false);
    
    if (success) {
      onOpenChange(false);
      setSelectedTier(null);
    }
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

  const availableTiers = tierOptions.filter(opt => {
    const tierOrder = ['free', 'mini', 'sme', 'enterprise'];
    return tierOrder.indexOf(opt.tier) > tierOrder.indexOf(currentTier);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-hermes" />
            {t('upgradeRequired')}
          </DialogTitle>
          <DialogDescription>
            {t('upgradeDescription').replace('{current}', String(employeeCount)).replace('{max}', String(currentMax))}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4">
          {availableTiers.map((option) => (
            <button
              key={option.tier}
              onClick={() => setSelectedTier(option.tier)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selectedTier === option.tier
                  ? 'border-hermes bg-hermes/5'
                  : 'border-border hover:border-hermes/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{getTierLabel(option.tier)}</span>
                    {selectedTier === option.tier && (
                      <Check className="h-4 w-4 text-hermes" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{t('upToEmployees').replace('{count}', String(option.employees))}</span>
                  </div>
                </div>
                <Badge variant="secondary">{option.price}</Badge>
              </div>
            </button>
          ))}
        </div>

        {availableTiers.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            {t('alreadyMaxTier')}
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
            {isUpgrading ? t('upgrading') : t('upgradeNow')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};