import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DocumentStorage } from '@/hooks/useStorageCentre';

// Helper to compute pending state based on comments
function computePendingByDoc(docs: Pick<DocumentStorage, 'id' | 'user_id' | 'document_name' | 'file_path' | 'version' | 'replacement_status'>[], comments: any[]) {
  const byDoc: Record<string, any[]> = {};
  comments.forEach((c) => {
    if (!byDoc[c.document_id]) byDoc[c.document_id] = [];
    byDoc[c.document_id].push(c);
  });

  return docs.map((doc) => {
    const list = (byDoc[doc.id] || []).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    // Check if discussion is closed - if any comment is 'discussion_closed', no pending
    const isClosed = list.some((c) => c.comment_type === 'discussion_closed');
    if (isClosed) {
      return {
        ...doc,
        pendingDiscussion: false,
        lastAdminCommentAt: null,
        daysWaiting: 0,
        lastAdminComment: null,
      };
    }
    
    let lastAdminAt: number | null = null;
    let lastEmployeeAt: number | null = null;
    let lastAdminComment: string | null = null;

    for (const c of list) {
      const isSystem = (c.comment_type || '').toLowerCase() === 'system';
      if (isSystem) continue;
      if (c.user_id === doc.user_id) {
        lastEmployeeAt = new Date(c.created_at).getTime();
      } else {
        lastAdminAt = new Date(c.created_at).getTime();
        lastAdminComment = c.comment || null;
      }
    }

    const awaitingEmployee = !!(lastAdminAt && (!lastEmployeeAt || lastAdminAt > lastEmployeeAt));
    const waitingMs = awaitingEmployee && lastAdminAt ? Date.now() - lastAdminAt : 0;

    return {
      ...doc,
      pendingDiscussion: awaitingEmployee,
      lastAdminCommentAt: lastAdminAt ? new Date(lastAdminAt) : null,
      daysWaiting: awaitingEmployee ? Math.max(0, Math.floor(waitingMs / (1000 * 60 * 60 * 24))) : 0,
      lastAdminComment,
    };
  });
}

export const useEmployeePendingDiscussions = () => {
  return useQuery({
    queryKey: ['employee-pending-discussions'],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as any[];

      // Fetch this employee's documents (limit to recent for performance)
      const { data: docs, error: docsErr } = await supabase
        .from('document_storage')
        .select('id, user_id, document_name, file_path, version, replacement_status')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(100);
      if (docsErr) throw docsErr;
      if (!docs || docs.length === 0) return [] as any[];

      const ids = docs.map((d) => d.id);
      const { data: comments, error: cErr } = await supabase
        .from('document_comments')
        .select('id, document_id, user_id, created_at, comment_type, comment')
        .in('document_id', ids);
      if (cErr) throw cErr;

      const computed = computePendingByDoc(docs as any, comments || []);
      return computed.filter((d) => d.pendingDiscussion);
    }
  });
};

export const useAdminPendingDiscussions = () => {
  return useQuery({
    queryKey: ['admin-pending-discussions'],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as any[];

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const role = roles?.role as string | undefined;
      if (!(role === 'hr_admin' || role === 'administrator')) return [] as any[];

      // Fetch all non-deleted documents (including active ones with discussions)
      const { data: docs, error: docsErr } = await supabase
        .from('document_storage')
        .select('id, user_id, document_name, file_path, version, replacement_status')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(200);

      if (docsErr || !docs || docs.length === 0) return [] as any[];

      const docIds = docs.map(d => d.id);
      const { data: comments } = await supabase
        .from('document_comments')
        .select('document_id, user_id, comment_type, created_at, comment')
        .in('document_id', docIds)
        .order('created_at', { ascending: false });

      const pending = computePendingByDoc(docs as any, comments || []);

      const userIds = [...new Set(pending.map((d: any) => d.user_id))];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const results = pending.map((d: any) => {
        const profile = profileMap.get(d.user_id);
        return {
          ...d,
          employeeName: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown'
        };
      });

      return results;
    }
  });
};

export const useAdminNeedsReplyDiscussions = () => {
  return useQuery({
    queryKey: ['admin-needs-reply-discussions'],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as any[];

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const role = roles?.role as string | undefined;
      if (!(role === 'hr_admin' || role === 'administrator')) return [] as any[];

      const { data: docs, error: docsErr } = await supabase
        .from('document_storage')
        .select('id, user_id, document_name, file_path, version, replacement_status')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(200);

      if (docsErr || !docs || docs.length === 0) return [] as any[];

      const docIds = docs.map(d => d.id);
      const { data: comments } = await supabase
        .from('document_comments')
        .select('document_id, user_id, comment_type, created_at')
        .in('document_id', docIds)
        .order('created_at', { ascending: false });

      if (!comments || comments.length === 0) return [];

      // Find documents where the last comment is from employee (needs admin reply)
      // But exclude closed discussions
      const needsAdminReply = docs.filter((doc: any) => {
        const docComments = comments.filter((c: any) => c.document_id === doc.id);
        if (docComments.length === 0) return false;
        
        // Check if any comment is 'discussion_closed'
        const isClosed = docComments.some((c: any) => c.comment_type === 'discussion_closed');
        if (isClosed) return false;
        
        const lastComment = docComments[0];
        return lastComment.comment_type === 'employee_reply' && lastComment.user_id === doc.user_id;
      });

      if (needsAdminReply.length === 0) return [];

      const userIds = [...new Set(needsAdminReply.map((d: any) => d.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return needsAdminReply.map((doc: any) => {
        const docComments = comments.filter((c: any) => c.document_id === doc.id);
        const lastComment = docComments[0];
        const daysSince = Math.floor((Date.now() - new Date(lastComment.created_at).getTime()) / (1000 * 60 * 60 * 24));
        const profile = profileMap.get(doc.user_id);

        return {
          ...doc,
          employeeName: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
          daysWaiting: daysSince
        };
      });
    }
  });
};