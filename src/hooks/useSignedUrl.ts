import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to generate signed URLs for private storage files
 * @param filePath - The file path (can be a full URL or just a path)
 * @param bucket - The storage bucket name (default: 'receipts')
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 */
export const useSignedUrl = (
  filePath: string | null,
  bucket: string = 'receipts',
  expiresIn: number = 3600
) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!filePath) {
      setSignedUrl(null);
      return;
    }

    const generateSignedUrl = async () => {
      setLoading(true);
      setError(null);

      try {
        // Extract the actual file path from various URL formats
        let actualPath = filePath;
        
        // If it's a full Supabase storage URL, extract the path
        if (filePath.includes('/storage/v1/object/public/')) {
          const parts = filePath.split('/storage/v1/object/public/');
          if (parts[1]) {
            // Remove bucket name from path
            const pathWithBucket = parts[1];
            const bucketPrefix = bucket + '/';
            actualPath = pathWithBucket.startsWith(bucketPrefix) 
              ? pathWithBucket.slice(bucketPrefix.length) 
              : pathWithBucket;
          }
        } else if (filePath.startsWith(`${bucket}/`)) {
          // If path starts with bucket name, remove it
          actualPath = filePath.slice(bucket.length + 1);
        } else if (filePath.startsWith('receipts/')) {
          // Handle the new format we store
          actualPath = filePath.slice('receipts/'.length);
        }

        const { data, error: signError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(actualPath, expiresIn);

        if (signError) throw signError;
        
        setSignedUrl(data?.signedUrl || null);
      } catch (err) {
        console.error('Error generating signed URL:', err);
        setError(err as Error);
        // Fall back to original path if signing fails (for backwards compatibility)
        setSignedUrl(filePath);
      } finally {
        setLoading(false);
      }
    };

    generateSignedUrl();
  }, [filePath, bucket, expiresIn]);

  return { signedUrl, loading, error };
};

/**
 * Utility function to generate a signed URL (non-hook version)
 */
export const getSignedUrl = async (
  filePath: string | null,
  bucket: string = 'receipts',
  expiresIn: number = 3600
): Promise<string | null> => {
  if (!filePath) return null;

  try {
    let actualPath = filePath;
    
    // If it's a full Supabase storage URL, extract the path
    if (filePath.includes('/storage/v1/object/public/')) {
      const parts = filePath.split('/storage/v1/object/public/');
      if (parts[1]) {
        const pathWithBucket = parts[1];
        const bucketPrefix = bucket + '/';
        actualPath = pathWithBucket.startsWith(bucketPrefix) 
          ? pathWithBucket.slice(bucketPrefix.length) 
          : pathWithBucket;
      }
    } else if (filePath.startsWith(`${bucket}/`)) {
      actualPath = filePath.slice(bucket.length + 1);
    } else if (filePath.startsWith('receipts/')) {
      actualPath = filePath.slice('receipts/'.length);
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(actualPath, expiresIn);

    if (error) throw error;
    
    return data?.signedUrl || null;
  } catch (err) {
    console.error('Error generating signed URL:', err);
    // Fall back to original path
    return filePath;
  }
};
