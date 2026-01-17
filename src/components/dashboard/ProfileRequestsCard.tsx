import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileEdit, Clock, CheckCircle, ChevronRight, User, Phone, MapPin, Calendar, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ProfileChangeRequestStats {
  pending: number;
  approved: number;
  total: number;
}

interface ProfileChangeRequest {
  id: string;
  field_name: string;
  current_value: string | null;
  new_value: string;
  status: string;
  created_at: string;
  user_id: string;
  requester_name?: string;
}

interface ProfileRequestsCardProps {
  stats: ProfileChangeRequestStats;
  loading: boolean;
  onRefresh?: () => void;
}

const fieldIcons: Record<string, React.ReactNode> = {
  phone_number: <Phone className="h-3.5 w-3.5" />,
  home_address: <MapPin className="h-3.5 w-3.5" />,
  date_of_birth: <Calendar className="h-3.5 w-3.5" />,
  default: <User className="h-3.5 w-3.5" />
};

const formatFieldName = (fieldName: string): string => {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function ProfileRequestsCard({ stats, loading, onRefresh }: ProfileRequestsCardProps) {
  const { userRole, user } = useAuth();
  const { t } = useLanguage();
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState<ProfileChangeRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const isAdmin = userRole === 'hr_admin' || userRole === 'administrator';
  
  const fetchRequests = async () => {
    if (!user?.id) return;
    
    try {
      let query = supabase
        .from('profile_change_requests')
        .select('id, field_name, current_value, new_value, status, created_at, user_id')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3);
      
      // Employees only see their own requests
      if (userRole === 'employee') {
        query = query.eq('user_id', user.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // For admins, fetch requester names
        if (userRole !== 'employee') {
          const userIds = [...new Set(data.map(r => r.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name')
            .in('user_id', userIds);
          
          const profileMap = new Map(
            profiles?.map(p => [p.user_id, `${p.first_name} ${p.last_name}`]) || []
          );
          
          setRequests(data.map(r => ({
            ...r,
            requester_name: profileMap.get(r.user_id) || 'Unknown'
          })));
        } else {
          setRequests(data);
        }
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('Error fetching profile change requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };
  
  useEffect(() => {
    fetchRequests();
  }, [user?.id, userRole, stats.pending]);

  // Fields that need date type conversion
  const dateFields = ['date_of_birth'];
  
  // Helper to parse various date formats
  const parseDateValue = (value: string): string | null => {
    const trimmed = value.trim();
    
    // If already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    
    // Try space-separated: "30 01 1991" or "01 30 1991"
    const spaceParts = trimmed.split(/\s+/);
    if (spaceParts.length === 3) {
      const [p1, p2, p3] = spaceParts.map(p => parseInt(p));
      // DD MM YYYY (most common)
      if (p1 >= 1 && p1 <= 31 && p2 >= 1 && p2 <= 12 && p3 >= 1900 && p3 <= 2100) {
        const date = new Date(p3, p2 - 1, p1);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    }
    
    // Try parsing "Jan 20, 1991" format
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const match = trimmed.toLowerCase().match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})$/);
    if (match) {
      const monthIndex = monthNames.findIndex(m => match[1].startsWith(m));
      if (monthIndex !== -1) {
        const date = new Date(parseInt(match[3]), monthIndex, parseInt(match[2]));
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    }
    
    // Try DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const delimParts = trimmed.split(/[\/\-\.]/);
    if (delimParts.length === 3) {
      const [p1, p2, p3] = delimParts.map(p => parseInt(p));
      // DD/MM/YYYY (international)
      if (p1 >= 1 && p1 <= 31 && p2 >= 1 && p2 <= 12 && p3 >= 1900 && p3 <= 2100) {
        const date = new Date(p3, p2 - 1, p1);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
      // MM/DD/YYYY (US)
      if (p1 >= 1 && p1 <= 12 && p2 >= 1 && p2 <= 31 && p3 >= 1900 && p3 <= 2100) {
        const date = new Date(p3, p1 - 1, p2);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      }
    }
    
    // Try native Date parsing as last resort
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return null;
  };
  
  const handleApprove = async (e: React.MouseEvent, request: ProfileChangeRequest) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user?.id) return;
    
    setProcessingId(request.id);
    
    try {
      // Prepare the value - convert to proper type if needed
      let updateValue: string | null = request.new_value;
      
      // For date fields, ensure the value is in proper date format
      if (dateFields.includes(request.field_name)) {
        updateValue = parseDateValue(request.new_value);
        if (!updateValue) {
          throw new Error(`Invalid date format: ${request.new_value}. Expected format: YYYY-MM-DD`);
        }
      }
      
      // Update the profile field
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ [request.field_name]: updateValue })
        .eq('user_id', request.user_id);
      
      if (profileError) throw profileError;
      
      // Update the request status
      const { error: requestError } = await supabase
        .from('profile_change_requests')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', request.id);
      
      if (requestError) throw requestError;
      
      toast.success(t('requestApproved') || 'Request approved');
      setRequests(prev => prev.filter(r => r.id !== request.id));
      onRefresh?.();
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast.error(error?.message || t('errorApprovingRequest') || 'Failed to approve change request');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (e: React.MouseEvent, request: ProfileChangeRequest) => {
    e.preventDefault();
    e.stopPropagation();
    setRejectingRequest(request);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!user?.id || !rejectingRequest) return;
    
    setProcessingId(rejectingRequest.id);
    
    try {
      const { error } = await supabase
        .from('profile_change_requests')
        .update({
          status: 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectReason || null
        })
        .eq('id', rejectingRequest.id);
      
      if (error) throw error;
      
      toast.success(t('requestRejected') || 'Request rejected');
      setRequests(prev => prev.filter(r => r.id !== rejectingRequest.id));
      setRejectDialogOpen(false);
      setRejectingRequest(null);
      onRefresh?.();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(t('errorRejectingRequest') || 'Error rejecting request');
    } finally {
      setProcessingId(null);
    }
  };

  const getTitle = () => {
    if (userRole === 'employee') {
      return t('myProfileRequests');
    }
    return t('profileChangeRequests');
  };

  if (loading) {
    return (
      <Card className="card-professional animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-muted animate-pulse">
              <FileEdit className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-8 w-12 bg-muted animate-pulse rounded" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // For admins, link to profile page with hash to scroll to change requests section
  const linkPath = userRole === 'employee' ? '/profile' : '/profile#change-requests';
  
  const cardContent = (
    <CardContent className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-600/10 ring-1 ring-violet-500/20">
            <FileEdit className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">
              {getTitle()}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {stats.pending > 0 ? (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs px-1.5 py-0">
                  <Clock className="h-2.5 w-2.5 mr-1" />
                  {stats.pending} {t('pending')}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs px-1.5 py-0">
                  <CheckCircle className="h-2.5 w-2.5 mr-1" />
                  {t('allProcessed') || 'All processed'}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
      
      {/* Request Details */}
      {loadingRequests ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-muted/50 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : requests.length > 0 ? (
        <div className="space-y-2">
          {requests.map((request) => (
            <div 
              key={request.id}
              className="p-2.5 rounded-lg bg-muted/30 border border-border/50"
            >
              <div className="flex items-start gap-2">
                <div className="p-1.5 rounded-md bg-violet-500/10 text-violet-600 mt-0.5">
                  {fieldIcons[request.field_name] || fieldIcons.default}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-foreground truncate">
                      {formatFieldName(request.field_name)}
                    </span>
                    {!isAdmin && (
                      <Badge 
                        variant="outline" 
                        className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[10px] px-1.5 py-0 shrink-0"
                      >
                        {t('pending')}
                      </Badge>
                    )}
                  </div>
                  {isAdmin && request.requester_name && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {request.requester_name}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-muted-foreground line-through truncate max-w-[80px]">
                      {request.current_value || '-'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">→</span>
                    <span className="text-[10px] text-violet-600 font-medium truncate max-w-[80px]">
                      {request.new_value}
                    </span>
                  </div>
                  
                  {/* Admin Action Buttons */}
                  {isAdmin && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10px] bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20"
                        onClick={(e) => handleApprove(e, request)}
                        disabled={processingId === request.id}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {t('approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10px] bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20"
                        onClick={(e) => openRejectDialog(e, request)}
                        disabled={processingId === request.id}
                      >
                        <X className="h-3 w-3 mr-1" />
                        {t('reject')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {stats.pending > 3 && (
            <div className="text-center pt-1">
              <span className="text-xs text-muted-foreground">
                +{stats.pending - 3} {t('more')}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-muted-foreground">
          {t('noRequests')}
        </div>
      )}
    </CardContent>
  );
  
  return (
    <>
      <Link to={linkPath}>
        <Card className="card-professional animate-slide-up hover:shadow-lg transition-all duration-300" style={{ animationDelay: '0.4s' }}>
          {cardContent}
        </Card>
      </Link>
      
      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{t('rejectRequest') || 'Reject Request'}</DialogTitle>
            <DialogDescription>
              {t('rejectReasonDescription') || 'Please provide a reason for rejecting this request (optional).'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={t('enterReason') || 'Enter reason...'}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={processingId !== null}
            >
              {t('reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
