import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Building, Briefcase, Calendar, Save, Crown, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslationHelpers } from '@/lib/translations';
import { format } from 'date-fns';
import { getDateLocale, getLocalizedDateFormat } from '@/lib/dateLocale';

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
  const { t, language } = useLanguage();
  const { translateLeaveType } = useTranslationHelpers();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchLeaveBalances();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
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
        .eq('user_id', user?.id)
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

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          department: department,
          position: position,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('profileUpdateSuccess')
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
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('personalInformation')}</CardTitle>
            <Button
              variant={editMode ? "outline" : "default"}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? t('cancel') : t('editProfile')}
            </Button>
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
              <Button variant="outline" size="sm">
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
      </div>
    </div>
  );
}