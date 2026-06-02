import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Github, Database, Download, ExternalLink, HardDrive, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

const GITHUB_REPO_KEY = 'backup_github_repo_url';
const SUPABASE_PROJECT_REF = 'cavrkwzwlgrstddykpsu';

export const BackupStatusPanel: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState<string>(() => localStorage.getItem(GITHUB_REPO_KEY) || '');
  const [editing, setEditing] = useState(false);
  const [draftUrl, setDraftUrl] = useState(repoUrl);
  const [exporting, setExporting] = useState(false);
  const [lastExportAt, setLastExportAt] = useState<string | null>(() => localStorage.getItem('backup_last_export_at'));

  const saveRepo = () => {
    const trimmed = draftUrl.trim();
    if (trimmed && !/^https?:\/\/(www\.)?github\.com\//i.test(trimmed)) {
      toast.error('Please enter a valid GitHub repository URL');
      return;
    }
    localStorage.setItem(GITHUB_REPO_KEY, trimmed);
    setRepoUrl(trimmed);
    setEditing(false);
    toast.success('GitHub repository link saved');
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-storage-centre');
      if (error) throw error;

      // The edge function returns a file (binary or json). Fallback: stringify.
      const blob = data instanceof Blob ? data : new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jiejie-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      const now = new Date().toISOString();
      localStorage.setItem('backup_last_export_at', now);
      setLastExportAt(now);
      toast.success('Backup export downloaded');
    } catch (err: any) {
      toast.error(err?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const supabaseBackupsUrl = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/database/backups/scheduled`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Backup Status
        </h2>
        <p className="text-muted-foreground">Track your 3-way backup: GitHub code, Supabase database, and local exports.</p>
      </div>

      {/* GitHub */}
      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" /> GitHub (Code Backup)
          </CardTitle>
          <CardDescription>Every change in Lovable auto-pushes to your linked GitHub repository.</CardDescription>
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
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                No GitHub repository linked yet. Connect via Lovable editor: top-left project name → Settings → GitHub.
              </p>
              <Button size="sm" onClick={() => setEditing(true)}>Add repository URL</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supabase */}
      <Card className="card-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" /> Supabase (Database Backup)
          </CardTitle>
          <CardDescription>Supabase automatically runs scheduled database backups. Check the dashboard for the latest backup date.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <a href={supabaseBackupsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
              View Supabase backups <ExternalLink className="h-4 w-4" />
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
          <Button onClick={handleExport} disabled={exporting} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {exporting ? 'Exporting…' : 'Download backup'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupStatusPanel;
