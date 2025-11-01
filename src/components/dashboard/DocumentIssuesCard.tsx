import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMyDocumentIssues } from '@/hooks/useMyDocumentIssues';
import { DocumentDetailsModal } from '@/components/storage/DocumentDetailsModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function DocumentIssuesCard() {
  const { data: docs } = useMyDocumentIssues();
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  if (!docs || docs.length === 0) return null;

  const getSignedUrl = async (filePath: string) => {
    try {
      let bucket = 'profile-documents';
      let path = filePath;
      if (filePath.includes('/receipts/') || filePath.startsWith('receipts/')) bucket = 'receipts';
      if (filePath.includes('storage')) {
        const marker = `${bucket}/`;
        const idx = filePath.indexOf(marker);
        path = idx >= 0 ? filePath.substring(idx + marker.length) : filePath;
      } else if (filePath.includes(`${bucket}/`)) {
        path = filePath.split(`${bucket}/`)[1];
      }
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
      if (error) throw error;
      window.open(data.signedUrl, '_blank');
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to access document', variant: 'destructive' });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Documents needing your attention</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {docs.slice(0,5).map((d:any)=> (
            <div key={d.id} className="flex items-center justify-between border rounded-md p-3">
              <div className="space-y-1">
                <div className="font-medium text-sm">{d.document_name}</div>
                <div className="text-xs text-muted-foreground">v{d.version}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={d.replacement_status === 'rejected' ? 'destructive' : 'secondary'}>
                  {d.replacement_status === 'rejected' ? 'Rejected' : 'Pending'}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => getSignedUrl(d.file_path)}>View</Button>
                <Button size="sm" variant="outline" onClick={() => { setSelected(d); setOpen(true); }}>Discussion</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <DocumentDetailsModal document={selected} open={open} onOpenChange={setOpen} />
    </>
  );
}
