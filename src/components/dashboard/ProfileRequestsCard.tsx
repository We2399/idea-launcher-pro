import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileEdit, Clock, CheckCircle, ChevronRight, User, Phone, MapPin, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

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

export function ProfileRequestsCard({ stats, loading }: ProfileRequestsCardProps) {
  const { userRole, user } = useAuth();
  const { t } = useLanguage();
  const [requests, setRequests] = useState<ProfileChangeRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  
  useEffect(() => {
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
    
    fetchRequests();
  }, [user?.id, userRole, stats.pending]);

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
  
  return (
    <Link to={linkPath}>
      <Card className="card-professional animate-slide-up hover:shadow-lg transition-all duration-300" style={{ animationDelay: '0.4s' }}>
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
                  {stats.pending > 0 && (
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs px-1.5 py-0">
                      <Clock className="h-2.5 w-2.5 mr-1" />
                      {stats.pending} {t('pending')}
                    </Badge>
                  )}
                  {stats.approved > 0 && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs px-1.5 py-0">
                      <CheckCircle className="h-2.5 w-2.5 mr-1" />
                      {stats.approved}
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
                  className="p-2.5 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
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
                        <Badge 
                          variant="outline" 
                          className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[10px] px-1.5 py-0 shrink-0"
                        >
                          {t('pending')}
                        </Badge>
                      </div>
                      {userRole !== 'employee' && request.requester_name && (
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
      </Card>
    </Link>
  );
}
