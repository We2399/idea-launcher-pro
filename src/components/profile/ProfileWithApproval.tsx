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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { User, Mail, Building, Briefcase, Calendar, Save, Crown, Shield, Edit, Clock, Check, X, Phone, MapPin, Heart, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import DocumentManager from './DocumentManager';

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
  const { t } = useLanguage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [changeRequests, setChangeRequests] = useState<ProfileChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChangeDialog, setShowChangeDialog] = useState(false);
  const [selectedField, setSelectedField] = useState('');
  const [newValue, setNewValue] = useState('');

  // For managers - staff profile selection
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedStaffProfile, setSelectedStaffProfile] = useState<Profile | null>(null);

  const isManager = userRole === 'manager' || userRole === 'hr_admin';
  const currentProfile = isManager && selectedStaffProfile ? selectedStaffProfile : profile;
  const viewingUserId = isManager && selectedStaffId ? selectedStaffId : user?.id;

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchChangeRequests();
      if (isManager) {
        fetchAllProfiles();
      }
    }
  }, [user, userRole]);

  useEffect(() => {
    if (viewingUserId) {
      fetchLeaveBalances();
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
      const { data, error } = await supabase
        .from('profile_change_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

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

  const handleRequestChange = async () => {
    if (!selectedField || !newValue.trim() || !currentProfile) return;

    try {
      const currentValue = currentProfile[selectedField as keyof Profile] || '';

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
        title: "Success",
        description: "Profile change request submitted for approval"
      });

      setShowChangeDialog(false);
      setSelectedField('');
      setNewValue('');
      fetchChangeRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to submit change request",
        variant: "destructive"
      });
    }
  };

  const approveChangeRequest = async (requestId: string) => {
    try {
      const request = changeRequests.find(r => r.id === requestId);
      if (!request) return;

      // Update the profile with the new value
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          [request.field_name]: request.new_value,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', request.user_id);

      if (updateError) throw updateError;

      // Mark the request as approved
      const { error: approveError } = await supabase
        .from('profile_change_requests')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (approveError) throw approveError;

      toast({
        title: "Success",
        description: "Change request approved successfully"
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isManager ? t('staffProfile') : t('profile')}
          </h1>
          <p className="text-muted-foreground">
            {isManager ? 'Manage staff profiles and approve changes' : 'Manage your personal information and view leave balances'}
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
            <Dialog open={showChangeDialog} onOpenChange={setShowChangeDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  {t('requestChange')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Profile Change</DialogTitle>
                  <DialogDescription>
                    Submit a request to change your profile information. Changes require approval.
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
                         <SelectItem value="first_name">{t('firstName') || 'First Name'}</SelectItem>
                         <SelectItem value="last_name">{t('lastName') || 'Last Name'}</SelectItem>
                         <SelectItem value="department">{t('department')}</SelectItem>
                         <SelectItem value="position">{t('position')}</SelectItem>
                         <SelectItem value="id_number">{t('idNumber')}</SelectItem>
                         <SelectItem value="passport_number">{t('passportNumber')}</SelectItem>
                         <SelectItem value="visa_number">{t('visaNumber')}</SelectItem>
                         <SelectItem value="date_of_birth">{t('dateOfBirth')}</SelectItem>
                         <SelectItem value="home_address">{t('homeAddress')}</SelectItem>
                         <SelectItem value="marital_status">{t('maritalStatus')}</SelectItem>
                         <SelectItem value="emergency_contact_name">{t('emergencyContactName')}</SelectItem>
                         <SelectItem value="emergency_contact_phone">{t('emergencyContactPhone')}</SelectItem>
                         <SelectItem value="phone_number">{t('phoneNumber')}</SelectItem>
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
                          <SelectItem value="single">{t('single')}</SelectItem>
                          <SelectItem value="married">{t('married')}</SelectItem>
                          <SelectItem value="divorced">{t('divorced')}</SelectItem>
                          <SelectItem value="widowed">{t('widowed')}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : selectedField === 'date_of_birth' ? (
                      <Input
                        type="date"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                      />
                    ) : selectedField === 'home_address' ? (
                      <Textarea
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder="Enter address"
                        rows={3}
                      />
                    ) : (
                      <Input
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder="Enter new value"
                      />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleRequestChange}>Submit Request</Button>
                    <Button variant="outline" onClick={() => setShowChangeDialog(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Core Profile Fields */}
              <div className="space-y-2">
                <Label>{t('firstName')}</Label>
                <div className="flex items-center gap-2 p-2 border border-border rounded">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{currentProfile.first_name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('lastName')}</Label>
                <div className="flex items-center gap-2 p-2 border border-border rounded">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{currentProfile.last_name}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('email')}</Label>
                <div className="flex items-center gap-2 p-2 border border-border rounded">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{currentProfile.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('employeeId')}</Label>
                <div className="flex items-center gap-2 p-2 border border-border rounded">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{currentProfile.employee_id}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('department')}</Label>
                <div className="flex items-center gap-2 p-2 border border-border rounded">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{currentProfile.department}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('position')}</Label>
                <div className="flex items-center gap-2 p-2 border border-border rounded">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{currentProfile.position}</span>
                </div>
              </div>

              {/* Extended Profile Fields */}
              {currentProfile.id_number && (
                <div className="space-y-2">
                  <Label>{t('idNumber')}</Label>
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{currentProfile.id_number}</span>
                  </div>
                </div>
              )}

              {currentProfile.passport_number && (
                <div className="space-y-2">
                  <Label>{t('passportNumber')}</Label>
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{currentProfile.passport_number}</span>
                  </div>
                </div>
              )}

              {currentProfile.visa_number && (
                <div className="space-y-2">
                  <Label>{t('visaNumber')}</Label>
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{currentProfile.visa_number}</span>
                  </div>
                </div>
              )}

              {currentProfile.phone_number && (
                <div className="space-y-2">
                  <Label>{t('phoneNumber')}</Label>
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{currentProfile.phone_number}</span>
                  </div>
                </div>
              )}

              {currentProfile.date_of_birth && (
                <div className="space-y-2">
                  <Label>{t('dateOfBirth')}</Label>
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(currentProfile.date_of_birth).toLocaleDateString()}</span>
                  </div>
                </div>
              )}

              {currentProfile.marital_status && (
                <div className="space-y-2">
                  <Label>{t('maritalStatus')}</Label>
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <Heart className="h-4 w-4 text-muted-foreground" />
                    <span>{currentProfile.marital_status}</span>
                  </div>
                </div>
              )}

              {currentProfile.emergency_contact_name && (
                <div className="space-y-2">
                  <Label>{t('emergencyContactName')}</Label>
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{currentProfile.emergency_contact_name}</span>
                  </div>
                </div>
              )}

              {currentProfile.emergency_contact_phone && (
                <div className="space-y-2">
                  <Label>{t('emergencyContactPhone')}</Label>
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{currentProfile.emergency_contact_phone}</span>
                  </div>
                </div>
              )}

              {currentProfile.home_address && (
                <div className="space-y-2 md:col-span-2">
                  <Label>{t('homeAddress')}</Label>
                  <div className="flex items-center gap-2 p-2 border border-border rounded">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{currentProfile.home_address}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* Document Manager */}
            <DocumentManager userId={currentProfile.user_id} canManage={!isManager || selectedStaffId === user?.id} />
          </CardContent>
        </Card>

        {/* Leave Balances */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{t('leaveBalances')} ({new Date().getFullYear()})</CardTitle>
              <Button variant="outline" size="sm">
                Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaveBalances.length > 0 ? (
                leaveBalances.map((balance) => (
                  <div key={balance.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{balance.leave_types.name}</span>
                      <Badge variant="outline">
                        {balance.remaining_days} / {balance.total_days}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      Initial allocation: {balance.total_days} days/year
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
                      <span>Used: {balance.used_days} days</span>
                      <span>Available: {balance.remaining_days} days</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No leave balances configured for this year
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
            <CardTitle>{t('profileChanges')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {changeRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium text-sm">
                      {request.field_name.replace('_', ' ').toUpperCase()}
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
                    {isManager && request.status === 'pending' && (
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}