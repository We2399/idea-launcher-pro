import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Upload } from 'lucide-react';
import { useMissingDocuments } from '@/hooks/useMissingDocuments';
import { Link } from 'react-router-dom';

interface MissingDocumentsAlertProps {
  onScrollToDocuments?: () => void;
}

export function MissingDocumentsAlert({ onScrollToDocuments }: MissingDocumentsAlertProps) {
  const { data: missingDocs } = useMissingDocuments();

  if (!missingDocs || missingDocs.length === 0) return null;

  return (
    <Alert variant="destructive" className="border-destructive/50">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Required Documents Missing</AlertTitle>
      <AlertDescription>
        <div className="mt-1 space-y-1">
          <p className="text-sm">
            You must upload the following documents:
          </p>
          <ul className="list-disc list-inside text-sm space-y-0.5">
            {missingDocs.map(d => (
              <li key={d.documentType}>{d.label}</li>
            ))}
          </ul>
          <div className="flex gap-2 mt-2">
            {onScrollToDocuments ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onScrollToDocuments}
              >
                <Upload className="h-3 w-3 mr-1" />
                Go to Documents
              </Button>
            ) : (
              <Link to="/profile">
                <Button variant="outline" size="sm">
                  <Upload className="h-3 w-3 mr-1" />
                  Upload Documents
                </Button>
              </Link>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
