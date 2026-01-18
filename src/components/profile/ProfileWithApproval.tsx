import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslationHelpers } from '@/lib/translations';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Building, Briefcase, Calendar, Save, Crown, Shield, Edit, Clock, Check, X, Phone, MapPin, Heart, FileText, Lock, Eye, EyeOff, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import DocumentManager from './DocumentManager';
import AvatarUpload from './AvatarUpload';

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
  profile_completed: boolean;
  initial_setup_completed_at?: string;
  // Extended fields
  id_number?: string;
  passport_number?: string;
  visa_number?: string;
  date_of_birth?: string;
  home_address?: string;
  marital_status?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  phone_number?: string;
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

interface ProfileChangeRequest {
  id: string;
  user_id: string;
  requested_by: string;
  field_name: string;
  current_value: string;
  new_value: string;
  status: string;
  created_at: string;
}

const departments = [
  'Human Resources',
  'Engineering',
  'Marketing',
  'Sales',
  'Finance',
  'Operations',
  'Customer Support',
  'Product',
  'Legal',
  'Domestic Helper',
  'Others'
];

export default function ProfileWithApproval() {
  const { user, userRole } = useAuth();
  const { impersonatedUserId, isImpersonating } = useImpersonation();
  const { t, language } = useLanguage();
  const { translateLeaveType } = useTranslationHelpers();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [changeRequests, setChangeRequests] = useState<ProfileChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChangeDialog, setShowChangeDialog] = useState(false);
  const [selectedField, setSelectedField] = useState('');
  const [newValue, setNewValue] = useState('');
  const [setupMode, setSetupMode] = useState(false);
  const [setupValues, setSetupValues] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  
  // Document upload dialog state for ID/Passport/Visa
  const [showDocumentUploadDialog, setShowDocumentUploadDialog] = useState(false);
  const [pendingDocumentType, setPendingDocumentType] = useState<'id_card' | 'passport' | 'visa' | null>(null);

  // For managers - staff profile selection
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedStaffProfile, setSelectedStaffProfile] = useState<Profile | null>(null);
  
  // HR Admin direct editing state
  const [hrEditMode, setHrEditMode] = useState(false);
  const [hrEditValues, setHrEditValues] = useState<Partial<Profile>>({});
  
  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const isManager = userRole === 'manager' || userRole === 'hr_admin';
  const isHrAdmin = userRole === 'hr_admin';
  const isAdministrator = userRole === 'administrator';
  
  // Use impersonated user ID for administrators, otherwise use manager's staff selection
  const effectiveUserId = isAdministrator && impersonatedUserId 
    ? impersonatedUserId 
    : (isManager && selectedStaffId ? selectedStaffId : user?.id);
  
  const currentProfile = effectiveUserId !== user?.id ? selectedStaffProfile : profile;
  const viewingUserId = effectiveUserId;

  // Define all profile fields for initial setup and change requests
  const allProfileFields = [
    'first_name', 'last_name', 'employee_id', 'email', 'department', 'position',
    'phone_number', 'home_address', 'marital_status', 'emergency_contact_name', 
    'emergency_contact_phone', 'id_number', 'passport_number', 'visa_number', 'date_of_birth'
  ];

  // Don't show incomplete banner for HR Admin or Administrator roles
  const isProfileIncomplete = currentProfile && !currentProfile.profile_completed && 
    userRole !== 'hr_admin' && userRole !== 'administrator';
  // HR Admins and Administrators can always directly edit, users can only edit during initial setup
  const canUserEditDirectly = (!isManager && !isAdministrator && isProfileIncomplete);
  const canHrAdminEdit = isHrAdmin || isAdministrator;

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchChangeRequests();
      if (isManager || isAdministrator) {
        fetchAllProfiles();
      }
    }
  }, [user, userRole]);

  // Fetch selected profile when impersonating or selecting staff
  useEffect(() => {
    if (effectiveUserId && effectiveUserId !== user?.id) {
      fetchSelectedProfile(effectiveUserId);
    }
  }, [effectiveUserId]);

  // Refresh change requests when viewing different employee
  useEffect(() => {
    if (viewingUserId) {
      fetchLeaveBalances();
      fetchChangeRequests();
    }
  }, [viewingUserId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to fetch profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('first_name');

      if (error) throw error;
      setAllProfiles(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch staff profiles",
        variant: "destructive"
      });
    }
  };

  const fetchSelectedStaffProfile = async (staffId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', staffId)
        .maybeSingle();

      if (error) throw error;
      setSelectedStaffProfile(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch staff profile",
        variant: "destructive"
      });
    }
  };

  // Generic function to fetch any profile by user_id
  const fetchSelectedProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      setSelectedStaffProfile(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch profile",
        variant: "destructive"
      });
    }
  };

  const fetchLeaveBalances = async () => {
    try {
      const { data: balanceData, error: balanceError } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('user_id', viewingUserId)
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
          leave_types: leaveTypesMap.get(balance.leave_type_id) || { name: 'Unknown' }
        }));

        setLeaveBalances(enrichedBalances);
      } else {
        setLeaveBalances([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch leave balances", 
        variant: "destructive"
      });
    }
  };

  const fetchChangeRequests = async () => {
    try {
      let query = supabase
        .from('profile_change_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // If not manager/HR admin/Administrator, only fetch own requests
      if (!isManager && !isAdministrator) {
        query = query.eq('user_id', user?.id);
      } else if ((isManager || isAdministrator) && viewingUserId && viewingUserId !== user?.id) {
        // When viewing a specific employee's profile, filter to their requests
        query = query.eq('user_id', viewingUserId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setChangeRequests(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch change requests",
        variant: "destructive"
      });
    }
  };

  const handleCompleteSetup = async () => {
    if (!currentProfile) return;

    // Required fields for initial setup - ALL must be filled
    const requiredFields = [
      'first_name', 'last_name', 'phone_number', 'home_address',
      'marital_status', 'emergency_contact_name', 'emergency_contact_phone', 
      'id_number', 'passport_number', 'visa_number', 'date_of_birth'
    ];

    const updates: Partial<Profile> = { ...setupValues };
    const missingFields: string[] = [];
    
    // Check for empty required fields
    requiredFields.forEach((field) => {
      const current = (updates as any)[field] ?? (currentProfile as any)[field];
      if (!current || String(current).trim() === '') {
        missingFields.push(field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
      }
    });

    // If there are missing fields, alert admin/HR and don't complete
    if (missingFields.length > 0) {
      // Create alert notification for admin/HR about incomplete profile
      try {
        await supabase.from('profile_change_requests').insert({
          user_id: currentProfile.user_id,
          requested_by: user?.id,
          field_name: 'profile_incomplete_alert',
          current_value: '',
          new_value: `Missing fields: ${missingFields.join(', ')}`,
          status: 'pending'
        });
      } catch (err) {
        console.error('Failed to create incomplete profile alert:', err);
      }

      toast({
        title: t('profileIncomplete') || 'Profile Incomplete',
        description: `${t('missingRequiredFields') || 'Missing required fields'}: ${missingFields.join(', ')}. ${t('adminNotified') || 'Admin/HR has been notified.'}`,
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          profile_completed: true,
          initial_setup_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentProfile.user_id);

      if (error) throw error;

      toast({
        title: t('success') || 'Success',
        description: t('profileSetupComplete') || 'Profile setup completed successfully'
      });

      setSetupMode(false);
      setSetupValues({});

      // Refresh the profile data
      if (isManager && selectedStaffId) {
        fetchSelectedStaffProfile(selectedStaffId);
      } else {
        fetchProfile();
      }
    } catch (error: any) {
      toast({
        title: t('error') || 'Error',
        description: error.message || t('failedToCompleteSetup') || 'Failed to complete profile setup',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSetupCancel = () => {
    setSetupMode(false);
    setSetupValues({});
  };

  const updateSetupValue = (field: string, value: string) => {
    setSetupValues(prev => ({ ...prev, [field]: value }));
  };

  // Helper: check which fields are still missing
  const getMissingFields = () => {
    if (!currentProfile) return [];
    const requiredFields = [
      'first_name', 'last_name', 'phone_number', 'home_address',
      'marital_status', 'emergency_contact_name', 'emergency_contact_phone', 
      'id_number', 'passport_number', 'visa_number', 'date_of_birth'
    ];
    const missingFields: string[] = [];
    requiredFields.forEach((field) => {
      const current = (setupValues as any)[field] ?? (currentProfile as any)[field];
      if (!current || String(current).trim() === '') {
        missingFields.push(field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
      }
    });
    return missingFields;
  };

  const updateHrEditValue = (field: string, value: string) => {
    setHrEditValues(prev => ({ ...prev, [field]: value }));
  };

  const handleHrDirectSave = async () => {
    if (!currentProfile || !isHrAdmin) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...hrEditValues,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentProfile.user_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });

      setHrEditMode(false);
      setHrEditValues({});
      
      // Refresh the profile data
      if (isManager && selectedStaffId) {
        fetchSelectedStaffProfile(selectedStaffId);
      } else {
        fetchProfile();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleHrEditCancel = () => {
    setHrEditMode(false);
    setHrEditValues({});
  };

  const handleRequestChange = async () => {
    if (!selectedField || !newValue.trim() || !currentProfile) return;

    try {
      const currentValue = currentProfile[selectedField as keyof Profile] || '';

      // If user is Administrator or HR Admin, directly apply the change without approval
      if (isAdministrator || isHrAdmin) {
        // Directly update the profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            [selectedField]: newValue,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', currentProfile.user_id);

        if (updateError) throw updateError;

        // Also create a record for audit purposes with auto-approved status
        await supabase
          .from('profile_change_requests')
          .insert({
            user_id: currentProfile.user_id,
            requested_by: user?.id,
            field_name: selectedField,
            current_value: String(currentValue),
            new_value: newValue,
            status: 'approved',
            approved_by: user?.id,
            approved_at: new Date().toISOString()
          });

        toast({
          title: t('success') || "Success",
          description: t('profileUpdatedDirectly') || "Profile updated successfully"
        });

        // Refresh the profile
        if (effectiveUserId !== user?.id) {
          fetchSelectedProfile(effectiveUserId!);
        } else {
          fetchProfile();
        }
      } else {
        // Regular employee - create pending request
        const { error } = await supabase
          .from('profile_change_requests')
          .insert({
            user_id: currentProfile.user_id,
            requested_by: user?.id,
            field_name: selectedField,
            current_value: String(currentValue),
            new_value: newValue,
            status: 'pending'
          });

        if (error) throw error;

        toast({
          title: t('success') || "Success",
          description: t('changeRequestSubmitted') || "Profile change request submitted for approval"
        });
      }

      setShowChangeDialog(false);
      setSelectedField('');
      setNewValue('');
      fetchChangeRequests();
    } catch (error: any) {
      toast({
        title: t('error') || "Error",
        description: error.message || t('failedToSubmitRequest') || "Failed to submit change request",
        variant: "destructive"
      });
    }
  };

  const approveChangeRequest = async (requestId: string) => {
    try {
      // Mark the request as approved - the database trigger will automatically apply the change
      const { error } = await supabase
        .from('profile_change_requests')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Change request approved - profile updated automatically"
      });

      fetchChangeRequests();
      fetchProfile();
      if (selectedStaffId) {
        fetchSelectedStaffProfile(selectedStaffId);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to approve change request",
        variant: "destructive"
      });
    }
  };

  const rejectChangeRequest = async (requestId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('profile_change_requests')
        .update({
          status: 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Change request rejected"
      });

      fetchChangeRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to reject change request",
        variant: "destructive"
      });
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

  const handleStaffSelection = (staffId: string) => {
    setSelectedStaffId(staffId);
    if (staffId) {
      fetchSelectedStaffProfile(staffId);
    } else {
      setSelectedStaffProfile(null);
    }
  };

  // Password change handler - only for own profile
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: t('error'),
        description: t('pleaseEnterNewPassword') || 'Please enter your new password',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t('error'),
        description: t('passwordsDoNotMatch') || 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t('error'),
        description: t('passwordTooShort') || 'Password must be at least 6 characters',
        variant: 'destructive'
      });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: t('success'),
        description: t('passwordChanged') || 'Password changed successfully'
      });
      
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('passwordChangeError') || 'Failed to change password',
        variant: 'destructive'
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {isManager ? 'Select a staff member to view their profile' : 'Profile not found'}
      </div>
    );
  }

  const RoleIcon = getRoleIcon(userRole);

  return (
      <div className="space-y-6">
      {isProfileIncomplete && (
        <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <User className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Complete Your Profile Setup
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                {t('completeProfileDescription') || 'Please complete your profile setup by filling in ALL required information including ID, Passport, and Visa documents. Once completed, any future changes will require manager approval for security and compliance.'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isManager ? t('staffProfile') : t('profile')}
          </h1>
          <p className="text-muted-foreground">
            {isManager 
              ? t('manageStaffProfiles') || 'Manage staff profiles and approve changes' 
              : isProfileIncomplete 
                ? t('completeInitialSetup') || 'Complete your initial profile setup - all fields are required'
                : t('viewProfileInfo') || 'View your personal information and submit change requests for approval'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getRoleColor(userRole)} className="flex items-center gap-1">
            <RoleIcon className="h-3 w-3" />
            {userRole || 'employee'}
          </Badge>
        </div>
      </div>

      {/* Staff Selection for Managers */}
      {isManager && (
        <Card>
          <CardHeader>
            <CardTitle>Select Staff Member</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedStaffId} onValueChange={handleStaffSelection}>
              <SelectTrigger>
                <SelectValue placeholder="Select a staff member to view their profile" />
              </SelectTrigger>
              <SelectContent>
                {allProfiles.map((staffProfile) => (
                  <SelectItem key={staffProfile.user_id} value={staffProfile.user_id}>
                    {staffProfile.first_name} {staffProfile.last_name} ({staffProfile.employee_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('personalDetails')}</CardTitle>
            <div className="flex gap-2">
              {/* Initial Setup for Incomplete Profiles */}
              {canUserEditDirectly ? (
                <>
                  {!setupMode ? (
                    <Button 
                      variant="default" 
                      className="flex items-center gap-2"
                      onClick={() => {
                        setSetupMode(true);
                        setSetupValues({});
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      Complete Profile Setup
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleCompleteSetup} 
                        disabled={saving}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? (t('saving') || 'Saving...') : (t('completeSetup') || 'Complete Setup')}
                      </Button>
                      <Button variant="outline" onClick={handleSetupCancel}>
                        {t('cancel') || 'Cancel'}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* HR Admin Direct Edit for Any Profile */}
                  {canHrAdminEdit && (
                    <>
                      {!hrEditMode ? (
                        <Button 
                          variant="secondary" 
                          className="flex items-center gap-2"
                          onClick={() => {
                            setHrEditMode(true);
                            setHrEditValues({});
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          Edit Profile
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleHrDirectSave} 
                            disabled={saving}
                            className="flex items-center gap-2"
                          >
                            <Save className="h-4 w-4" />
                            {saving ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button variant="outline" onClick={handleHrEditCancel}>
                            Cancel
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Regular User Change Request */}
                  {!isManager && !canUserEditDirectly && (
                    <Dialog open={showChangeDialog} onOpenChange={setShowChangeDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          {t('requestChange')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                      <DialogTitle>{t('requestProfileChange')}</DialogTitle>
                          <DialogDescription>
                            {t('submitRequestDescription')}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Field to Change</Label>
                            <Select value={selectedField} onValueChange={setSelectedField}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                {allProfileFields.map((field) => (
                                  <SelectItem key={field} value={field}>
                                    {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>New Value</Label>
                            {selectedField === 'department' ? (
                              <Select value={newValue} onValueChange={setNewValue}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                  {departments.map((dept) => (
                                    <SelectItem key={dept} value={dept}>
                                      {dept}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : selectedField === 'marital_status' ? (
                              <Select value={newValue} onValueChange={setNewValue}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select marital status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="single">Single</SelectItem>
                                  <SelectItem value="married">Married</SelectItem>
                                  <SelectItem value="divorced">Divorced</SelectItem>
                                  <SelectItem value="widowed">Widowed</SelectItem>
                                </SelectContent>
                              </Select>
                              ) : (
                                <Input
                                  value={newValue}
                                  onChange={(e) => setNewValue(e.target.value)}
                                  placeholder={
                                    selectedField === 'date_of_birth' 
                                      ? 'YYYY-MM-DD (e.g., 1990-01-15)' 
                                      : t('enterNewValue')
                                  }
                                />
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleRequestChange}>{t('submitRequest')}</Button>
                              <Button variant="outline" onClick={() => setShowChangeDialog(false)}>
                                {t('cancel')}
                              </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Upload Section */}
            <div className="flex justify-center pb-4 border-b border-border">
              <AvatarUpload 
                userId={viewingUserId || ''} 
                userName={`${currentProfile.first_name || ''} ${currentProfile.last_name || ''}`.trim()}
                canEdit={!isImpersonating && (viewingUserId === user?.id || canHrAdminEdit)}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Core Profile Fields - Setup/Display/HR Edit Mode */}
              <div className="space-y-2">
                <Label>{t('firstName')}</Label>
                {(canUserEditDirectly && setupMode) || (canHrAdminEdit && hrEditMode) ? (
                  <Input
                    value={
                      canUserEditDirectly && setupMode 
                        ? (setupValues.first_name ?? currentProfile.first_name ?? '')
                        : (hrEditValues.first_name ?? currentProfile.first_name ?? '')
                    }
                    onChange={(e) => 
                      canUserEditDirectly && setupMode
                        ? updateSetupValue('first_name', e.target.value)
                        : updateHrEditValue('first_name', e.target.value)
                    }
                    placeholder="Enter first name"
                    className="flex items-center gap-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{currentProfile.first_name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('lastName')}</Label>
                {(canUserEditDirectly && setupMode) || (canHrAdminEdit && hrEditMode) ? (
                  <Input
                    value={
                      canUserEditDirectly && setupMode 
                        ? (setupValues.last_name ?? currentProfile.last_name ?? '')
                        : (hrEditValues.last_name ?? currentProfile.last_name ?? '')
                    }
                    onChange={(e) => 
                      canUserEditDirectly && setupMode
                        ? updateSetupValue('last_name', e.target.value)
                        : updateHrEditValue('last_name', e.target.value)
                    }
                    placeholder={t('enterLastName')}
                    className="flex items-center gap-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{currentProfile.last_name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('email')}</Label>
                {(canUserEditDirectly && setupMode) || (canHrAdminEdit && hrEditMode) ? (
                  <Input
                    value={
                      canUserEditDirectly && setupMode 
                        ? (setupValues.email ?? currentProfile.email ?? '')
                        : (hrEditValues.email ?? currentProfile.email ?? '')
                    }
                    onChange={(e) => 
                      canUserEditDirectly && setupMode
                        ? updateSetupValue('email', e.target.value)
                        : updateHrEditValue('email', e.target.value)
                    }
                    placeholder={t('enterEmailAddress')}
                    type="email"
                    className="flex items-center gap-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{currentProfile.email}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('accountEmailLogin')}</Label>
                <div className="flex items-center gap-2 p-2 border border-border rounded">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user?.email || '—'}</span>
                </div>
              </div>

              {/* Employee ID - Only Admin/HR can edit, read-only for employees */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  {t('employeeId')}
                  {!canHrAdminEdit && (
                    <span title={t('adminOnlyField') || 'Admin/HR only'}>
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    </span>
                  )}
                </Label>
                {canHrAdminEdit && hrEditMode ? (
                  <Input
                    value={hrEditValues.employee_id ?? currentProfile.employee_id ?? ''}
                    onChange={(e) => updateHrEditValue('employee_id', e.target.value)}
                    placeholder={t('enterEmployeeId')}
                    className="flex items-center gap-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-border rounded bg-muted/30">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{currentProfile.employee_id || t('notAssigned') || 'Not Assigned'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('department')}</Label>
                {(canUserEditDirectly && setupMode) || (canHrAdminEdit && hrEditMode) ? (
                  <Select 
                    value={
                      canUserEditDirectly && setupMode 
                        ? (setupValues.department ?? currentProfile.department ?? '')
                        : (hrEditValues.department ?? currentProfile.department ?? '')
                    } 
                    onValueChange={(value) => 
                      canUserEditDirectly && setupMode
                        ? updateSetupValue('department', value)
                        : updateHrEditValue('department', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectDepartmentPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{currentProfile.department}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('position')}</Label>
                {(canUserEditDirectly && setupMode) || (canHrAdminEdit && hrEditMode) ? (
                  <Input
                    value={
                      canUserEditDirectly && setupMode 
                        ? (setupValues.position ?? currentProfile.position ?? '')
                        : (hrEditValues.position ?? currentProfile.position ?? '')
                    }
                    onChange={(e) => 
                      canUserEditDirectly && setupMode
                        ? updateSetupValue('position', e.target.value)
                        : updateHrEditValue('position', e.target.value)
                    }
                    placeholder={t('enterPosition')}
                    className="flex items-center gap-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{currentProfile.position}</span>
                  </div>
                )}
              </div>

              {/* Extended Profile Fields - Setup/Display/HR Edit Mode */}
              <div className="space-y-2">
                <Label>{t('phoneNumber')}</Label>
                {(canUserEditDirectly && setupMode) || (canHrAdminEdit && hrEditMode) ? (
                  <Input
                    value={
                      canUserEditDirectly && setupMode 
                        ? (setupValues.phone_number ?? currentProfile.phone_number ?? '')
                        : (hrEditValues.phone_number ?? currentProfile.phone_number ?? '')
                    }
                    onChange={(e) => 
                      canUserEditDirectly && setupMode
                        ? updateSetupValue('phone_number', e.target.value)
                        : updateHrEditValue('phone_number', e.target.value)
                    }
                    placeholder={t('enterPhoneNumber')}
                    className="flex items-center gap-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className={!currentProfile.phone_number ? "text-muted-foreground italic" : ""}>
                      {currentProfile.phone_number || t('notProvided')}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('dateOfBirth')}</Label>
                {(canUserEditDirectly && setupMode) || (canHrAdminEdit && hrEditMode) ? (
                  <div className="space-y-1">
                    <Input
                      type="date"
                      value={
                        canUserEditDirectly && setupMode 
                          ? (setupValues.date_of_birth ?? currentProfile.date_of_birth ?? '')
                          : (hrEditValues.date_of_birth ?? currentProfile.date_of_birth ?? '')
                      }
                      onChange={(e) => 
                        canUserEditDirectly && setupMode
                          ? updateSetupValue('date_of_birth', e.target.value)
                          : updateHrEditValue('date_of_birth', e.target.value)
                      }
                      className="flex items-center gap-2"
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {t('dateFormatHint') || 'Format: YYYY-MM-DD (e.g., 1990-01-15)'}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className={!currentProfile.date_of_birth ? "text-muted-foreground italic" : ""}>
                      {currentProfile.date_of_birth ? new Date(currentProfile.date_of_birth).toLocaleDateString() : t('notProvided')}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  {t('idNumber')}
                  <span title={t('documentRequired') || 'Document upload required'}>
                    <Upload className="h-3 w-3 text-muted-foreground" />
                  </span>
                </Label>
                {(canUserEditDirectly && setupMode) || (canHrAdminEdit && hrEditMode) ? (
                  <Input
                    value={
                      canUserEditDirectly && setupMode 
                        ? (setupValues.id_number ?? currentProfile.id_number ?? '')
                        : (hrEditValues.id_number ?? currentProfile.id_number ?? '')
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      if (canUserEditDirectly && setupMode) {
                        updateSetupValue('id_number', value);
                      } else {
                        updateHrEditValue('id_number', value);
                      }
                      // Prompt for document upload when value is entered
                      if (value.trim() && value.trim().toUpperCase() !== 'NIL') {
                        setPendingDocumentType('id_card');
                        setShowDocumentUploadDialog(true);
                      }
                    }}
                    placeholder={t('enterIdNumber')}
                    className="flex items-center gap-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className={!currentProfile.id_number ? "text-muted-foreground italic" : ""}>
                      {currentProfile.id_number || t('notProvided')}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  {t('passportNumber')}
                  <span title={t('documentRequired') || 'Document upload required'}>
                    <Upload className="h-3 w-3 text-muted-foreground" />
                  </span>
                </Label>
                {(canUserEditDirectly && setupMode) || (canHrAdminEdit && hrEditMode) ? (
                  <Input
                    value={
                      canUserEditDirectly && setupMode 
                        ? (setupValues.passport_number ?? currentProfile.passport_number ?? '')
                        : (hrEditValues.passport_number ?? currentProfile.passport_number ?? '')
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      if (canUserEditDirectly && setupMode) {
                        updateSetupValue('passport_number', value);
                      } else {
                        updateHrEditValue('passport_number', value);
                      }
                      // Prompt for document upload when value is entered
                      if (value.trim() && value.trim().toUpperCase() !== 'NIL') {
                        setPendingDocumentType('passport');
                        setShowDocumentUploadDialog(true);
                      }
                    }}
                    placeholder={t('enterPassportNumber')}
                    className="flex items-center gap-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className={!currentProfile.passport_number ? "text-muted-foreground italic" : ""}>
                      {currentProfile.passport_number || t('notProvided')}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  {t('visaNumber')}
                  <span title={t('documentRequired') || 'Document upload required'}>
                    <Upload className="h-3 w-3 text-muted-foreground" />
                  </span>
                </Label>
                {(canUserEditDirectly && setupMode) || (canHrAdminEdit && hrEditMode) ? (
                  <Input
                    value={
                      canUserEditDirectly && setupMode 
                        ? (setupValues.visa_number ?? currentProfile.visa_number ?? '')
                        : (hrEditValues.visa_number ?? currentProfile.visa_number ?? '')
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      if (canUserEditDirectly && setupMode) {
                        updateSetupValue('visa_number', value);
                      } else {
                        updateHrEditValue('visa_number', value);
                      }
                      // Prompt for document upload when value is entered
                      if (value.trim() && value.trim().toUpperCase() !== 'NIL') {
                        setPendingDocumentType('visa');
                        setShowDocumentUploadDialog(true);
                      }
                    }}
                    placeholder={t('enterVisaNumber')}
                    className="flex items-center gap-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className={!currentProfile.visa_number ? "text-muted-foreground italic" : ""}>
                      {currentProfile.visa_number || t('notProvided')}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('maritalStatus')}</Label>
                {(canUserEditDirectly && setupMode) || (canHrAdminEdit && hrEditMode) ? (
                  <Select 
                    value={
                      canUserEditDirectly && setupMode 
                        ? (setupValues.marital_status ?? currentProfile.marital_status ?? '')
                        : (hrEditValues.marital_status ?? currentProfile.marital_status ?? '')
                    } 
                    onValueChange={(value) => 
                      canUserEditDirectly && setupMode
                        ? updateSetupValue('marital_status', value)
                        : updateHrEditValue('marital_status', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectMaritalStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">{t('single') || 'Single'}</SelectItem>
                      <SelectItem value="married">{t('married') || 'Married'}</SelectItem>
                      <SelectItem value="divorced">{t('divorced') || 'Divorced'}</SelectItem>
                      <SelectItem value="widowed">{t('widowed') || 'Widowed'}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span className={!currentProfile.marital_status ? "text-muted-foreground italic" : ""}>
                      {currentProfile.marital_status || t('notProvided')}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('emergencyContactName')}</Label>
                {(canUserEditDirectly && setupMode) || (canHrAdminEdit && hrEditMode) ? (
                  <Input
                    value={
                      canUserEditDirectly && setupMode 
                        ? (setupValues.emergency_contact_name ?? currentProfile.emergency_contact_name ?? '')
                        : (hrEditValues.emergency_contact_name ?? currentProfile.emergency_contact_name ?? '')
                    }
                    onChange={(e) => 
                      canUserEditDirectly && setupMode
                        ? updateSetupValue('emergency_contact_name', e.target.value)
                        : updateHrEditValue('emergency_contact_name', e.target.value)
                    }
                    placeholder={t('enterEmergencyContactName')}
                    className="flex items-center gap-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className={!currentProfile.emergency_contact_name ? "text-muted-foreground italic" : ""}>
                      {currentProfile.emergency_contact_name || t('notProvided')}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('emergencyContactPhone')}</Label>
                {(canUserEditDirectly && setupMode) || (canHrAdminEdit && hrEditMode) ? (
                  <Input
                    value={
                      canUserEditDirectly && setupMode 
                        ? (setupValues.emergency_contact_phone ?? currentProfile.emergency_contact_phone ?? '')
                        : (hrEditValues.emergency_contact_phone ?? currentProfile.emergency_contact_phone ?? '')
                    }
                    onChange={(e) => 
                      canUserEditDirectly && setupMode
                        ? updateSetupValue('emergency_contact_phone', e.target.value)
                        : updateHrEditValue('emergency_contact_phone', e.target.value)
                    }
                    placeholder={t('enterEmergencyContactPhone')}
                    className="flex items-center gap-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className={!currentProfile.emergency_contact_phone ? "text-muted-foreground italic" : ""}>
                      {currentProfile.emergency_contact_phone || t('notProvided')}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>{t('homeAddress')}</Label>
                {(canUserEditDirectly && setupMode) || (canHrAdminEdit && hrEditMode) ? (
                  <Textarea
                    value={
                      canUserEditDirectly && setupMode 
                        ? (setupValues.home_address ?? currentProfile.home_address ?? '')
                        : (hrEditValues.home_address ?? currentProfile.home_address ?? '')
                    }
                    onChange={(e) => 
                      canUserEditDirectly && setupMode
                        ? updateSetupValue('home_address', e.target.value)
                        : updateHrEditValue('home_address', e.target.value)
                    }
                    placeholder={t('enterHomeAddress')}
                    rows={3}
                    className="flex items-center gap-2"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className={!currentProfile.home_address ? "text-muted-foreground italic" : ""}>
                      {currentProfile.home_address || t('notProvided')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Document Manager */}
            <div data-document-manager>
              <DocumentManager 
                userId={currentProfile.user_id} 
                canManage={
                  userRole === 'hr_admin' || 
                  (!isManager || selectedStaffId === user?.id)
                } 
              />
            </div>

            {/* Document Upload Prompt Dialog for ID/Passport/Visa */}
            <Dialog open={showDocumentUploadDialog} onOpenChange={setShowDocumentUploadDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    {t('uploadDocumentPrompt') || 'Upload Supporting Document'}
                  </DialogTitle>
                  <DialogDescription>
                    {pendingDocumentType === 'id_card' && (t('uploadIdCardPrompt') || 'Please upload a copy of your ID card for verification.')}
                    {pendingDocumentType === 'passport' && (t('uploadPassportPrompt') || 'Please upload a copy of your passport for verification.')}
                    {pendingDocumentType === 'visa' && (t('uploadVisaPrompt') || 'Please upload a copy of your visa document for verification.')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <p className="text-sm text-muted-foreground">
                    {t('documentUploadNote') || 'You can upload the document now or later from the Documents section below.'}
                  </p>
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowDocumentUploadDialog(false);
                        setPendingDocumentType(null);
                      }}
                    >
                      {t('uploadLater') || 'Upload Later'}
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowDocumentUploadDialog(false);
                        // Scroll to document manager section
                        const docSection = document.querySelector('[data-document-manager]');
                        if (docSection) {
                          docSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                        toast({
                          title: t('scrolledToDocuments') || 'Document Section',
                          description: t('uploadDocumentNow') || 'Please upload your document in the Documents section.'
                        });
                        setPendingDocumentType(null);
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {t('uploadNow') || 'Upload Now'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Change Password - Integrated within Personal Details */}
            {!isManager && !isImpersonating && viewingUserId === user?.id && (
              <>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">{t('changePassword') || 'Change Password'}</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="newPassword" className="text-sm">{t('newPassword') || 'New Password'}</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-sm">{t('confirmPassword') || 'Confirm Password'}</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={changingPassword || !newPassword || !confirmPassword}
                    className="w-full md:w-auto"
                    size="sm"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {changingPassword ? (t('saving') || 'Saving...') : (t('changePassword') || 'Change Password')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Leave Balances */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{t('leaveBalances')} ({new Date().getFullYear()})</CardTitle>
              <Button variant="outline" size="sm" onClick={() => toast({ title: t('comingSoon'), description: t('reportFeatureComingSoon') })}>
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

      {/* Change Requests */}
      {changeRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {t('profileChanges')}
              {(isManager || isAdministrator) && viewingUserId && viewingUserId !== user?.id && currentProfile && (
                <Badge variant="outline" className="ml-2">
                  {currentProfile.first_name} {currentProfile.last_name}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {changeRequests.map((request) => {
                // Find employee name for this request
                const employeeProfile = allProfiles.find(p => p.user_id === request.user_id);
                const employeeName = employeeProfile 
                  ? `${employeeProfile.first_name || ''} ${employeeProfile.last_name || ''}`.trim()
                  : '';
                
                return (
                  <div key={request.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium text-sm flex items-center gap-2">
                        {request.field_name.replace(/_/g, ' ').toUpperCase()}
                        {(isManager || isAdministrator) && employeeName && !viewingUserId && (
                          <Badge variant="secondary" className="text-xs">
                            {employeeName}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        From: "{request.current_value}" → To: "{request.new_value}"
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        request.status === 'approved' ? 'default' : 
                        request.status === 'rejected' ? 'destructive' : 'outline'
                      }>
                        {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {request.status === 'approved' && <Check className="h-3 w-3 mr-1" />}
                        {request.status === 'rejected' && <X className="h-3 w-3 mr-1" />}
                        {request.status}
                      </Badge>
                      {(isManager || isAdministrator) && request.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => approveChangeRequest(request.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const reason = prompt('Reason for rejection:');
                              if (reason) rejectChangeRequest(request.id, reason);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}