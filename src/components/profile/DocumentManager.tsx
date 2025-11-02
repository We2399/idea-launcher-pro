import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Upload, File, Eye, Trash2, MessageSquare, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DocumentDetailsModal } from '@/components/storage/DocumentDetailsModal';
import { useDocumentDiscussionStatus } from '@/hooks/useDocumentDiscussionStatus';

interface Document {
  id: string;
  document_type: string;
  document_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

interface DocumentManagerProps {
  userId: string;
  canManage?: boolean;
}

const documentTypes = [
  { value: 'passport', label: 'passport' },
  { value: 'id_card', label: 'idCard' },
  { value: 'visa', label: 'visa' },
  { value: 'certificate', label: 'certificate' },
  { value: 'contract', label: 'contract' }
];

export default function DocumentManager({ userId, canManage = true }: DocumentManagerProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: discussionStatuses } = useDocumentDiscussionStatus(userId);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [discussDoc, setDiscussDoc] = useState<any | null>(null);
  const [showDiscussModal, setShowDiscussModal] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [replaceDocType, setReplaceDocType] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('profile_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentType || !user) return;

    try {
      setUploading(true);

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${userId}/${documentType}_${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Save document record to database
      const { error: dbError } = await supabase
        .from('profile_documents')
        .insert({
          user_id: userId,
          document_type: documentType,
          document_name: selectedFile.name,
          file_path: uploadData.path,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          uploaded_by: user.id
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: t('documentUploaded')
      });

      setShowUploadDialog(false);
      setSelectedFile(null);
      setDocumentType('');
      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('profile-documents')
        .createSignedUrl(document.file_path, 60); // 60 seconds expiry

      if (error) throw error;

      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to view document",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDocument = async (documentId: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('profile-documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('profile_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: t('documentDeleted')
      });

      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDiscuss = async (document: Document) => {
    // Find the corresponding document_storage record
    const { data: storageDoc } = await supabase
      .from('document_storage')
      .select('*')
      .eq('file_path', document.file_path)
      .eq('user_id', userId)
      .single();
    
    setDiscussDoc(storageDoc || { ...document, id: document.id });
    setShowDiscussModal(true);
  };

  const handleReplace = async () => {
    if (!selectedFile || !replaceDocType || !user) return;

    try {
      setUploading(true);

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${userId}/${replaceDocType}_${Date.now()}.${fileExt}`;

      // Upload new file to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Insert as replacement (trigger will handle versioning)
      const { error: dbError } = await supabase
        .from('profile_documents')
        .insert({
          user_id: userId,
          document_type: replaceDocType,
          document_name: selectedFile.name,
          file_path: uploadData.path,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          uploaded_by: user.id
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Replacement uploaded and awaiting approval"
      });

      setShowReplaceDialog(false);
      setSelectedFile(null);
      setReplaceDocType('');
      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload replacement",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('documents')}</CardTitle>
        {canManage && (
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {t('uploadDocument')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('uploadDocument')}</DialogTitle>
                <DialogDescription>
                  {t('uploadDocumentDescription')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('documentType')}</Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectDocumentType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {t(type.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('file')}</Label>
                  <Input
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      {t('selected')}: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleUpload} 
                    disabled={!selectedFile || !documentType || uploading}
                  >
                    {uploading ? t('uploading') : t('upload')}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowUploadDialog(false)}
                  >
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((document) => (
              <div key={document.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <File className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{document.document_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(documentTypes.find(type => type.value === document.document_type)?.label || 'document')} • {formatFileSize(document.file_size)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(document.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDiscuss(document)}
                      title="Discuss"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    {discussionStatuses?.find(d => (d as any).filePath === document.file_path)?.hasUnreadAdminMessage && (
                      <span className="absolute top-0 right-0 h-3 w-3 bg-primary rounded-full border-2 border-background" />
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDocument(document)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canManage && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setReplaceDocType(document.document_type);
                          setShowReplaceDialog(true);
                        }}
                        title="Replace"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('deleteDocument')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t('deleteDocumentConfirm')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteDocument(document.id, document.file_path)}
                            >
                              {t('delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {t('noDocuments')}
          </div>
        )}
      </CardContent>

      <Dialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace Document</DialogTitle>
            <DialogDescription>
              Upload a new version of this document for admin approval
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Input value={t(documentTypes.find(t => t.value === replaceDocType)?.label || '')} disabled />
            </div>
            <div className="space-y-2">
              <Label>New File</Label>
              <Input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  {t('selected')}: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleReplace} 
                disabled={!selectedFile || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Replacement'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowReplaceDialog(false)}
              >
                {t('cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DocumentDetailsModal 
        document={discussDoc} 
        open={showDiscussModal} 
        onOpenChange={setShowDiscussModal} 
      />
    </Card>
  );
}