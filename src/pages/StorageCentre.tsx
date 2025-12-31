import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { DocumentFilters } from '@/components/storage/DocumentFilters';
import { DocumentCard } from '@/components/storage/DocumentCard';
import { DocumentDetailsModal } from '@/components/storage/DocumentDetailsModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  useStorageCentreDocuments, 
  useApproveReplacement, 
  useRejectReplacement,
  useSoftDeleteDocument,
  useRestoreDocument,
  DocumentFilters as Filters 
} from '@/hooks/useStorageCentre';
import { Download, Loader2, FileText, Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import { exportDocumentList, exportDocumentsWithFiles } from '@/lib/exportStorageCentre';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function StorageCentre() {
  const { userRole } = useAuth();
  const { t } = useLanguage();
  const [filters, setFilters] = useState<Filters>({});
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [selectedDocForDetails, setSelectedDocForDetails] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [deletionReason, setDeletionReason] = useState('');
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);

  const { data: documents, isLoading } = useStorageCentreDocuments(filters);
  const approveMutation = useApproveReplacement();
  const rejectMutation = useRejectReplacement();
  const deleteMutation = useSoftDeleteDocument();
  const restoreMutation = useRestoreDocument();

  const isAdmin = userRole === 'administrator';
  const isHrAdmin = userRole === 'hr_admin';
  const canApprove = isAdmin || isHrAdmin;
  const canDelete = isAdmin;

  const handleExport = () => {
    if (documents) {
      exportDocumentList(documents);
    }
  };

  const handleExportWithFiles = async () => {
    if (documents) {
      setExportProgress({ current: 0, total: documents.length });
      await exportDocumentsWithFiles(documents, (current, total) => {
        setExportProgress({ current, total });
      });
      setExportProgress(null);
    }
  };

  const handleApprove = (docId: string) => {
    approveMutation.mutate({ docId });
  };

  const handleReject = () => {
    if (selectedDoc && rejectionReason.trim()) {
      rejectMutation.mutate(
        { docId: selectedDoc, reason: rejectionReason },
        {
          onSuccess: () => {
            setShowRejectDialog(false);
            setRejectionReason('');
            setSelectedDoc(null);
          }
        }
      );
    }
  };

  const handleDelete = () => {
    if (selectedDoc) {
      deleteMutation.mutate(
        { docId: selectedDoc, reason: deletionReason },
        {
          onSuccess: () => {
            setShowDeleteDialog(false);
            setDeletionReason('');
            setSelectedDoc(null);
          }
        }
      );
    }
  };

  const handleRestore = (docId: string) => {
    restoreMutation.mutate(docId);
  };

  // Filter documents based on showDeleted toggle
  const filteredDocs = documents?.filter(doc => showDeleted ? doc.deleted_at !== null : doc.deleted_at === null) || [];

  // Group documents by employee
  const documentsByEmployee = filteredDocs?.reduce((acc, doc) => {
    const employeeName = doc.user 
      ? `${doc.user.first_name} ${doc.user.last_name} (${doc.user.employee_id})`
      : 'Unknown Employee';
    if (!acc[employeeName]) {
      acc[employeeName] = [];
    }
    acc[employeeName].push(doc);
    return acc;
  }, {} as Record<string, any[]>);

  // Statistics
  const stats = {
    total: documents?.filter(d => !d.deleted_at).length || 0,
    pendingApproval: documents?.filter(d => d.replacement_status === 'pending_approval' && !d.deleted_at).length || 0,
    rejected: documents?.filter(d => d.replacement_status === 'rejected' && !d.deleted_at).length || 0,
    active: documents?.filter(d => d.replacement_status === 'active' && !d.deleted_at).length || 0,
    deleted: documents?.filter(d => d.deleted_at !== null).length || 0
  };

  if (!canApprove) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            {t('noPermissionStorageCentre')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto safe-area-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('storageCentreTitle')}</h1>
          <p className="text-muted-foreground">
            {t('storageCentreDescription')}
          </p>
        </div>
        <div className="flex gap-2">
          {canDelete && (
            <Button
              variant={showDeleted ? "default" : "outline"}
              onClick={() => setShowDeleted(!showDeleted)}
            >
              {showDeleted ? t('showActive') : `${t('showDeleted')} (${stats.deleted})`}
            </Button>
          )}
          <Button 
            onClick={handleExport} 
            disabled={!filteredDocs?.length}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            {t('exportCSV')}
          </Button>
          <Button 
            onClick={handleExportWithFiles} 
            disabled={!filteredDocs?.length || !!exportProgress}
          >
            {exportProgress ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('exporting')} ({exportProgress.current}/{exportProgress.total})
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                {t('exportWithFiles')}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              {t('totalDocuments')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-blue-600" />
              {t('pendingApprovalDocs')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pendingApproval}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              {t('activeDocs')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <XCircle className="h-4 w-4 mr-2 text-red-600" />
              {t('rejectedDocs')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <DocumentFilters filters={filters} onFiltersChange={setFilters} />

      {/* Documents List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !documentsByEmployee || Object.keys(documentsByEmployee).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('noDocumentsFound')}</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {Object.entries(documentsByEmployee).map(([employeeName, docs]: [string, any[]]) => (
            <AccordionItem key={employeeName} value={employeeName} className="border rounded-lg">
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <span className="font-semibold">{employeeName}</span>
                  <span className="text-sm text-muted-foreground">
                    {docs.length} document{docs.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {docs.map((doc: any) => (
                    <div key={doc.id} className="relative">
                      <DocumentCard
                        document={doc}
                        onView={() => window.open(doc.file_path, '_blank')}
                        onApprove={() => handleApprove(doc.id)}
                        onReject={() => {
                          setSelectedDoc(doc.id);
                          setShowRejectDialog(true);
                        }}
                        onDelete={() => {
                          setSelectedDoc(doc.id);
                          setShowDeleteDialog(true);
                        }}
                        onViewDetails={() => {
                          setSelectedDocForDetails(doc);
                          setShowDetailsModal(true);
                        }}
                        canApprove={canApprove}
                        canDelete={canDelete}
                      />
                      {doc.deleted_at && canDelete && (
                        <div className="absolute top-2 right-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleRestore(doc.id)}
                            disabled={restoreMutation.isPending}
                          >
                            Restore
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rejectDocument')}</DialogTitle>
            <DialogDescription>
              {t('rejectDocumentDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">{t('rejectionReasonRequired')}</Label>
              <Textarea
                id="rejection-reason"
                placeholder={t('explainRejection')}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              {t('cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim() || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('rejecting')}
                </>
              ) : (
                t('rejectDocument')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Details Modal with Comments */}
      <DocumentDetailsModal
        document={selectedDocForDetails}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
      />

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteDocumentTitle')}</DialogTitle>
            <DialogDescription>
              {t('deleteDocumentDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deletion-reason">{t('deletionReasonOptional')}</Label>
              <Textarea
                id="deletion-reason"
                placeholder={t('explainDeletion')}
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t('cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('deleting')}
                </>
              ) : (
                t('delete')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
