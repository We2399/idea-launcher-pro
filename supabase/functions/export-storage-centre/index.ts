import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import JSZip from 'https://esm.sh/jszip@3.10.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to normalize storage paths - handles both relative paths and public URLs
function normalizePath(bucket: string, rawPath: string): string {
  // If it's a full URL, extract the object key
  if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
    try {
      const url = new URL(rawPath);
      const pathname = url.pathname;
      
      // Remove common storage URL prefixes
      const prefixes = [
        `/storage/v1/object/public/${bucket}/`,
        `/storage/v1/object/${bucket}/`,
      ];
      
      for (const prefix of prefixes) {
        if (pathname.startsWith(prefix)) {
          return decodeURIComponent(pathname.substring(prefix.length));
        }
      }
      
      // If no prefix matched, try to extract after 'public/' or bucket name
      const publicMatch = pathname.match(/\/public\/(.+)$/);
      if (publicMatch) return decodeURIComponent(publicMatch[1]);
      
      const bucketMatch = pathname.match(new RegExp(`/${bucket}/(.+)$`));
      if (bucketMatch) return decodeURIComponent(bucketMatch[1]);
      
      // Last resort: use the full pathname without leading slash
      return decodeURIComponent(pathname.substring(1));
    } catch (e) {
      console.error('Failed to parse URL:', rawPath, e);
      return rawPath;
    }
  }
  
  // It's already a relative path
  return rawPath;
}

interface DocumentStorage {
  id: string;
  user_id: string;
  document_type: string;
  document_name: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  source: string;
  version: number;
  replacement_status: string | null;
  created_at: string;
  uploaded_by: string;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  deleted_at: string | null;
  employee_name?: string;
  employee_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { documents } = await req.json() as { documents: DocumentStorage[] };

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No documents provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting export for ${documents.length} documents`);

    const zip = new JSZip();
    
    // Create CSV content
    const csvHeaders = [
      'Document Name', 'Type', 'Source', 'Version', 'Status', 
      'Employee Name', 'Employee ID', 'File Size (MB)', 'Upload Date', 
      'Approved By', 'Approved Date', 'File Path in ZIP'
    ].join(',');
    
    const csvRows = [csvHeaders];
    const employeeFolders = new Map<string, string>();

    // Process each document
    for (const doc of documents) {
      const employeeName = doc.employee_name || 'Unknown';
      const employeeId = doc.employee_id || 'Unknown';
      const folderKey = `${employeeName}_${employeeId}`;
      
      if (!employeeFolders.has(folderKey)) {
        employeeFolders.set(folderKey, folderKey);
      }

      // Determine bucket based on source
      const bucket = doc.source === 'cash_control' ? 'receipts' : 'profile-documents';
      
      // Get file extension and prepare file name
      const ext = doc.file_path.split('.').pop() || 'bin';
      const sanitizedFileName = doc.document_name.replace(/[^a-z0-9_\-\.]/gi, '_');
      const fileName = `${sanitizedFileName}_v${doc.version}.${ext}`;
      let filePath = `files/${folderKey}/${fileName}`;
      
      try {
        // Normalize the path (handles both relative paths and public URLs)
        const normalizedPath = normalizePath(bucket, doc.file_path);
        
        // Download file from storage
        console.log(`Downloading ${doc.document_name} from ${bucket}/${normalizedPath}`);
        const { data: fileData, error: downloadError } = await supabase
          .storage
          .from(bucket)
          .download(normalizedPath);

        if (downloadError) {
          console.error(`Error downloading ${doc.document_name}:`, downloadError);
          // Mark as error in CSV but still include the row
          filePath = `download_error/${sanitizedFileName}_v${doc.version}.${ext}`;
        } else {
          // Add file to ZIP
          const arrayBuffer = await fileData.arrayBuffer();
          zip.file(filePath, arrayBuffer);
        }
      } catch (error) {
        console.error(`Error processing document ${doc.id}:`, error);
        // Mark as error in CSV but still include the row
        filePath = `download_error/${sanitizedFileName}_v${doc.version}.${ext}`;
      }

      // Always add CSV row (even if download failed)
      const csvRow = [
        `"${doc.document_name.replace(/"/g, '""')}"`,
        doc.document_type,
        doc.source,
        doc.version,
        doc.replacement_status || 'active',
        `"${employeeName.replace(/"/g, '""')}"`,
        employeeId,
        (doc.file_size / 1024 / 1024).toFixed(2),
        new Date(doc.created_at).toLocaleDateString(),
        doc.approved_by || 'N/A',
        doc.approved_at ? new Date(doc.approved_at).toLocaleDateString() : 'N/A',
        filePath
      ].join(',');
      
      csvRows.push(csvRow);
    }

    // Add CSV to ZIP
    const csvContent = csvRows.join('\n');
    zip.file('documents_metadata.csv', csvContent);

    console.log('Generating ZIP file...');
    const zipBlob = await zip.generateAsync({ 
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `storage_export_${timestamp}.zip`;

    console.log(`Export completed: ${filename} (${zipBlob.length} bytes)`);

    return new Response(zipBlob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
