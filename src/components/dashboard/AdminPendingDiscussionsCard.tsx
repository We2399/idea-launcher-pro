import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminPendingDiscussions } from '@/hooks/usePendingDiscussions';
import { DocumentDetailsModal } from '@/components/storage/DocumentDetailsModal';
import { Link } from 'react-router-dom';
import { useAddDocumentComment } from '@/hooks/useStorageCentre';

export function AdminPendingDiscussionsCard() {
  const { data: pending = [] } = useAdminPendingDiscussions();
  const addComment = useAddDocumentComment();
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  if (!pending || pending.length === 0) return null;

  const sendReminder = async (docId: string) => {
    await addComment.mutateAsync({ docId, comment: 'Reminder: please respond so we can proceed.', type: 'admin_note' });
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Pending employee responses</CardTitle>
            <Link to="/storage-centre">
              <Button size="sm" variant="outline">Open Storage Centre</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.slice(0, 5).map((d: any) => (
            <div key={d.id} className="flex items-center justify-between border rounded-md p-3">
              <div className="space-y-1">
                <div className="font-medium text-sm">{d.document_name}</div>
                <div className="text-xs text-muted-foreground">{d.employee_name} • Waiting {d.daysWaiting} day{d.daysWaiting === 1 ? '' : 's'}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => { setSelected(d); setOpen(true); }}>
                  Discuss
                </Button>
                <Button size="sm" onClick={() => sendReminder(d.id)} disabled={addComment.isPending}>
                  {addComment.isPending ? 'Sending…' : 'Remind'}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <DocumentDetailsModal document={selected} open={open} onOpenChange={setOpen} />
    </>
  );
}