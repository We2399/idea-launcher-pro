import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DocumentWithDiscussion {
  documentId: string; // document_storage.id
  filePath: string;
  hasUnreadAdminMessage: boolean;
  needsAdminAction: boolean;
  lastAdminCommentType: string | null;
  lastCommentDate: string | null;
  commentCount: number;
}

export const useDocumentDiscussionStatus = (userId: string) => {
  return useQuery({
    queryKey: ['document-discussion-status', userId],
    queryFn: async () => {
      // Get all profile documents for the user
      const { data: profileDocs, error: docsError } = await supabase
        .from('profile_documents')
        .select('id, file_path')
        .eq('user_id', userId);

      if (docsError) throw docsError;
      if (!profileDocs || profileDocs.length === 0) return [] as DocumentWithDiscussion[];

      const filePaths = profileDocs.map(d => d.file_path);

      // Find matching document_storage rows for these files (same user)
      const { data: storageDocs, error: storageError } = await supabase
        .from('document_storage')
        .select('id, file_path')
        .eq('user_id', userId)
        .in('file_path', filePaths);

      if (storageError) throw storageError;
      if (!storageDocs || storageDocs.length === 0) return [] as DocumentWithDiscussion[];

      const storageIds = storageDocs.map(d => d.id);

      // Get comments for these storage documents
      const { data: comments, error: commentsError } = await supabase
        .from('document_comments')
        .select('document_id, comment_type, created_at, user_id')
        .in('document_id', storageIds)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // Group by document and compute status
      const byDoc = new Map<string, DocumentWithDiscussion>();

      // Initialize for all storage docs
      for (const d of storageDocs) {
        byDoc.set(d.id, {
          documentId: d.id,
          filePath: d.file_path,
          hasUnreadAdminMessage: false,
          needsAdminAction: false,
          lastAdminCommentType: null,
          lastCommentDate: null,
          commentCount: 0,
        });
      }

      // Iterate newest to oldest
      for (const c of comments || []) {
        const status = byDoc.get(c.document_id);
        if (!status) continue;
        status.commentCount++;
        if (!status.lastCommentDate) {
          status.lastCommentDate = c.created_at;
          status.lastAdminCommentType = c.comment_type;
          // If last is admin_* then employee needs to reply
          if (c.comment_type === 'admin_note' || c.comment_type === 'admin_question') {
            status.hasUnreadAdminMessage = true;
          }
          // If last is employee_reply, then admin needs to act
          if (c.comment_type === 'employee_reply') {
            status.needsAdminAction = true;
          }
        } else {
          // If we already marked unread admin but we find a later employee reply, clear it
          if (c.comment_type === 'employee_reply' && status.hasUnreadAdminMessage) {
            // since comments are ordered desc, encountering employee_reply after setting means it's newer
            status.hasUnreadAdminMessage = false;
          }
          // If needsAdminAction is set and we find an admin comment newer, clear it
          if ((c.comment_type === 'admin_note' || c.comment_type === 'admin_question') && status.needsAdminAction) {
            status.needsAdminAction = false;
          }
        }
      }

      return Array.from(byDoc.values());
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
