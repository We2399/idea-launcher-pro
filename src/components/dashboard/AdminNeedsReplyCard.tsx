import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Search } from 'lucide-react';
import { useAdminNeedsReplyDiscussions } from '@/hooks/usePendingDiscussions';
import { DocumentDetailsModal } from '@/components/storage/DocumentDetailsModal';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export function AdminNeedsReplyCard() {
  const { data: pending = [] } = useAdminNeedsReplyDiscussions();
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const filteredPending = useMemo(() => {
    if (!searchTerm.trim()) return pending;
    const search = searchTerm.toLowerCase();
    return pending.filter((d: any) => 
      d.document_name?.toLowerCase().includes(search) ||
      d.employeeName?.toLowerCase().includes(search)
    );
  }, [pending, searchTerm]);

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
          <CardTitle className="text-base">Employee responses awaiting your review ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length > 5 && (
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee or document..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          )}
          {filteredPending.slice(0, 10).map((d: any) => (
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
          {filteredPending.length === 0 && searchTerm && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No discussions found matching "{searchTerm}"
            </div>
          )}
          {filteredPending.length > 10 && (
            <div className="text-center pt-2 text-sm text-muted-foreground">
              Showing 10 of {filteredPending.length} discussions {searchTerm && 'matching your search'}
            </div>
          )}
        </CardContent>
      </Card>
      <DocumentDetailsModal document={selected} open={open} onOpenChange={setOpen} />
    </>
  );
}
