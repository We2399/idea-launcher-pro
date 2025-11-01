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
    let lastAdminAt: number | null = null;
    let lastEmployeeAt: number | null = null;

    for (const c of list) {
      const isSystem = (c.comment_type || '').toLowerCase() === 'system';
      if (isSystem) continue;
      if (c.user_id === doc.user_id) {
        lastEmployeeAt = new Date(c.created_at).getTime();
      } else {
        lastAdminAt = new Date(c.created_at).getTime();
      }
    }

    const awaitingEmployee = !!(lastAdminAt && (!lastEmployeeAt || lastAdminAt > lastEmployeeAt));
    const waitingMs = awaitingEmployee && lastAdminAt ? Date.now() - lastAdminAt : 0;

    return {
      ...doc,
      pendingDiscussion: awaitingEmployee,
      lastAdminCommentAt: lastAdminAt ? new Date(lastAdminAt) : null,
      daysWaiting: awaitingEmployee ? Math.max(0, Math.floor(waitingMs / (1000 * 60 * 60 * 24))) : 0,
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
      // Check role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      const role = roles?.role as string | undefined;
      if (!(role === 'hr_admin' || role === 'administrator')) return [] as any[];

      // Fetch all non-deleted documents (including active ones with discussions)
      const { data: docs, error: docsErr } = await supabase
        .from('document_storage')
        .select('id, user_id, document_name, file_path, version, replacement_status')
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(200);
      if (docsErr) throw docsErr;
      if (!docs || docs.length === 0) return [] as any[];

      const ids = docs.map((d) => d.id);
      const { data: comments, error: cErr } = await supabase
        .from('document_comments')
        .select('id, document_id, user_id, created_at, comment_type, comment')
        .in('document_id', ids);
      if (cErr) throw cErr;

      const computed = computePendingByDoc(docs as any, comments || []);
      const pending = computed.filter((d) => d.pendingDiscussion);

      // Fetch employee names for display
      const userIds = Array.from(new Set(pending.map((d) => d.user_id)));
      if (userIds.length === 0) return pending;
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', userIds);
      const nameMap = new Map<string, string>();
      (profiles || []).forEach((p) => nameMap.set(p.user_id, `${p.first_name || ''} ${p.last_name || ''}`.trim()));

      return pending.map((d) => ({
        ...d,
        employee_name: nameMap.get(d.user_id) || 'Employee'
      }));
    }
  });
};