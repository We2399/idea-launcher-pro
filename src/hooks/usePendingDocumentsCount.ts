import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePendingDocumentsCount = () => {
  return useQuery({
    queryKey: ['pending-documents-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('document_storage')
        .select('*', { count: 'exact', head: true })
        .eq('replacement_status', 'pending_approval')
        .is('deleted_at', null);
      
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
