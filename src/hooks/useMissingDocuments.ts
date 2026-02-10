import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MissingDocument {
  field: string;
  documentType: string;
  label: string;
  userId: string;
  userName: string;
}

// Map profile fields to their required document types
const fieldToDocType: Record<string, { type: string; label: string }> = {
  id_number: { type: 'id_card', label: 'ID Card Copy' },
  passport_number: { type: 'passport', label: 'Passport Copy' },
  visa_number: { type: 'visa', label: 'Visa Copy' },
};

export const useMissingDocuments = (userId?: string) => {
  return useQuery({
    queryKey: ['missing-documents', userId],
    queryFn: async () => {
      const targetUserId = userId;
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        return checkMissingDocs(user.id);
      }
      return checkMissingDocs(targetUserId);
    },
    enabled: true,
  });
};

async function checkMissingDocs(userId: string): Promise<MissingDocument[]> {
  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name, id_number, passport_number, visa_number')
    .eq('user_id', userId)
    .maybeSingle();

  if (!profile) return [];

  // Fetch existing profile documents
  const { data: docs } = await supabase
    .from('profile_documents')
    .select('document_type')
    .eq('user_id', userId);

  const existingTypes = new Set((docs || []).map(d => d.document_type));
  const missing: MissingDocument[] = [];
  const userName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();

  for (const [field, { type, label }] of Object.entries(fieldToDocType)) {
    const value = (profile as any)[field];
    if (value && String(value).trim() !== '') {
      if (!existingTypes.has(type)) {
        missing.push({ field, documentType: type, label, userId, userName });
      }
    }
  }

  return missing;
}

// For admin: check all employees with missing documents
export const useAllMissingDocuments = () => {
  return useQuery({
    queryKey: ['all-missing-documents'],
    queryFn: async () => {
      // Fetch all profiles that have at least one ID field filled
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, id_number, passport_number, visa_number')
        .or('id_number.neq.,passport_number.neq.,visa_number.neq.');

      if (!profiles || profiles.length === 0) return [];

      // Fetch all profile documents
      const { data: allDocs } = await supabase
        .from('profile_documents')
        .select('user_id, document_type');

      const docsByUser = new Map<string, Set<string>>();
      (allDocs || []).forEach(d => {
        if (!docsByUser.has(d.user_id)) docsByUser.set(d.user_id, new Set());
        docsByUser.get(d.user_id)!.add(d.document_type);
      });

      const allMissing: MissingDocument[] = [];

      for (const profile of profiles) {
        const userDocs = docsByUser.get(profile.user_id) || new Set();
        const userName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();

        for (const [field, { type, label }] of Object.entries(fieldToDocType)) {
          const value = (profile as any)[field];
          if (value && String(value).trim() !== '') {
            if (!userDocs.has(type)) {
              allMissing.push({ field, documentType: type, label, userId: profile.user_id, userName });
            }
          }
        }
      }

      return allMissing;
    },
  });
};
