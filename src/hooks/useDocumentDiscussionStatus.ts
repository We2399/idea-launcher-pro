import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DocumentWithDiscussion {
  documentId: string;
  hasUnreadAdminMessage: boolean;
  lastAdminCommentType: string | null;
  lastCommentDate: string | null;
  commentCount: number;
}

export const useDocumentDiscussionStatus = (userId: string) => {
  return useQuery({
    queryKey: ['document-discussion-status', userId],
    queryFn: async () => {
      // Get all documents for the user
      const { data: documents, error: docsError } = await supabase
        .from('profile_documents')
        .select('id, file_path')
        .eq('user_id', userId);

      if (docsError) throw docsError;
      if (!documents || documents.length === 0) return [];

      const docIds = documents.map(d => d.id);

      // Get all comments for these documents
      const { data: comments, error: commentsError } = await supabase
        .from('document_comments')
        .select('document_id, comment_type, created_at, user_id')
        .in('document_id', docIds)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // Also check document_storage for discussions
      const { data: storageComments, error: storageError } = await supabase
        .from('document_storage')
        .select('id, file_path')
        .eq('user_id', userId)
        .not('id', 'in', `(${docIds.join(',')})`);

      if (storageError) console.error('Storage fetch error:', storageError);

      // Get comments for storage documents
      const storageIds = storageComments?.map(d => d.id) || [];
      let allStorageComments: any[] = [];
      
      if (storageIds.length > 0) {
        const { data: sc } = await supabase
          .from('document_comments')
          .select('document_id, comment_type, created_at, user_id')
          .in('document_id', storageIds)
          .order('created_at', { ascending: false });
        
        allStorageComments = sc || [];
      }

      // Combine all comments
      const allComments = [...(comments || []), ...allStorageComments];

      // Group by document and check status
      const docStatuses = new Map<string, DocumentWithDiscussion>();

      allComments.forEach(comment => {
        if (!docStatuses.has(comment.document_id)) {
          docStatuses.set(comment.document_id, {
            documentId: comment.document_id,
            hasUnreadAdminMessage: false,
            lastAdminCommentType: null,
            lastCommentDate: null,
            commentCount: 0
          });
        }

        const status = docStatuses.get(comment.document_id)!;
        status.commentCount++;

        // Check if last comment is from admin (admin_note or admin_question)
        if (!status.lastCommentDate) {
          status.lastCommentDate = comment.created_at;
          status.lastAdminCommentType = comment.comment_type;
          
          // If last comment is admin and user hasn't replied after
          if (comment.comment_type === 'admin_note' || comment.comment_type === 'admin_question') {
            status.hasUnreadAdminMessage = true;
          }
        }

        // If we find an employee reply after admin comment, mark as read
        if (comment.comment_type === 'employee_reply' && status.hasUnreadAdminMessage) {
          const adminComments = allComments.filter(
            c => c.document_id === comment.document_id && 
            (c.comment_type === 'admin_note' || c.comment_type === 'admin_question')
          );
          
          if (adminComments.length > 0 && adminComments[0].created_at < comment.created_at) {
            status.hasUnreadAdminMessage = false;
          }
        }
      });

      return Array.from(docStatuses.values());
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
