import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePendingDocumentsCount } from '@/hooks/usePendingDocumentsCount';
import { Link } from 'react-router-dom';

export function StorageCentreAlert() {
  const { data: pending } = usePendingDocumentsCount();
  if (!pending || pending === 0) return null;
  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="relative inline-flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/50"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          Storage Centre: Pending approvals
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="text-2xl font-bold">{pending}</div>
        <Link to="/storage-centre">
          <Button>Open Storage Centre</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
