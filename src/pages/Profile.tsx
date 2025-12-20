import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Building, Briefcase, Calendar, Save, Crown, Shield, UserCog, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslationHelpers } from '@/lib/translations';
import { format } from 'date-fns';
import { getDateLocale, getLocalizedDateFormat } from '@/lib/dateLocale';
import { ImpersonationPanel } from '@/components/admin/ImpersonationPanel';

interface Profile {
  id: string;
  user_id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  position: string;
  manager_id?: string;
  created_at: string;
  updated_at: string;
}

interface LeaveBalance {
  id: string;
  total_days: number;
  used_days: number;
  remaining_days: number;
  year: number;
  leave_types: {
    name: string;
  };
}

interface ChangeRequest {
  id: string;
  user_id: string;
  field_name: string;
  current_value: string | null;
  new_value: string;
  status: string;
  requested_by: string;
  approved_by?: string | null;
  created_at: string;
  approved_at?: string | null;
  employee_name?: string;
}

// Department mapping for translations
const getDepartments = (t: (key: string) => string) => [
  { key: 'Human Resources', label: t('humanResources') },
  { key: 'Engineering', label: t('engineering') },
  { key: 'Marketing', label: t('marketing') },
  { key: 'Sales', label: t('sales') },
  { key: 'Finance', label: t('finance') },
  { key: 'Operations', label: t('operations') },
  { key: 'Customer Support', label: t('customerSupport') },
  { key: 'Product', label: t('product') },
  { key: 'Legal', label: t('legal') },
  { key: 'Domestic Helper', label: t('domesticHelper') },
  { key: 'Others', label: t('others') }
];

