import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send } from 'lucide-react';
import { useAdminNeedsReplyDiscussions } from '@/hooks/usePendingDiscussions';
import { DocumentDetailsModal } from '@/components/storage/DocumentDetailsModal';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export function AdminNeedsReplyCard() {
  const { data: pending = [] } = useAdminNeedsReplyDiscussions();
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const sendReminder = async (docId: string) => {
    await supabase.from('document_comments').insert({
      document_id: docId,
      user_id: (await supabase.auth.getUser()).data.user!.id,
      comment: 'Reminder: Please review and respond to the previous message.',
      comment_type: 'admin_note'
    });
    queryClient.invalidateQueries({ queryKey: ['admin-needs-reply-discussions'] });
    toast({ title: 'Reminder sent' });
  };

  if (!pending || pending.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Employee responses awaiting your review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.slice(0, 5).map((d: any) => (
            <div key={d.id} className="flex items-center justify-between border rounded-md p-3">
              <div className="space-y-1">
                <div className="font-medium text-sm">{d.document_name}</div>
                <div className="text-xs text-muted-foreground">
                  {d.employeeName} • {d.daysWaiting} day{d.daysWaiting === 1 ? '' : 's'} ago
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => sendReminder(d.id)}>
                  <Send className="h-3 w-3 mr-1" /> Remind
                </Button>
                <Button size="sm" onClick={() => { setSelected(d); setOpen(true); }}>
                  <MessageSquare className="h-4 w-4 mr-1" /> Reply
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
