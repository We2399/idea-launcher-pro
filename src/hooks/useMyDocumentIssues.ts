import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useMyDocumentIssues = () => {
  return useQuery({
    queryKey: ['my-document-issues'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('document_storage')
        .select('*')
        .eq('user_id', user.id)
        .in('replacement_status', ['rejected', 'pending_approval'])
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });
};
