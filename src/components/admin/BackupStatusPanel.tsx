import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Github, Database, Download, ExternalLink, HardDrive, ShieldCheck, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { exportDocumentsWithFiles } from '@/lib/exportStorageCentre';
import JSZip from 'jszip';

const DB_SNAPSHOT_TABLES = [
  'profiles', 'user_roles', 'organizations', 'organization_members',
  'employee_invitations', 'leave_types', 'leave_allocations', 'leave_balances',
  'leave_requests', 'employee_work_schedules', 'employee_recurring_allowances',
  'public_holidays', 'cash_transactions', 'payroll_records', 'payroll_line_items',
  'payroll_notifications', 'tasks', 'chat_messages', 'document_storage',
  'document_comments', 'profile_documents', 'profile_change_requests',
  'system_settings', 'subscription_pricing', 'audit_logs', 'device_tokens',
] as const;

const GITHUB_REPO_KEY = 'backup_github_repo_url';
const GITHUB_CONNECTED_KEY = 'backup_github_connected';
const SUPABASE_PROJECT_REF = 'cavrkwzwlgrstddykpsu';

export const BackupStatusPanel: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState<string>(() => localStorage.getItem(GITHUB_REPO_KEY) || '');
  const [githubConnected, setGithubConnected] = useState<boolean>(() => localStorage.getItem(GITHUB_CONNECTED_KEY) === 'true');
  const [editing, setEditing] = useState(false);
  const [draftUrl, setDraftUrl] = useState(repoUrl);
  const [exporting, setExporting] = useState(false);
  const [snapshotting, setSnapshotting] = useState(false);
  const [lastExportAt, setLastExportAt] = useState<string | null>(() => localStorage.getItem('backup_last_export_at'));
  const [lastSnapshotAt, setLastSnapshotAt] = useState<string | null>(() => localStorage.getItem('backup_last_snapshot_at'));

  const markGithubConnected = () => {
    localStorage.setItem(GITHUB_CONNECTED_KEY, 'true');
    setGithubConnected(true);
    toast.success('GitHub backup marked as connected');
  };

  const saveRepo = () => {
    const trimmed = draftUrl.trim();
    if (trimmed && !/^https?:\/\/(www\.)?github\.com\//i.test(trimmed)) {
      toast.error('Please enter a valid GitHub repository URL');
      return;
    }
    localStorage.setItem(GITHUB_REPO_KEY, trimmed);
    setRepoUrl(trimmed);
    setEditing(false);
    if (trimmed) {
      localStorage.setItem(GITHUB_CONNECTED_KEY, 'true');
      setGithubConnected(true);
    }
    toast.success('GitHub repository link saved');
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Fetch all active documents
      const { data: documents, error } = await supabase
        .from('document_storage')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!documents || documents.length === 0) {
        toast.info('No documents to export yet.');
        return;
      }

      // Enrich with profile info (employee name + id)
      const userIds = [...new Set(documents.map((d: any) => d.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, employee_id')
        .in('user_id', userIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      const enriched = documents.map((doc: any) => ({
        ...doc,
        user: profileMap.get(doc.user_id),
      }));

      await exportDocumentsWithFiles(enriched as any);

      const now = new Date().toISOString();
      localStorage.setItem('backup_last_export_at', now);
      setLastExportAt(now);
    } catch (err: any) {
      toast.error(err?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const supabaseBackupsUrl = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/database/backups/scheduled`;

  const overallHealthy = githubConnected;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Backup Status
        </h2>
        <p className="text-muted-foreground">Track your 3-way backup: GitHub code, Supabase database, and local exports.</p>
      </div>

      {/* Overall Status Summary */}
      <Card className="card-glass border-l-4 border-l-primary">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${overallHealthy ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}>
                {overallHealthy ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {overallHealthy ? 'GitHub Connected' : 'Backup Setup Incomplete'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {overallHealthy
                    ? 'Code backup is active. Complete the remaining steps below.'
                    : 'Finish connecting your backups for full protection.'}
                </p>
              </div>
            </div>
            <Badge variant={overallHealthy ? 'default' : 'secondary'} className={overallHealthy ? 'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20' : ''}>
              {overallHealthy ? '1 of 3 active' : '0 of 3 active'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* GitHub */}
      <Card className="card-glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" /> GitHub (Code Backup)
            </CardTitle>
            {githubConnected && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
              </Badge>
            )}
          </div>
          <CardDescription>
            Every change in Lovable auto-pushes to your linked GitHub repository.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {editing ? (
            <div className="space-y-2">
              <Label htmlFor="repo-url">Repository URL</Label>
              <Input
                id="repo-url"
                placeholder="https://github.com/your-org/your-repo"
                value={draftUrl}
                onChange={(e) => setDraftUrl(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveRepo}>Save</Button>
                <Button size="sm" variant="outline" onClick={() => { setDraftUrl(repoUrl); setEditing(false); }}>Cancel</Button>
              </div>
            </div>
          ) : repoUrl ? (
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 break-all"
              >
                {repoUrl} <ExternalLink className="h-4 w-4 shrink-0" />
              </a>
              <Button size="sm" variant="outline" onClick={() => { setDraftUrl(repoUrl); setEditing(true); }}>Edit</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/40 p-3 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">You've connected GitHub in Lovable!</p>
                  <p>Paste your repository URL below so your team can quickly access it from this panel.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setEditing(true)}>Add repository URL</Button>
                <Button size="sm" variant="outline" onClick={markGithubConnected}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Mark as done
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supabase */}
      <Card className="card-glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" /> Supabase (Database Backup)
            </CardTitle>
            <Badge variant="outline" className="text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" /> Auto
            </Badge>
          </div>
          <CardDescription>
            Supabase automatically runs scheduled database backups daily. Verify your backup schedule is active.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong className="text-foreground">Next step:</strong> Open your Supabase dashboard to confirm scheduled backups are enabled.</p>
            <p>Backups run automatically — no action needed unless you want to verify or restore.</p>
          </div>
          <Button asChild variant="outline">
            <a href={supabaseBackupsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Open Supabase Backups <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Local export */}
      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" /> Local Export
          </CardTitle>
          <CardDescription>
            Download a snapshot of your data for offline backup (Mac, external drive, etc.).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Last local export:{' '}
            <span className="font-medium text-foreground">
              {lastExportAt ? format(new Date(lastExportAt), 'PPpp') : 'Never'}
            </span>
          </p>
          <div className="text-sm text-muted-foreground">
            <p><strong className="text-foreground">Recommended:</strong> Export once a week and save to your Mac or an external drive.</p>
          </div>
          <Button onClick={handleExport} disabled={exporting} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting…' : 'Download backup now'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupStatusPanel;
