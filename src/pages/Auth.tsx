import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, User, Users, ArrowLeft, Shield, Heart, Home, Sparkles, Star, CheckCircle2 } from 'lucide-react';
import jiejieLadyIcon from '@/assets/jiejie-lady-icon.png';
import { toast } from 'sonner';

type UserType = 'employer' | 'employee' | null;
type OrgType = 'individual' | 'company';
type AuthMode = 'signin' | 'signup';

const Auth = () => {
  const { signIn, signUp, user, loading } = useAuth();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite');
  
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState<UserType>(inviteCode ? 'employee' : null);
  const [orgType, setOrgType] = useState<OrgType>('individual');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    employeeId: '',
    department: 'General',
    position: '',
    role: 'employee',
    organizationName: '',
    invitationCode: inviteCode || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFirstUser, setIsFirstUser] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState<any>(null);

  // Check if this is the first user registration
  useEffect(() => {
    checkFirstUser();
  }, []);

  // Check invitation code if present
  useEffect(() => {
    if (formData.invitationCode) {
      checkInvitationCode(formData.invitationCode);
    }
  }, [formData.invitationCode]);

  const checkFirstUser = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'first_admin_created')
        .maybeSingle();

      if (!error && data) {
        const settingValue = data.setting_value as { admin_created?: boolean };
        const adminCreated = settingValue?.admin_created || false;
        setIsFirstUser(!adminCreated);
      }
    } catch (error) {
      console.error('Failed to check first user status:', error);
    }
  };

  const checkInvitationCode = async (code: string) => {
    if (code.length < 8) {
      setInvitationDetails(null);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('employee_invitations')
        .select(`
          *,
          organizations:organization_id (name, organization_type)
        `)
        .ilike('invitation_code', code)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (data && !error) {
        setInvitationDetails(data);
        setUserType('employee');
      } else {
        setInvitationDetails(null);
        if (code.length >= 8) {
          setErrors(prev => ({ ...prev, invitationCode: t('invalidInvitationCode') }));
        }
      }
    } catch (error) {
      console.error('Failed to check invitation:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = t('firstNameRequired');
    if (!formData.lastName.trim()) newErrors.lastName = t('lastNameRequired');
    if (!formData.email.trim()) newErrors.email = t('emailRequired');
    if (!formData.password.trim()) newErrors.password = t('passwordRequired');
    if (formData.password.length < 6) newErrors.password = t('passwordMinLength');
    
    if (userType === 'employer') {
      if (!formData.organizationName.trim()) newErrors.organizationName = t('organizationNameRequired');
    }
    
    if (userType === 'employee' && !invitationDetails && !isFirstUser) {
      if (!formData.invitationCode.trim()) newErrors.invitationCode = t('invitationCodeRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Redirect if already authenticated
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse scale-150" />
          <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-primary/30 border-t-primary"></div>
        </div>
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await signIn(formData.email, formData.password);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      // SECURITY CHECK: Verify email doesn't already exist in profiles
      // This prevents someone from using an invitation code to access another user's account
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('user_id, email')
        .eq('email', formData.email.trim().toLowerCase())
        .maybeSingle();

      if (existingProfile) {
        setErrors({ 
          email: t('emailAlreadyRegistered') || 'This email is already registered. Please sign in instead.' 
        });
        setIsLoading(false);
        return;
      }

      // Build metadata based on user type
      const metadata: Record<string, any> = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        is_employer: userType === 'employer',
      };

      if (isFirstUser) {
        // First user is always administrator
        metadata.role = 'administrator';
      } else if (userType === 'employer') {
        metadata.role = 'hr_admin';
        metadata.organization_name = formData.organizationName.trim();
        metadata.organization_type = orgType;
        metadata.industry_type = 'household'; // Always household for Jie Jie app
      } else {
        metadata.role = 'employee';
        metadata.invitation_code = formData.invitationCode;
        metadata.position = formData.position.trim() || 'Employee';
        metadata.department = formData.department;
      }
      
      const result = await signUp(formData.email, formData.password, metadata);
      
      if (result?.error) {
        setErrors({ submit: result.error.message });
      } else {
        // After successful signup, handle organization/invitation
        if (userType === 'employer' && !isFirstUser) {
          toast.success(t('accountCreatedEmployer'));
        } else if (userType === 'employee' && invitationDetails) {
          toast.success(t('accountCreatedEmployee'));
        } else if (isFirstUser) {
          await checkFirstUser();
          toast.success(t('adminAccountCreated'));
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ submit: 'An error occurred during registration' });
    }
    
    setIsLoading(false);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderUserTypeSelection = () => (
    <div className="space-y-5">
      <p className="text-center text-muted-foreground">{t('selectAccountType')}</p>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setUserType('employer')}
          className="group flex flex-col items-center p-5 border-2 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all bg-background/60 hover:shadow-lg hover:-translate-y-0.5"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <span className="font-semibold text-sm">{t('employerRole')}</span>
          <span className="text-xs text-muted-foreground text-center mt-1">{t('employerDescription')}</span>
        </button>
        
        <button
          type="button"
          onClick={() => setUserType('employee')}
          className="group flex flex-col items-center p-5 border-2 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all bg-background/60 hover:shadow-lg hover:-translate-y-0.5"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <User className="h-7 w-7 text-primary" />
          </div>
          <span className="font-semibold text-sm">{t('employeeRole')}</span>
          <span className="text-xs text-muted-foreground text-center mt-1">{t('employeeDescription')}</span>
        </button>
      </div>
    </div>
  );

  const renderEmployerForm = () => (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setUserType(null)}
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 hover:gap-2 transition-all"
      >
        <ArrowLeft className="w-4 h-4" /> {t('back')}
      </button>

      {/* Organization Type Selection */}
      <div className="space-y-3">
        <Label className="text-muted-foreground text-sm">{t('organizationType')}</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setOrgType('individual')}
            className={`group p-4 border-2 rounded-2xl text-left transition-all hover:-translate-y-0.5 ${
              orgType === 'individual' ? 'border-primary bg-primary/5 shadow-md' : 'hover:border-muted-foreground bg-background/60'
            }`}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <User className="h-5 w-5 text-primary" />
            </div>
            <p className="font-medium text-sm">{t('individualEmployer')}</p>
            <p className="text-xs text-muted-foreground">{t('oneHelperFree')}</p>
          </button>
          
          <button
            type="button"
            onClick={() => setOrgType('company')}
            className={`group p-4 border-2 rounded-2xl text-left transition-all hover:-translate-y-0.5 ${
              orgType === 'company' ? 'border-primary bg-primary/5 shadow-md' : 'hover:border-muted-foreground bg-background/60'
            }`}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="font-medium text-sm">{t('company')}</p>
            <p className="text-xs text-muted-foreground">{t('multipleEmployeesPaid')}</p>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="org-name" className="text-muted-foreground text-sm">{orgType === 'individual' ? t('yourName') : t('companyName')}</Label>
        <Input
          id="org-name"
          placeholder={orgType === 'individual' ? t('yourNamePlaceholder') : t('companyNamePlaceholder')}
          value={formData.organizationName}
          onChange={(e) => updateFormData('organizationName', e.target.value)}
          className="rounded-xl border-border/50 bg-background/60 h-12 shadow-sm focus:shadow-md transition-all"
          required
        />
        {errors.organizationName && <p className="text-sm text-destructive">{errors.organizationName}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="first-name" className="text-muted-foreground text-sm">{t('firstName')}</Label>
          <Input
            id="first-name"
            placeholder={t('firstNamePlaceholder')}
            value={formData.firstName}
            onChange={(e) => updateFormData('firstName', e.target.value)}
            className="rounded-xl border-border/50 bg-background/60 h-12 shadow-sm focus:shadow-md transition-all"
            required
          />
          {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="last-name" className="text-muted-foreground text-sm">{t('lastName')}</Label>
          <Input
            id="last-name"
            placeholder={t('lastNamePlaceholder')}
            value={formData.lastName}
            onChange={(e) => updateFormData('lastName', e.target.value)}
            className="rounded-xl border-border/50 bg-background/60 h-12 shadow-sm focus:shadow-md transition-all"
            required
          />
          {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-muted-foreground text-sm">{t('email')}</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder={t('emailPlaceholder')}
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          className="rounded-xl border-border/50 bg-background/60 h-12 shadow-sm focus:shadow-md transition-all"
          required
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password" className="text-muted-foreground text-sm">{t('password')}</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder={t('createStrongPassword')}
          value={formData.password}
          onChange={(e) => updateFormData('password', e.target.value)}
          className="rounded-xl border-border/50 bg-background/60 h-12 shadow-sm focus:shadow-md transition-all"
          required
          minLength={6}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
      </div>

      {/* Pricing Info */}
      {orgType === 'company' && (
        <div className="p-4 bg-muted/30 border border-border/50 rounded-2xl text-sm">
          <p className="font-medium mb-2">{t('pricingTiers')}</p>
          <ul className="space-y-1 text-muted-foreground text-xs">
            <li>• {t('tier1to5')}</li>
            <li>• {t('tier6to20')}</li>
            <li>• {t('tier21to50')}</li>
          </ul>
        </div>
      )}

      {orgType === 'individual' && (
        <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl text-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <p className="font-medium text-primary">{t('freeForIndividual')}</p>
          </div>
          <p className="text-xs text-primary/80 ml-6">{t('oneHelperNoCharge')}</p>
        </div>
      )}

      {errors.submit && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
          {errors.submit}
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full h-12 rounded-xl bg-gradient-to-r from-accent to-accent/90 hover:from-accent/95 hover:to-accent/85 text-accent-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5" 
        disabled={isLoading}
      >
        {isLoading ? t('creatingAccount') : t('createEmployerAccount')}
      </Button>
    </div>
  );

  const renderEmployeeForm = () => (
    <div className="space-y-4">
      {!inviteCode && (
        <button
          type="button"
          onClick={() => setUserType(null)}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 hover:gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> {t('back')}
        </button>
      )}

      {/* Invitation Code */}
      <div className="space-y-2">
        <Label htmlFor="invite-code" className="text-muted-foreground text-sm">{t('invitationCode')}</Label>
        <Input
          id="invite-code"
          placeholder={t('enterInvitationCode')}
          value={formData.invitationCode}
          onChange={(e) => updateFormData('invitationCode', e.target.value)}
          className="tracking-widest text-center font-mono rounded-xl border-border/50 bg-background/60 h-12 shadow-sm focus:shadow-md transition-all"
          maxLength={8}
          required
        />
        {errors.invitationCode && <p className="text-sm text-destructive">{errors.invitationCode}</p>}
        
        {invitationDetails && (
          <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-primary">
                {t('validInvitation')}
              </p>
            </div>
            <p className="text-xs text-primary/80 mt-1 ml-6">
              {t('joiningOrganization')}: {invitationDetails.organizations?.name}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="first-name" className="text-muted-foreground text-sm">{t('firstName')}</Label>
          <Input
            id="first-name"
            placeholder={t('firstNamePlaceholder')}
            value={formData.firstName}
            onChange={(e) => updateFormData('firstName', e.target.value)}
            className="rounded-xl border-border/50 bg-background/60 h-12 shadow-sm focus:shadow-md transition-all"
            required
          />
          {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="last-name" className="text-muted-foreground text-sm">{t('lastName')}</Label>
          <Input
            id="last-name"
            placeholder={t('lastNamePlaceholder')}
            value={formData.lastName}
            onChange={(e) => updateFormData('lastName', e.target.value)}
            className="rounded-xl border-border/50 bg-background/60 h-12 shadow-sm focus:shadow-md transition-all"
            required
          />
          {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="position" className="text-muted-foreground text-sm">{t('position')}</Label>
        <Select
          value={formData.position}
          onValueChange={(value) => updateFormData('position', value)}
        >
          <SelectTrigger className="rounded-xl border-border/50 bg-background/60 h-12 shadow-sm focus:shadow-md transition-all">
            <SelectValue placeholder={t('selectPosition')} />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="domestic_helper">{t('domesticHelper')}</SelectItem>
            <SelectItem value="caregiver">{t('caregiver')}</SelectItem>
            <SelectItem value="nanny">{t('nanny')}</SelectItem>
            <SelectItem value="cook">{t('cook')}</SelectItem>
            <SelectItem value="driver">{t('driver')}</SelectItem>
            <SelectItem value="gardener">{t('gardener')}</SelectItem>
            <SelectItem value="other">{t('other')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-muted-foreground text-sm">{t('email')}</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder={t('emailPlaceholder')}
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          className="rounded-xl border-border/50 bg-background/60 h-12 shadow-sm focus:shadow-md transition-all"
          required
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password" className="text-muted-foreground text-sm">{t('password')}</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder={t('createStrongPassword')}
          value={formData.password}
          onChange={(e) => updateFormData('password', e.target.value)}
          className="rounded-xl border-border/50 bg-background/60 h-12 shadow-sm focus:shadow-md transition-all"
          required
          minLength={6}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
      </div>

      {errors.submit && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
          {errors.submit}
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full h-12 rounded-xl bg-gradient-to-r from-accent to-accent/90 hover:from-accent/95 hover:to-accent/85 text-accent-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5" 
        disabled={isLoading || !invitationDetails}
      >
        {isLoading ? t('creatingAccount') : t('createEmployeeAccount')}
      </Button>
    </div>
  );

  const renderFirstUserForm = () => (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl text-sm">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-primary" />
          <p className="font-medium text-primary">{t('firstUserNotice')}</p>
        </div>
        <p className="text-xs text-primary/80 ml-6">{t('firstUserDescription')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="first-name" className="text-muted-foreground text-sm">{t('firstName')}</Label>
          <Input
            id="first-name"
            placeholder={t('firstNamePlaceholder')}
            value={formData.firstName}
            onChange={(e) => updateFormData('firstName', e.target.value)}
            className="rounded-xl border-border/50 bg-background/60 h-12 shadow-sm focus:shadow-md transition-all"
            required
          />
          {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="last-name" className="text-muted-foreground text-sm">{t('lastName')}</Label>
          <Input
            id="last-name"
            placeholder={t('lastNamePlaceholder')}
            value={formData.lastName}
            onChange={(e) => updateFormData('lastName', e.target.value)}
            className="rounded-xl border-border/50 bg-background/60 h-12 shadow-sm focus:shadow-md transition-all"
            required
          />
          {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-muted-foreground text-sm">{t('email')}</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder={t('emailPlaceholder')}
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          className="rounded-xl border-border/50 bg-background/60 h-12 shadow-sm focus:shadow-md transition-all"
          required
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password" className="text-muted-foreground text-sm">{t('password')}</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder={t('createStrongPassword')}
          value={formData.password}
          onChange={(e) => updateFormData('password', e.target.value)}
          className="rounded-xl border-border/50 bg-background/60 h-12 shadow-sm focus:shadow-md transition-all"
          required
          minLength={6}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
      </div>

      {errors.submit && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
          {errors.submit}
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full h-12 rounded-xl bg-gradient-to-r from-accent to-accent/90 hover:from-accent/95 hover:to-accent/85 text-accent-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5" 
        disabled={isLoading}
      >
        {isLoading ? t('creatingAccount') : t('createAdminAccount')}
      </Button>
    </div>
  );

  // Feature highlights for the left panel
  const features = [
    { icon: Heart, label: t('featureCare') || 'Care Management', color: 'text-rose-500' },
    { icon: Shield, label: t('featureSecurity') || 'Secure & Private', color: 'text-primary' },
    { icon: Home, label: t('featureHome') || 'Home Organization', color: 'text-amber-500' },
  ];

  return (
    <div className="min-h-screen safe-area-screen flex flex-col lg:flex-row bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-accent/15 to-transparent blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-gradient-to-r from-primary/5 to-accent/5 blur-2xl animate-float" style={{ animationDelay: '1.5s' }} />
        
        {/* Decorative dots pattern */}
        <div className="absolute top-20 right-20 grid grid-cols-4 gap-3 opacity-20">
          {[...Array(16)].map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-primary" />
          ))}
        </div>
        <div className="absolute bottom-32 left-16 grid grid-cols-3 gap-2 opacity-15">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent" />
          ))}
        </div>
      </div>

      {/* Left Panel - Brand showcase (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative items-center justify-center p-12">
        <div className="max-w-lg relative z-10">
          {/* Logo and brand */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 blur-lg scale-110" />
              <img 
                src={jiejieLadyIcon} 
                alt="Jie Jie" 
                className="relative w-20 h-20 rounded-2xl object-cover ring-4 ring-white/50 shadow-2xl" 
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center shadow-lg">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">{t('appNameLine1')}</h1>
              <p className="text-lg text-muted-foreground font-medium">{t('appNameLine2')}</p>
            </div>
          </div>

          {/* Tagline */}
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground leading-snug mb-6">
            {t('loginTagline') || 'Your trusted partner for household management'}
          </h2>
          <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
            {t('loginSubtagline') || 'Simplify your home care with our comprehensive platform for managing household helpers.'}
          </p>

          {/* Feature list */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-background to-muted flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <span className="font-medium text-foreground">{feature.label}</span>
              </div>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex items-center gap-6 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border-2 border-background flex items-center justify-center">
                    <Star className="w-3.5 h-3.5 text-accent" />
                  </div>
                ))}
              </div>
              <span>{t('trustedBy') || 'Trusted by families'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth forms */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo (shown only on mobile) */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 blur-lg scale-110" />
              <img 
                src={jiejieLadyIcon} 
                alt="Jie Jie" 
                className="relative w-16 h-16 rounded-2xl object-cover ring-4 ring-white/50 shadow-xl" 
              />
            </div>
          </div>

          {/* Sign In View */}
          {authMode === 'signin' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Card with brand colors */}
              <div className="relative bg-gradient-to-br from-primary via-primary to-primary/90 rounded-3xl p-8 text-center text-primary-foreground shadow-2xl overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/2" />
                <div className="absolute top-1/2 right-4 w-16 h-16 rounded-full bg-white/5" />
                
                <div className="relative">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-white/25 blur-md scale-125 animate-pulse" />
                      <img 
                        src={jiejieLadyIcon} 
                        alt="Jie Jie" 
                        className="relative w-20 h-20 rounded-full object-cover ring-4 ring-white/40 shadow-xl" 
                      />
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold mb-1 tracking-tight">{t('appNameLine1')}</h1>
                  <p className="text-lg opacity-90 font-medium">{t('appNameLine2')}</p>
                  <p className="text-sm opacity-75 mt-2">{t('welcomeBack') || 'Welcome back'}</p>
                </div>
              </div>

              {/* Sign In Form */}
              <Card variant="glass" className="rounded-3xl border-white/40 shadow-2xl">
                <CardContent className="p-6 space-y-4">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-muted-foreground text-sm font-medium">{t('email')}</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder={t('enterEmail')}
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        className="rounded-xl border-border/50 bg-background/70 h-12 shadow-sm focus:shadow-lg focus:border-primary/50 transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-muted-foreground text-sm font-medium">{t('password')}</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder={t('enterPassword')}
                        value={formData.password}
                        onChange={(e) => updateFormData('password', e.target.value)}
                        className="rounded-xl border-border/50 bg-background/70 h-12 shadow-sm focus:shadow-lg focus:border-primary/50 transition-all"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-accent to-accent/90 hover:from-accent/95 hover:to-accent/85 text-accent-foreground font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                          {t('signingIn')}
                        </span>
                      ) : t('signIn')}
                    </Button>
                  </form>

                  <div className="flex justify-center pt-2">
                    <Link to="/reset-password" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium hover:underline underline-offset-4">{t('forgotPassword')}</Link>
                  </div>
                </CardContent>
              </Card>

              {/* Sign Up Link */}
              <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <p className="text-muted-foreground text-sm">{t('dontHaveAccount')}</p>
                <button 
                  onClick={() => setAuthMode('signup')}
                  className="text-primary font-semibold hover:text-primary/80 transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-center"
                >
                  {t('signUpHere')}
                </button>
              </div>
            </div>
          )}

          {/* Sign Up View */}
          {authMode === 'signup' && (
            <div className="space-y-4 animate-fade-in">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <button 
                  onClick={() => {
                    setAuthMode('signin');
                    setUserType(null);
                  }}
                  className="p-2.5 rounded-full bg-card/80 hover:bg-card shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border border-border/50"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">{t('signUp')}</h1>
                  <p className="text-sm text-muted-foreground">{t('createAccountSubtitle') || 'Create your account'}</p>
                </div>
              </div>

              <Card variant="glass" className="rounded-3xl border-white/40 shadow-2xl">
                <CardContent className="p-6">
                  <form onSubmit={handleSignUp}>
                    {isFirstUser ? renderFirstUserForm() : (
                      userType === null ? renderUserTypeSelection() :
                      userType === 'employer' ? renderEmployerForm() :
                      renderEmployeeForm()
                    )}
                  </form>
                </CardContent>
              </Card>

              {/* Sign In Link */}
              <div className="text-center space-y-2">
                <p className="text-muted-foreground text-sm">{t('alreadyHaveAccount')}</p>
                <button 
                  onClick={() => setAuthMode('signin')}
                  className="text-primary font-semibold hover:text-primary/80 transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-center"
                >
                  {t('signInHere')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
