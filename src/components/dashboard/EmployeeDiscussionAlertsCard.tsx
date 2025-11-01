import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useEmployeePendingDiscussions } from '@/hooks/usePendingDiscussions';
import { DocumentDetailsModal } from '@/components/storage/DocumentDetailsModal';

export function EmployeeDiscussionAlertsCard() {
  const { data: pending = [] } = useEmployeePendingDiscussions();
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  if (!pending || pending.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Discussions awaiting your response</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.slice(0, 5).map((d: any) => (
            <div key={d.id} className="flex items-center justify-between border rounded-md p-3">
              <div className="space-y-1">
                <div className="font-medium text-sm">{d.document_name}</div>
                <div className="text-xs text-muted-foreground">Waiting {d.daysWaiting} day{d.daysWaiting === 1 ? '' : 's'}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => { setSelected(d); setOpen(true); }}>
                <MessageSquare className="h-4 w-4 mr-1" /> Discuss
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
      <DocumentDetailsModal document={selected} open={open} onOpenChange={setOpen} />
    </>
  );
}