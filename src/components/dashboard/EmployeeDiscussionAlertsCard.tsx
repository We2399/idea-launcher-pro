import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Search } from 'lucide-react';
import { useEmployeePendingDiscussions } from '@/hooks/usePendingDiscussions';
import { DocumentDetailsModal } from '@/components/storage/DocumentDetailsModal';

export function EmployeeDiscussionAlertsCard() {
  const { data: pending = [] } = useEmployeePendingDiscussions();
  const [selected, setSelected] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPending = useMemo(() => {
    if (!searchTerm.trim()) return pending;
    const search = searchTerm.toLowerCase();
    return pending.filter((d: any) => 
      d.document_name?.toLowerCase().includes(search) ||
      d.lastAdminComment?.toLowerCase().includes(search)
    );
  }, [pending, searchTerm]);

  if (!pending || pending.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Discussions awaiting your response ({pending.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length > 5 && (
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search discussions..."
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
                {d.lastAdminComment && (
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    "{d.lastAdminComment.substring(0, 100)}{d.lastAdminComment.length > 100 ? '...' : ''}"
                  </div>
                )}
                <div className="text-xs text-muted-foreground">Waiting {d.daysWaiting} day{d.daysWaiting === 1 ? '' : 's'}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => { setSelected(d); setOpen(true); }}>
                <MessageSquare className="h-4 w-4 mr-1" /> Reply
              </Button>
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