import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { DocumentStorage } from '@/hooks/useStorageCentre';
import { Eye, Download, History, CheckCircle, XCircle, Trash2, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { formatFileSize } from '@/lib/exportStorageCentre';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DocumentCardProps {
  document: DocumentStorage;
  onView: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onDelete?: () => void;
  onViewVersions?: () => void;
  onViewDetails?: () => void;
  canApprove: boolean;
  canDelete: boolean;
}

export function DocumentCard({
  document,
  onView,
  onApprove,
  onReject,
  onDelete,
  onViewVersions,
  onViewDetails,
  canApprove,
  canDelete
}: DocumentCardProps) {
  const getSignedUrl = async (filePath: string) => {
    try {
      // Extract the path from the full URL if needed
      const urlPath = filePath.includes('profile-documents/') 
        ? filePath.split('profile-documents/')[1] 
        : filePath;
      
      const { data, error } = await supabase.storage
        .from('profile-documents')
        .createSignedUrl(urlPath, 3600); // 1 hour expiry
      
      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      toast({
        title: 'Error',
        description: 'Failed to access document',
        variant: 'destructive'
      });
      return null;
    }
  };

  const handleView = async () => {
    const signedUrl = await getSignedUrl(document.file_path);
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    }
  };

  const downloadDocument = async () => {
    const signedUrl = await getSignedUrl(document.file_path);
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">{document.document_name}</h4>
            <p className="text-xs text-muted-foreground">
              Type: {document.document_type} • Source: {document.source}
            </p>
          </div>
          <DocumentStatusBadge status={document.replacement_status} />
        </div>

        <div className="space-y-2 text-xs text-muted-foreground mb-3">
          <div className="flex items-center justify-between">
            <span>Version:</span>
            <Badge variant="outline">v{document.version}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Size:</span>
            <span>{formatFileSize(document.file_size)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Uploaded:</span>
            <span>{format(new Date(document.created_at), 'MMM d, yyyy')}</span>
          </div>
          {document.uploaded_by_user && (
            <div className="flex items-center justify-between">
              <span>By:</span>
              <span>
                {document.uploaded_by_user.first_name} {document.uploaded_by_user.last_name}
              </span>
            </div>
          )}
        </div>

        {document.replacement_reason && (
          <div className="mb-3 p-2 bg-muted rounded text-xs">
            <p className="font-medium mb-1">Replacement Reason:</p>
            <p className="text-muted-foreground">{document.replacement_reason}</p>
          </div>
        )}

        {document.rejection_reason && (
          <div className="mb-3 p-2 bg-destructive/10 rounded text-xs">
            <p className="font-medium mb-1 text-destructive">Rejection Reason:</p>
            <p className="text-destructive">{document.rejection_reason}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleView}>
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button variant="outline" size="sm" onClick={downloadDocument}>
            <Download className="h-3 w-3 mr-1" />
            Download
          </Button>
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              <MessageSquare className="h-3 w-3 mr-1" />
              Discussion
            </Button>
          )}
          {onViewVersions && (
            <Button variant="outline" size="sm" onClick={onViewVersions}>
              <History className="h-3 w-3 mr-1" />
              Versions
            </Button>
          )}
          {canApprove && document.replacement_status === 'pending_approval' && (
            <>
              <Button variant="default" size="sm" onClick={onApprove} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Approve
              </Button>
              <Button variant="destructive" size="sm" onClick={onReject}>
                <XCircle className="h-3 w-3 mr-1" />
                Reject
              </Button>
            </>
          )}
          {canDelete && (
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
