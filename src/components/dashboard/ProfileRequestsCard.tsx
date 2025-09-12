import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileEdit, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileChangeRequestStats {
  pending: number;
  approved: number;
  total: number;
}

interface ProfileRequestsCardProps {
  stats: ProfileChangeRequestStats;
  loading: boolean;
}

export function ProfileRequestsCard({ stats, loading }: ProfileRequestsCardProps) {
  const { userRole } = useAuth();
  
  const getTitle = () => {
    if (userRole === 'employee') {
      return 'My Profile Requests';
    }
    return 'Profile Change Requests';
  };

  const getDescription = () => {
    if (userRole === 'employee') {
      return 'Your profile change requests';
    }
    return 'Team profile change requests';
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

  return (
    <Link to="/profile">
      <Card className="card-professional animate-slide-up hover:scale-105 transition-all duration-300" style={{ animationDelay: '0.4s' }}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-violet-600/10 ring-1 ring-violet-500/20">
              <FileEdit className="h-6 w-6 text-violet-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-2xl font-bold text-foreground">
                  {stats.total}
                </div>
                {stats.pending > 0 && (
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                    <Clock className="h-3 w-3 mr-1" />
                    {stats.pending} pending
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {getTitle()}
              </div>
              <div className="flex items-center gap-3 mt-2">
                {stats.pending > 0 && (
                  <div className="flex items-center gap-1 text-xs text-orange-600">
                    <Clock className="h-3 w-3" />
                    <span>{stats.pending} pending</span>
                  </div>
                )}
                {stats.approved > 0 && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>{stats.approved} approved</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}