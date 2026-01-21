import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReceiptLinkProps {
  receiptUrl: string;
  className?: string;
}

/**
 * Component that displays a receipt link with automatic signed URL generation
 * for private storage buckets
 */
export const ReceiptLink: React.FC<ReceiptLinkProps> = ({ 
  receiptUrl, 
  className = "text-primary hover:underline" 
}) => {
  const { t } = useLanguage();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateSignedUrl = async () => {
      if (!receiptUrl) {
        setLoading(false);
        return;
      }

      try {
        let actualPath = receiptUrl;
        
        // Extract the actual file path from various URL formats
        if (receiptUrl.includes('/storage/v1/object/public/')) {
          // Legacy public URL format - extract path after bucket name
          const parts = receiptUrl.split('/storage/v1/object/public/receipts/');
          if (parts[1]) {
            actualPath = parts[1];
          }
        } else if (receiptUrl.startsWith('receipts/')) {
          // New format: receipts/userId/timestamp.ext
          actualPath = receiptUrl.slice('receipts/'.length);
        }

        const { data, error } = await supabase.storage
          .from('receipts')
          .createSignedUrl(actualPath, 3600); // 1 hour expiry

        if (error) {
          console.error('Error generating signed URL:', error);
          // Fall back to original URL if signing fails
          setSignedUrl(receiptUrl);
        } else {
          setSignedUrl(data?.signedUrl || receiptUrl);
        }
      } catch (err) {
        console.error('Error generating signed URL:', err);
        setSignedUrl(receiptUrl);
      } finally {
        setLoading(false);
      }
    };

    generateSignedUrl();
  }, [receiptUrl]);

  if (loading) {
    return <span className="text-muted-foreground">{t('loading')}...</span>;
  }

  if (!signedUrl) {
    return null;
  }

  return (
    <a 
      href={signedUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className={className}
    >
      {t('receipt')}
    </a>
  );
};
