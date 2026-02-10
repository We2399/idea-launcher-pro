import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Upload } from 'lucide-react';
import { useAllMissingDocuments } from '@/hooks/useMissingDocuments';
import { Link } from 'react-router-dom';

export function AdminMissingDocumentsCard() {
  const { data: missingDocs } = useAllMissingDocuments();

  if (!missingDocs || missingDocs.length === 0) return null;

  // Group by user
  const byUser = new Map<string, { userName: string; docs: string[] }>();
  missingDocs.forEach(d => {
    if (!byUser.has(d.userId)) byUser.set(d.userId, { userName: d.userName, docs: [] });
    byUser.get(d.userId)!.docs.push(d.label);
  });

  return (
    <Alert variant="destructive" className="border-destructive/50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Missing Employee Documents
        <Badge variant="destructive" className="ml-1">{missingDocs.length}</Badge>
      </AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2">
          {Array.from(byUser.entries()).map(([userId, { userName, docs }]) => (
            <div key={userId} className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">{userName || 'Unknown'}</span>
                <span className="text-muted-foreground ml-2">— missing: {docs.join(', ')}</span>
              </div>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}
