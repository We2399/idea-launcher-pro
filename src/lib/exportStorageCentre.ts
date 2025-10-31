import { format } from 'date-fns';
import { DocumentStorage } from '@/hooks/useStorageCentre';

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
