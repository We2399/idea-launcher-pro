import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface DocumentFilters {
  userId?: string;
  documentType?: string;
  source?: 'profile' | 'cash_control' | 'other';
  status?: 'pending_approval' | 'active' | 'rejected' | 'replaced';
  dateFrom?: string;
  dateTo?: string;
  employeeName?: string;
}

export interface DocumentStorage {
  id: string;
  user_id: string;
  document_type: string;
  document_name: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  source: 'profile' | 'cash_control' | 'other';
  cash_transaction_id: string | null;
  version: number;
  replaces_document_id: string | null;
  replacement_reason: string | null;
  is_latest_version: boolean;
  replacement_status: 'pending_approval' | 'active' | 'rejected' | 'replaced';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
  user?: {
    first_name: string;
    last_name: string;
    employee_id: string;
  };
  uploaded_by_user?: {
    first_name: string;
    last_name: string;
  };
  approver?: {
    first_name: string;
    last_name: string;
  };
}

export interface DocumentComment {
  id: string;
  document_id: string;
  user_id: string;
  comment: string;
  comment_type: 'employee_reply' | 'admin_note' | 'system';
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
    employee_id: string;
  };
}

// Fetch all documents with filters
export const useStorageCentreDocuments = (filters?: DocumentFilters) => {
  return useQuery({
    queryKey: ['storage-centre', filters],
    queryFn: async () => {
      let query = supabase
        .from('document_storage')
        .select('*')
        .is('deleted_at', null);
      
      if (filters?.userId) query = query.eq('user_id', filters.userId);
      if (filters?.documentType) query = query.eq('document_type', filters.documentType);
      if (filters?.source) query = query.eq('source', filters.source);
      if (filters?.status) query = query.eq('replacement_status', filters.status);
      if (filters?.dateFrom) query = query.gte('created_at', filters.dateFrom);
      if (filters?.dateTo) query = query.lte('created_at', filters.dateTo);
      
      const { data: documents, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      if (!documents) return [];

      // Fetch related profile data separately
      const userIds = [...new Set(documents.map(d => d.user_id))];
      const uploaderIds = [...new Set(documents.map(d => d.uploaded_by))];
      const approverIds = [...new Set(documents.map(d => d.approved_by).filter(Boolean))] as string[];

      const allUserIds = [...new Set([...userIds, ...uploaderIds, ...approverIds])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, employee_id')
        .in('user_id', allUserIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Enrich documents with profile data
      const enrichedDocs = documents.map(doc => ({
        ...doc,
        user: profileMap.get(doc.user_id),
        uploaded_by_user: profileMap.get(doc.uploaded_by),
        approver: doc.approved_by ? profileMap.get(doc.approved_by) : null
      }));

      // Filter by employee name if provided
      if (filters?.employeeName) {
        const searchTerm = filters.employeeName.toLowerCase();
        return enrichedDocs.filter((doc: any) => {
          const fullName = `${doc.user?.first_name || ''} ${doc.user?.last_name || ''}`.toLowerCase();
          return fullName.includes(searchTerm);
        });
      }
      
      return enrichedDocs as any;
    }
  });
};

// Get document version history
export const useDocumentVersions = (documentId: string) => {
  return useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_document_versions', {
        original_doc_id: documentId
      });
      if (error) throw error;
      return data;
    },
    enabled: !!documentId
  });
};

// Get document comments/discussion
export const useDocumentComments = (documentId: string) => {
  return useQuery({
    queryKey: ['document-comments', documentId],
    queryFn: async () => {
      const { data: comments, error } = await supabase
        .from('document_comments')
        .select('id, document_id, user_id, comment, comment_type, created_at')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      if (!comments || comments.length === 0) return [];

      // Fetch profiles for all commenters
      const userIds = [...new Set(comments.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, employee_id')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Enrich comments with user data
      return comments.map(comment => ({
        ...comment,
        user: profileMap.get(comment.user_id)
      }));
    },
    enabled: !!documentId,
    refetchInterval: 10000 // Refresh every 10 seconds for active discussions
  });
};

// Approve replacement (works for both HR Admin and Administrator)
export const useApproveReplacement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ docId, note }: { docId: string; note?: string }) => {
      const { error } = await supabase.rpc('approve_replacement', {
        doc_id: docId,
        approval_note: note
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-centre'] });
      queryClient.invalidateQueries({ queryKey: ['document-versions'] });
      toast({
        title: 'Success',
        description: 'Document approved successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Reject replacement (works for both HR Admin and Administrator)
export const useRejectReplacement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ docId, reason }: { docId: string; reason: string }) => {
      const { error } = await supabase.rpc('reject_replacement', {
        doc_id: docId,
        reason: reason
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-centre'] });
      queryClient.invalidateQueries({ queryKey: ['document-versions'] });
      toast({
        title: 'Document rejected',
        description: 'The employee will be notified'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Soft delete (Administrator only)
export const useSoftDeleteDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ docId, reason }: { docId: string; reason?: string }) => {
      const { error } = await supabase.rpc('soft_delete_document', {
        doc_id: docId,
        deletion_reason: reason
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-centre'] });
      toast({
        title: 'Document deleted',
        description: 'The document has been archived'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Restore a soft-deleted document (Administrator only)
export const useRestoreDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase
        .from('document_storage')
        .update({ 
          deleted_at: null, 
          deleted_by: null,
          is_latest_version: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-centre'] });
      toast({
        title: 'Document restored',
        description: 'The document has been successfully restored.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Restore failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Add comment/reply
export const useAddDocumentComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ docId, comment, type }: { 
      docId: string; 
      comment: string; 
      type: 'employee_reply' | 'admin_note' | 'system' 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('document_comments')
        .insert({
          document_id: docId,
          user_id: user.id,
          comment,
          comment_type: type
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-comments'] });
      queryClient.invalidateQueries({ queryKey: ['employee-pending-discussions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-discussions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-needs-reply-discussions'] });
      queryClient.invalidateQueries({ queryKey: ['my-document-issues'] });
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};

// Upload replacement document
export const useUploadReplacement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      file, 
      documentType, 
      replacesDocumentId, 
      replacementReason 
    }: { 
      file: File; 
      documentType: string; 
      replacesDocumentId: string; 
      replacementReason: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the old document to determine version
      const { data: oldDoc, error: oldDocError } = await supabase
        .from('document_storage')
        .select('version, source')
        .eq('id', replacesDocumentId)
        .single();

      if (oldDocError) throw oldDocError;

      const newVersion = oldDoc.version + 1;
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${documentType}_v${newVersion}_${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('profile-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Store relative path (works with private bucket and signed URLs)
      const storagePath = fileName;

      // Insert new document record
      const { error: insertError } = await supabase
        .from('document_storage')
        .insert({
          user_id: user.id,
          document_type: documentType,
          document_name: file.name,
          file_path: storagePath,
          file_size: file.size,
          mime_type: file.type,
          source: oldDoc.source,
          version: newVersion,
          replaces_document_id: replacesDocumentId,
          replacement_reason: replacementReason,
          uploaded_by: user.id,
          replacement_status: 'pending_approval',
          is_latest_version: false
        });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-centre'] });
      queryClient.invalidateQueries({ queryKey: ['document-versions'] });
      toast({
        title: 'Replacement uploaded',
        description: 'Your document is pending approval'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
};
