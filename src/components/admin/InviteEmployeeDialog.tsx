import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Copy, Check, Mail, MessageCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { UpgradeTierDialog } from './UpgradeTierDialog';
import { useOrganization } from '@/hooks/useOrganization';

interface Invitation {
  id: string;
  invitation_code: string;
  email: string | null;
  status: string;
  expires_at: string;
  created_at: string;
}

interface InviteEmployeeDialogProps {
  onInviteSent?: () => void;
}

export const InviteEmployeeDialog = ({ onInviteSent }: InviteEmployeeDialogProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { organization, employeeCount, canAddMoreEmployees, upgradeTier, refetch } = useOrganization();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [newInviteCode, setNewInviteCode] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchProfile();
      fetchInvitations();
    }
  }, [open, user, organization]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle();
    
    setProfile(data);
  };


  const fetchInvitations = async () => {
    if (!user || !organization) return;
    
    const { data } = await supabase
      .from('employee_invitations')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    
    if (data) {
      setInvitations(data);
    }
  };

  const createInvitation = async () => {
    if (!user || !organization) {
      toast.error(t('noOrganizationFound'));
      return;
    }

    // Check capacity before creating invitation
    if (!canAddMoreEmployees()) {
      setShowUpgradeDialog(true);
      return;
    }

    setIsLoading(true);
    setEmailSent(false);
    
    try {
      const { data, error } = await supabase
        .from('employee_invitations')
        .insert({
          organization_id: organization.id,
          email: email.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const inviteCode = data.invitation_code;
      const inviteLink = `${window.location.origin}/auth?invite=${inviteCode}`;
      
      setNewInviteCode(inviteCode);

      // Send email if email address is provided
      if (email.trim()) {
        try {
          const inviterName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : undefined;
          
          const response = await supabase.functions.invoke('send-invitation-email', {
            body: {
              email: email.trim(),
              invitationCode: inviteCode,
              inviteLink: inviteLink,
              organizationName: organization.name,
              inviterName: inviterName || undefined,
            },
          });

          if (response.error) {
            console.error('Error sending invitation email:', response.error);
            toast.warning(t('invitationCreatedEmailFailed'));
          } else {
            setEmailSent(true);
            toast.success(t('invitationEmailSent'));
          }
        } catch (emailError) {
          console.error('Error sending invitation email:', emailError);
          toast.warning(t('invitationCreatedEmailFailed'));
        }
      } else {
        toast.success(t('invitationCreated'));
      }

      setEmail('');
      fetchInvitations();
      onInviteSent?.();
    } catch (error) {
      console.error('Error creating invitation:', error);
      toast.error(t('failedToCreateInvitation'));
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(t('copiedToClipboard'));
    setTimeout(() => setCopied(false), 2000);
  };

  const copyInviteLink = async (code: string) => {
    const link = `${window.location.origin}/auth?invite=${code}`;
    await navigator.clipboard.writeText(link);
    toast.success(t('inviteLinkCopied'));
  };

  const getInviteLink = (code: string) => {
    return `${window.location.origin}/auth?invite=${code}`;
  };

  const shareViaWhatsApp = (code: string) => {
    const link = getInviteLink(code);
    const message = t('whatsappInviteMessage')
      .replace('{organizationName}', organization?.name || '')
      .replace('{code}', code)
      .replace('{link}', link);
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleUpgrade = async (tier: 'mini' | 'sme' | 'enterprise') => {
    const success = await upgradeTier(tier);
    if (success) {
      toast.success(t('subscriptionUpgraded'));
      refetch();
      return true;
    } else {
      toast.error(t('upgradeFailed'));
      return false;
    }
  };

  if (!organization) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-hermes hover:bg-hermes-dark">
          <UserPlus className="h-4 w-4 mr-2" />
          {t('inviteEmployee')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('inviteEmployee')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create New Invitation */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailOptional')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('employeeEmailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t('emailOptionalNote')}</p>
            </div>

            <Button 
              onClick={createInvitation} 
              disabled={isLoading}
              className="w-full bg-hermes hover:bg-hermes-dark"
            >
              {isLoading ? t('creating') : t('generateInviteCode')}
            </Button>
          </div>

          {/* New Invite Code Display */}
          {newInviteCode && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                {t('inviteCodeGenerated')}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white dark:bg-gray-900 px-3 py-2 rounded font-mono text-lg tracking-widest text-center">
                  {newInviteCode}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => copyInviteCode(newInviteCode)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-green-600"
                  onClick={() => copyInviteLink(newInviteCode)}
                >
                  {t('copyInviteLink')}
                </Button>
                <span className="text-muted-foreground">|</span>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-green-600 flex items-center gap-1"
                  onClick={() => shareViaWhatsApp(newInviteCode)}
                >
                  <MessageCircle className="h-4 w-4" />
                  {t('shareViaWhatsApp')}
                </Button>
              </div>
              {emailSent && (
                <div className="flex items-center gap-2 mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300">
                  <Mail className="h-4 w-4" />
                  <span>{t('emailSentToHelper')}</span>
                </div>
              )}
            </div>
          )}

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="space-y-2">
              <Label>{t('pendingInvitations')}</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {invitations.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div>
                      <code className="font-mono text-sm">{inv.invitation_code}</code>
                      {inv.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {inv.email}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyInviteCode(inv.invitation_code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Organization Info with capacity warning */}
          <div className="pt-2 border-t text-sm text-muted-foreground">
            <p>{t('organization')}: <span className="font-medium text-foreground">{organization.name}</span></p>
            <div className="flex items-center gap-2">
              <p>{t('currentCapacity')}: <span className="font-medium text-foreground">{employeeCount} / {organization.max_employees} {t('employeesCount')}</span></p>
              {!canAddMoreEmployees() && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  {t('capacityReached')}
                </span>
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Upgrade Dialog */}
      <UpgradeTierDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        currentTier={organization.subscription_tier}
        currentMax={organization.max_employees}
        employeeCount={employeeCount}
        onUpgrade={handleUpgrade}
      />
    </Dialog>
  );
};