export default function Profile() {
  const { user, userRole } = useAuth();
  const { impersonatedUserId, isImpersonating } = useImpersonation();
  const { t, language } = useLanguage();
  const { translateLeaveType } = useTranslationHelpers();
  
  // Use impersonated user ID if active, otherwise use logged-in user
  const effectiveUserId = impersonatedUserId || user?.id;
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [impersonationOpen, setImpersonationOpen] = useState(false);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');

  useEffect(() => {
    if (effectiveUserId) {
      fetchProfile();
      fetchLeaveBalances();
      fetchProfileChangeRequests();
    }
  }, [effectiveUserId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', effectiveUserId)
        .maybeSingle();

      if (error) throw error;
      
      setProfile(data);
      setFirstName(data.first_name);
      setLastName(data.last_name);
      setDepartment(data.department);
      setPosition(data.position);
    } catch (error: any) {
      toast({
        title: t('error'), 
        description: error.message || t('profileUpdateError'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalances = async () => {
    try {
      const { data: balanceData, error: balanceError } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('user_id', effectiveUserId)
        .eq('year', new Date().getFullYear());

      if (balanceError) throw balanceError;

      if (balanceData && balanceData.length > 0) {
        const leaveTypeIds = [...new Set(balanceData.map(b => b.leave_type_id))];
        const { data: leaveTypesData, error: leaveTypesError } = await supabase
          .from('leave_types')
          .select('*')
          .in('id', leaveTypeIds);

        if (leaveTypesError) throw leaveTypesError;

        const leaveTypesMap = new Map(leaveTypesData?.map(lt => [lt.id, lt]) || []);
        
        const enrichedBalances = balanceData.map(balance => ({
          ...balance,
          leave_types: leaveTypesMap.get(balance.leave_type_id) || { name: t('unknown') }
        }));

        setLeaveBalances(enrichedBalances);
      } else {
        setLeaveBalances([]);
      }
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('profileUpdateError'), 
        variant: "destructive"
      });
    }
  };

  const fetchProfileChangeRequests = async () => {
    try {
      const isAdmin = userRole === 'administrator' || userRole === 'hr_admin';
      
      // For admins, fetch all pending requests; for employees, only their own
      let query = supabase
        .from('profile_change_requests')
        .select('*')
        .in('status', ['pending', 'senior_approved'])
        .order('created_at', { ascending: false });
      
      if (!isAdmin) {
        query = query.eq('user_id', effectiveUserId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // For admins, fetch employee names
      if (isAdmin && data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);
        
        const profileMap = new Map(profiles?.map(p => [p.user_id, `${p.first_name} ${p.last_name}`]) || []);
        
        const enrichedData = data.map(req => ({
          ...req,
          employee_name: profileMap.get(req.user_id) || 'Unknown'
        }));
        setChangeRequests(enrichedData);
      } else {
        setChangeRequests(data || []);
      }
    } catch (error: any) {
      toast({ title: t('error'), description: error.message || t('operationFailed'), variant: 'destructive' });
    }
  };

  const handleApproveChange = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profile_change_requests')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
      toast({ title: t('success'), description: 'Profile change approved' });
      await fetchProfileChangeRequests();
      await fetchProfile();
    } catch (error: any) {
      toast({ title: t('error'), description: error.message || t('operationFailed'), variant: 'destructive' });
    }
  };

  const handleRejectChange = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profile_change_requests')
        .update({ status: 'rejected', approved_by: user?.id, approved_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      toast({ title: t('success'), description: 'Profile change rejected' });
      await fetchProfileChangeRequests();
    } catch (error: any) {
      toast({ title: t('error'), description: error.message || t('operationFailed'), variant: 'destructive' });
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      // Update the profile (use effectiveUserId)
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          department: department,
          position: position,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', effectiveUserId);

      if (error) throw error;

      // Log to audit_logs if impersonating
      if (isImpersonating && impersonatedUserId) {
        await supabase.from('audit_logs').insert({
          user_id: user?.id, // Administrator's ID
          action: 'UPDATE',
          table_name: 'profiles',
          record_id: profile.id,
          old_values: {
            first_name: profile.first_name,
            last_name: profile.last_name,
            department: profile.department,
            position: profile.position
          },
          new_values: {
            first_name: firstName,
            last_name: lastName,
            department: department,
            position: position
          },
          ip_address: null,
          user_agent: `Impersonating user: ${impersonatedUserId}`
        });
      }

      toast({
        title: t('success'),
        description: isImpersonating 
          ? `Profile updated by Administrator (viewing ${profile.first_name} ${profile.last_name})`
          : t('profileUpdateSuccess')
      });

      setEditMode(false);
      fetchProfile();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('profileUpdateError'),
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'hr_admin': return Crown;
      case 'manager': return Shield;
      default: return User;
    }
  };

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'hr_admin': return 'destructive';
      case 'manager': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('profileNotFound')}
      </div>
    );
  }

  const departments = getDepartments(t);

  const RoleIcon = getRoleIcon(userRole);

  return (
    <div className="safe-area-screen space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('myProfile')}</h1>
          <p className="text-muted-foreground">{t('managePersonalInfo')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getRoleColor(userRole)} className="flex items-center gap-1">
            <RoleIcon className="h-3 w-3" />
            {userRole || 'employee'}
          </Badge>
        </div>
      </div>

      {/* Impersonation indicator */}
      {isImpersonating && profile && (
        <Alert className="bg-orange-100 border-orange-400">
          <UserCog className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            You are editing <strong>{profile.first_name} {profile.last_name}'s</strong> profile as Administrator
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('personalInformation')}</CardTitle>
            <div className="flex items-center gap-2">
              {userRole === 'administrator' && (
                <Button variant="outline" onClick={() => setImpersonationOpen(true)}>
                  {t('switchUser') || 'Switch User'}
                </Button>
              )}
              <Button
                variant={editMode ? "outline" : "default"}
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? t('cancel') : t('editProfile')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t('firstName')}</Label>
                {editMode ? (
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.first_name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">{t('lastName')}</Label>
                {editMode ? (
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.last_name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('email')}</Label>
                <div className="flex items-center gap-2 p-2 border border-border rounded bg-muted">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('employeeId')}</Label>
                <div className="flex items-center gap-2 p-2 border border-border rounded bg-muted">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.employee_id}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">{t('department')}</Label>
                {editMode ? (
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectDepartment')} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.key} value={dept.key}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.department}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">{t('position')}</Label>
                {editMode ? (
                  <Input
                    id="position"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.position}</span>
                  </div>
                )}
              </div>
            </div>

            {editMode && (
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? t('saving') : t('saveChanges')}
                </Button>
              </div>
            )}

            <Separator className="my-4" />

            <div className="space-y-2">
              <Label>{t('accountCreated')}</Label>
              <div className="flex items-center gap-2 p-2 border border-border rounded bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(profile.created_at), getLocalizedDateFormat(language), { locale: getDateLocale(language) })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leave Balances */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{t('leaveBalances')} ({new Date().getFullYear()})</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  toast({
                    title: t('comingSoon') || 'Coming Soon',
                    description: t('reportFeatureComingSoon') || 'The report generation feature will be available soon. It will allow you to download a detailed PDF report of your leave balances.'
                  });
                }}
              >
                {t('report')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaveBalances.length > 0 ? (
                leaveBalances.map((balance) => (
                  <div key={balance.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{translateLeaveType(balance.leave_types.name)}</span>
                      <Badge variant="outline">
                        {balance.remaining_days} / {balance.total_days}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {t('initialAllocation')}: {balance.total_days} {t('daysYear')}
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min((balance.used_days / balance.total_days) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t('used')}: {balance.used_days} {t('days')}</span>
                      <span>{t('available')}: {balance.remaining_days} {t('days')}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  {t('noLeaveBalances')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Profile Change Requests (Management) */}
        {(userRole === 'administrator' || userRole === 'hr_admin' || userRole === 'manager') && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>{t('profileChangeRequests') || 'Profile Change Requests'}</CardTitle>
            </CardHeader>
            <CardContent>
              {changeRequests.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  {t('noPendingRequests') || 'No pending requests'}
                </div>
              ) : (
                <div className="space-y-4">
                  {changeRequests.map((req) => (
                    <div key={req.id} className="p-3 border rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          {req.employee_name && (
                            <div className="font-semibold text-primary mb-1">{req.employee_name}</div>
                          )}
                          <span className="font-medium">{req.field_name}:</span>{' '}
                          <span className="text-muted-foreground">{req.current_value ?? (t('empty') || 'Empty')}</span>{' '}
                          → <span className="font-medium">{req.new_value}</span>
                        </div>
                        <Badge variant="outline">{req.status}</Badge>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" onClick={() => handleApproveChange(req.id)} className="flex items-center gap-1">
                          <Check className="h-3 w-3" /> {t('approve')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectChange(req.id)} className="flex items-center gap-1">
                          <X className="h-3 w-3" /> {t('reject')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      {/* Impersonation Panel for quick switching on Profile page */}
      <ImpersonationPanel open={impersonationOpen} onOpenChange={setImpersonationOpen} redirectTo="/profile" />
    </div>
  );
}