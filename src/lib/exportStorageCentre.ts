import { format } from 'date-fns';
import { DocumentStorage } from '@/hooks/useStorageCentre';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const exportDocumentList = (documents: DocumentStorage[]) => {
  const csvData = documents.map(doc => ({
    'Employee Name': doc.user ? `${doc.user.first_name} ${doc.user.last_name}` : '-',
    'Employee ID': doc.user?.employee_id || '-',
    'Document Type': doc.document_type,
    'Document Name': doc.document_name,
    'Version': doc.version,
    'Status': doc.replacement_status,
    'Source': doc.source,
    'File Size': formatFileSize(doc.file_size),
    'Uploaded By': doc.uploaded_by_user ? `${doc.uploaded_by_user.first_name} ${doc.uploaded_by_user.last_name}` : '-',
    'Upload Date': format(new Date(doc.created_at), 'yyyy-MM-dd HH:mm:ss'),
    'Replacement Reason': doc.replacement_reason || '-',
    'Approved/Rejected By': doc.approver ? `${doc.approver.first_name} ${doc.approver.last_name}` : '-',
    'Approval Date': doc.approved_at ? format(new Date(doc.approved_at), 'yyyy-MM-dd HH:mm:ss') : '-',
    'Rejection Reason': doc.rejection_reason || '-'
  }));

  // Convert to CSV
  const headers = Object.keys(csvData[0] || {});
  const csvRows = [
    headers.join(','),
    ...csvData.map(row => 
      headers.map(header => {
        const value = row[header as keyof typeof row] || '';
        // Escape commas and quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ];

  const csv = csvRows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `document_storage_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};

// Export documents with files as ZIP
export const exportDocumentsWithFiles = async (
  documents: DocumentStorage[],
  onProgress?: (current: number, total: number) => void
) => {
  try {
    if (documents.length === 0) {
      toast.error('No documents to export');
      return;
    }

    // Estimate size
    const estimatedSize = documents.reduce((sum, doc) => sum + doc.file_size, 0);
    if (estimatedSize > 500 * 1024 * 1024) { // 500MB
      const proceed = confirm(
        `This export is approximately ${formatFileSize(estimatedSize)}. ` +
        'Large exports may take several minutes. Continue?'
      );
      if (!proceed) return;
    }

    toast.info(`Preparing to export ${documents.length} documents...`);

    // Enrich documents with employee info
    const enrichedDocs = documents.map(doc => ({
      id: doc.id,
      user_id: doc.user_id,
      document_type: doc.document_type,
      document_name: doc.document_name,
      file_path: doc.file_path,
      file_size: doc.file_size,
      mime_type: doc.mime_type,
      source: doc.source,
      version: doc.version,
      replacement_status: doc.replacement_status,
      created_at: doc.created_at,
      uploaded_by: doc.uploaded_by,
      approved_by: doc.approved_by,
      approved_at: doc.approved_at,
      rejection_reason: doc.rejection_reason,
      deleted_at: doc.deleted_at,
      employee_name: doc.user ? `${doc.user.first_name} ${doc.user.last_name}` : 'Unknown',
      employee_id: doc.user?.employee_id || 'Unknown'
    }));

    if (onProgress) onProgress(0, documents.length);

    // Call edge function - get binary response
    const response = await fetch(`https://cavrkwzwlgrstddykpsu.supabase.co/functions/v1/export-storage-centre`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({ documents: enrichedDocs })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Export failed: ${errorText}`);
    }

    if (onProgress) onProgress(documents.length, documents.length);

    // Get the binary data directly from the response
    const blob = await response.blob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    link.href = url;
    link.download = `storage_export_${timestamp}.zip`;
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    toast.success('Export completed successfully!');
  } catch (error) {
    console.error('Export error:', error);
    toast.error('Failed to export documents: ' + (error as Error).message);
  }
};
