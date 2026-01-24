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
import { Building2, User, Users, ArrowLeft } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          className="flex flex-col items-center p-5 border-2 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all bg-muted/30"
        >
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <span className="font-semibold text-sm">{t('employerRole')}</span>
          <span className="text-xs text-muted-foreground text-center mt-1">{t('employerDescription')}</span>
        </button>
        
        <button
          type="button"
          onClick={() => setUserType('employee')}
          className="flex flex-col items-center p-5 border-2 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all bg-muted/30"
        >
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-3">
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
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
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
            className={`p-4 border-2 rounded-2xl text-left transition-all ${
              orgType === 'individual' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground bg-muted/30'
            }`}
          >
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <User className="h-5 w-5 text-primary" />
            </div>
            <p className="font-medium text-sm">{t('individualEmployer')}</p>
            <p className="text-xs text-muted-foreground">{t('oneHelperFree')}</p>
          </button>
          
          <button
            type="button"
            onClick={() => setOrgType('company')}
            className={`p-4 border-2 rounded-2xl text-left transition-all ${
              orgType === 'company' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground bg-muted/30'
            }`}
          >
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
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
          className="rounded-xl border-border bg-muted/50 h-12"
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
            className="rounded-xl border-border bg-muted/50 h-12"
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
            className="rounded-xl border-border bg-muted/50 h-12"
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
          className="rounded-xl border-border bg-muted/50 h-12"
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
          className="rounded-xl border-border bg-muted/50 h-12"
          required
          minLength={6}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
      </div>

      {/* Pricing Info */}
      {orgType === 'company' && (
        <div className="p-4 bg-muted/50 rounded-2xl text-sm">
          <p className="font-medium mb-2">{t('pricingTiers')}</p>
          <ul className="space-y-1 text-muted-foreground text-xs">
            <li>• {t('tier1to5')}</li>
            <li>• {t('tier6to20')}</li>
            <li>• {t('tier21to50')}</li>
          </ul>
        </div>
      )}

      {orgType === 'individual' && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl text-sm">
          <p className="font-medium text-primary">{t('freeForIndividual')}</p>
          <p className="text-xs text-primary/80 mt-1">{t('oneHelperNoCharge')}</p>
        </div>
      )}

      {errors.submit && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl">
          {errors.submit}
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold" 
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
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
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
          className="tracking-widest text-center font-mono rounded-xl border-border bg-muted/50 h-12"
          maxLength={8}
          required
        />
        {errors.invitationCode && <p className="text-sm text-destructive">{errors.invitationCode}</p>}
        
        {invitationDetails && (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl">
            <p className="text-sm font-medium text-primary">
              ✓ {t('validInvitation')}
            </p>
            <p className="text-xs text-primary/80 mt-1">
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
            className="rounded-xl border-border bg-muted/50 h-12"
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
            className="rounded-xl border-border bg-muted/50 h-12"
            required
          />
          {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="position" className="text-muted-foreground text-sm">{t('position')}</Label>
        <Input
          id="position"
          placeholder={t('positionPlaceholder')}
          value={formData.position}
          onChange={(e) => updateFormData('position', e.target.value)}
          className="rounded-xl border-border bg-muted/50 h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email" className="text-muted-foreground text-sm">{t('email')}</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder={t('emailPlaceholder')}
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          className="rounded-xl border-border bg-muted/50 h-12"
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
          className="rounded-xl border-border bg-muted/50 h-12"
          required
          minLength={6}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
      </div>

      <div className="p-4 bg-muted/50 rounded-2xl text-sm text-muted-foreground">
        <p>{t('employeeJoinNote')}</p>
      </div>

      {errors.submit && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl">
          {errors.submit}
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold" 
        disabled={isLoading || (!invitationDetails && formData.invitationCode.length >= 8)}
      >
        {isLoading ? t('creatingAccount') : t('joinAsEmployee')}
      </Button>
    </div>
  );

  const renderFirstUserForm = () => (
    <div className="space-y-4">
      <div className="p-4 text-sm bg-primary/10 border border-primary/20 rounded-2xl">
        <p className="font-medium mb-1">{t('firstAdminAccount')}</p>
        <p className="text-muted-foreground text-xs">{t('firstAdminDescription')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="first-name" className="text-muted-foreground text-sm">{t('firstName')}</Label>
          <Input
            id="first-name"
            placeholder={t('firstNamePlaceholder')}
            value={formData.firstName}
            onChange={(e) => updateFormData('firstName', e.target.value)}
            className="rounded-xl border-border bg-muted/50 h-12"
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
            className="rounded-xl border-border bg-muted/50 h-12"
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
          className="rounded-xl border-border bg-muted/50 h-12"
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
          className="rounded-xl border-border bg-muted/50 h-12"
          required
          minLength={6}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
      </div>

      {errors.submit && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl">
          {errors.submit}
        </div>
      )}

      <Button 
        type="submit" 
        className="w-full h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold" 
        disabled={isLoading}
      >
        {isLoading ? t('creatingAccount') : t('createAdminAccount')}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen safe-area-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        {/* Sign In View */}
        {authMode === 'signin' && (
          <div className="space-y-6 animate-fade-in">
            {/* Logo/Branding Section - Jie Jie branding */}
            <div className="bg-primary rounded-3xl p-8 text-center text-primary-foreground shadow-elevated">
              <div className="flex justify-center mb-4">
                <img src={jiejieLadyIcon} alt="Jie Jie" className="w-20 h-20 rounded-full object-cover" />
              </div>
              <h1 className="text-2xl font-bold mb-1">{t('appNameLine1')}</h1>
              <p className="text-lg opacity-90">{t('appNameLine2')}</p>
            </div>

            {/* Sign In Form */}
            <Card className="rounded-3xl shadow-card border-0">
              <CardContent className="p-6 space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-muted-foreground text-sm">{t('email')}</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder={t('enterEmail')}
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      className="rounded-xl border-border bg-muted/50 h-12"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-muted-foreground text-sm">{t('password')}</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder={t('enterPassword')}
                      value={formData.password}
                      onChange={(e) => updateFormData('password', e.target.value)}
                      className="rounded-xl border-border bg-muted/50 h-12"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base shadow-md" 
                    disabled={isLoading}
                  >
                    {isLoading ? t('signingIn') : t('signIn')}
                  </Button>
                </form>

                <div className="flex justify-center pt-2">
                  <Link to="/reset-password" className="text-sm text-primary hover:underline">{t('forgotPassword')}</Link>
                </div>
              </CardContent>
            </Card>

            {/* Sign Up Link */}
            <div className="text-center space-y-2">
              <p className="text-muted-foreground text-sm">{t('dontHaveAccount')}</p>
              <button 
                onClick={() => setAuthMode('signup')}
                className="text-primary font-semibold hover:underline"
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
                className="p-2 rounded-full bg-card hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold">{t('signUp')}</h1>
            </div>

            <Card className="rounded-3xl shadow-card border-0">
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
                className="text-primary font-semibold hover:underline"
              >
                {t('signInHere')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
