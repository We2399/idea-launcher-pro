import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface AvatarUploadProps {
  userId: string;
  userName?: string;
  canEdit?: boolean;
}

export default function AvatarUpload({ userId, userName, canEdit = true }: AvatarUploadProps) {
  const { t } = useLanguage();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAvatar();
  }, [userId]);

  const fetchAvatar = async () => {
    if (!userId) return;
    
    const { data: avatarDoc } = await supabase
      .from('profile_documents')
      .select('file_path')
      .eq('user_id', userId)
      .eq('document_type', 'avatar')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (avatarDoc?.file_path) {
      const { data: signedUrl } = await supabase.storage
        .from('profile-documents')
        .createSignedUrl(avatarDoc.file_path, 3600);
      if (signedUrl?.signedUrl) {
        setAvatarUrl(signedUrl.signedUrl);
      }
    } else {
      setAvatarUrl(null);
    }
  };

  const getInitials = () => {
    if (userName) {
      return userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'U';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('error'),
        description: t('pleaseSelectImage'),
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('error'),
        description: t('fileTooLarge'),
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('profile-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Delete old avatar records
      await supabase
        .from('profile_documents')
        .delete()
        .eq('user_id', userId)
        .eq('document_type', 'avatar');

      // Create new document record
      const { error: dbError } = await supabase
        .from('profile_documents')
        .insert({
          user_id: userId,
          uploaded_by: userId,
          document_type: 'avatar',
          document_name: 'Profile Photo',
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type
        });

      if (dbError) throw dbError;

      // Refresh avatar
      await fetchAvatar();

      toast({
        title: t('success'),
        description: t('avatarUpdated')
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('failedToUploadAvatar'),
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
          <AvatarImage src={avatarUrl || undefined} alt={userName || 'Profile'} />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        {canEdit && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      
      {canEdit && (
        <p className="text-xs text-muted-foreground text-center">
          {t('clickToUploadPhoto')}
        </p>
      )}
    </div>
  );
}
