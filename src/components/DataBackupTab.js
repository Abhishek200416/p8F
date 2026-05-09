import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Database, HardDrive, Download, Trash2, RotateCcw,
  Loader2, RefreshCw, FolderArchive, Shield, Clock,
  CheckCircle2, AlertTriangle, FileDown, Play, CloudUpload,
  ChevronDown, ChevronRight, Info, Lock, Server, Layers, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';

export default function DataBackupTab({ headers, API }) {
  const [backups, setBackups] = useState([]);
  const [storageInfo, setStorageInfo] = useState(null);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [backupLabel, setBackupLabel] = useState('');
  const [confirmRestore, setConfirmRestore] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [expandedBackup, setExpandedBackup] = useState(null);
  const [showCollections, setShowCollections] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState('');

  const fetchAll = useCallback(async () => {
    try {
      const [backupRes, storageRes, collRes] = await Promise.all([
        axios.get(`${API}/admin/backup/list`, { headers }),
        axios.get(`${API}/admin/backup/storage-info`, { headers }),
        axios.get(`${API}/admin/backup/collections`, { headers })
      ]);
      setBackups(backupRes.data.backups || []);
      setStorageInfo(storageRes.data);
      setCollections(collRes.data.collections || []);
    } catch (err) {
      console.error('Failed to load backup data:', err);
      toast.error('Failed to load backup data');
    } finally {
      setLoading(false);
    }
  }, [API, headers]);

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await axios.post(`${API}/admin/backup/create`,
        { label: backupLabel || 'Manual Backup' },
        { headers, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
      toast.success(`Backup created successfully — ${res.data.backup.collections} collections, ${res.data.backup.documents} documents`);
      setBackupLabel('');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Backup creation failed');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (backup) => {
    setRestoring(backup.id);
    try {
      const res = await axios.post(`${API}/admin/backup/restore/${backup.id}`, {}, { headers });
      toast.success(res.data.message || 'Backup restored successfully');
      setConfirmRestore(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Restore failed');
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (backup) => {
    setDeleting(backup.id);
    try {
      await axios.delete(`${API}/admin/backup/${backup.id}`, { headers });
      toast.success('Backup deleted');
      setConfirmDelete(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (backup) => {
    setDownloading(backup.id);
    try {
      const res = await axios.get(`${API}/admin/backup/download/${backup.id}`, {
        headers,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${backup.name}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Backup downloaded');
    } catch (err) {
      toast.error('Download failed');
    } finally {
      setDownloading(null);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.zip')) {
      toast.error('Only ZIP files are accepted');
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error('File too large. Max 500MB for ZIP upload.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('label', uploadLabel || `Uploaded: ${file.name}`);
      const res = await axios.post(`${API}/admin/backup/upload`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`Backup uploaded — ${res.data.backup.collections} collections, ${res.data.backup.documents} documents`);
      setUploadLabel('');
      e.target.value = '';
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20" data-testid="backup-loading">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-600 opacity-20" />
            <Database className="w-5 h-5 text-cyan-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600/40 animate-pulse">Loading Backup System</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="data-backup-tab">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-14 md:top-0 bg-background/95 backdrop-blur-md z-30 py-4 -mx-1 px-1 border-b border-border/5">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-500" /> Data <span className="text-cyan-500">Backup</span>
          </h2>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Secure your platform data</p>
        </div>
        <Button
          onClick={fetchAll}
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
          data-testid="refresh-backup-btn"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </Button>
      </div>

      {/* Storage Overview Cards */}
      {storageInfo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" data-testid="storage-overview">
          <Card className="border-border/10 bg-cyan-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-3.5 h-3.5 text-cyan-500" />
                <p className="text-[9px] font-black tracking-widest text-cyan-600 uppercase">Database</p>
              </div>
              <p className="text-lg font-black text-cyan-600" data-testid="db-size">{storageInfo.database_size}</p>
              <p className="text-[9px] text-muted-foreground font-bold mt-1">{storageInfo.collections_count} collections | {storageInfo.documents_count} docs</p>
            </CardContent>
          </Card>

          <Card className="border-border/10 bg-violet-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <FolderArchive className="w-3.5 h-3.5 text-violet-500" />
                <p className="text-[9px] font-black tracking-widest text-violet-600 uppercase">Backups</p>
              </div>
              <p className="text-lg font-black text-violet-600" data-testid="backup-storage">{storageInfo.backup_storage}</p>
              <p className="text-[9px] text-muted-foreground font-bold mt-1">{storageInfo.backup_count} backup(s) stored</p>
            </CardContent>
          </Card>

          <Card className="border-border/10 bg-emerald-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
                <p className="text-[9px] font-black tracking-widest text-emerald-600 uppercase">Disk Free</p>
              </div>
              <p className="text-lg font-black text-emerald-600" data-testid="disk-free">{storageInfo.disk_free}</p>
              <p className="text-[9px] text-muted-foreground font-bold mt-1">of {storageInfo.disk_total} total</p>
            </CardContent>
          </Card>

          <Card className="border-border/10 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-3.5 h-3.5 text-amber-500" />
                <p className="text-[9px] font-black tracking-widest text-amber-600 uppercase">Disk Usage</p>
              </div>
              <p className="text-lg font-black text-amber-600" data-testid="disk-usage">{storageInfo.disk_usage_percent}%</p>
              <Progress value={storageInfo.disk_usage_percent} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Backup Section */}
      <Card className="border-border/10 overflow-hidden rounded-2xl shadow-lg" data-testid="create-backup-card">
        <CardHeader className="bg-gradient-to-r from-cyan-500/10 to-violet-500/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-500">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-tight">Create New Backup</CardTitle>
              <p className="text-[10px] text-muted-foreground font-bold mt-0.5">Exports all collections as JSON files</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Backup Label (optional)</Label>
              <Input
                value={backupLabel}
                onChange={(e) => setBackupLabel(e.target.value)}
                placeholder="e.g. Pre-deployment backup, Weekly backup..."
                className="h-11 rounded-xl text-xs font-medium bg-muted/20 border-border/10"
                data-testid="backup-label-input"
              />
            </div>
            <Button
              onClick={handleCreateBackup}
              disabled={creating}
              className="h-11 px-8 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg shadow-cyan-600/20 shrink-0 self-end"
              data-testid="create-backup-btn"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {creating ? 'Creating...' : 'Create Backup'}
            </Button>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                Backup includes all database collections (users, bookings, chats, settings, etc.). 
                Each backup stores ~{storageInfo ? storageInfo.database_size : 'N/A'} of data. 
                Backups are stored locally and can be downloaded as ZIP files for cloud storage.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Backup Section */}
      <Card className="border-border/10 overflow-hidden rounded-2xl shadow-lg" data-testid="upload-backup-card">
        <CardHeader className="bg-gradient-to-r from-violet-500/10 to-pink-500/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/20 flex items-center justify-center text-violet-500">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-tight">Upload Backup</CardTitle>
              <p className="text-[10px] text-muted-foreground font-bold mt-0.5">Import a previously downloaded backup ZIP file</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-3">
              <div>
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Label (optional)</Label>
                <Input
                  value={uploadLabel}
                  onChange={(e) => setUploadLabel(e.target.value)}
                  placeholder="e.g. Production backup from Jan 2026..."
                  className="h-11 rounded-xl text-xs font-medium bg-muted/20 border-border/10"
                  data-testid="upload-label-input"
                />
              </div>
              <div>
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1.5 block">Backup ZIP File</Label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleUpload}
                    disabled={uploading}
                    className="block w-full text-xs font-medium file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-violet-500/10 file:text-violet-600 hover:file:bg-violet-500/20 file:cursor-pointer cursor-pointer file:transition-all rounded-xl bg-muted/20 border border-border/10 p-1"
                    data-testid="upload-file-input"
                  />
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl">
                      <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                      <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-violet-500">Uploading...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold text-violet-700 leading-relaxed">
                Upload a backup ZIP that was previously downloaded from this page. 
                The ZIP must contain JSON files (one per collection). Max file size: 500MB.
                After upload, you can use the Restore button to apply it to the database.
              </p>
            </div>
          </div>

          {/* Large Data Advisory */}
          <div className="mt-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 flex items-start gap-2.5">
            <HardDrive className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-1">For Large Databases (GB+)</p>
              <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
                If your data is in GB/TB range, use <span className="text-cyan-600 font-black">MongoDB Atlas</span> native backups instead. 
                Atlas provides continuous cloud backups, point-in-time recovery, and handles any data size automatically. 
                Use <code className="text-[9px] bg-muted/50 px-1 py-0.5 rounded">mongodump</code> / <code className="text-[9px] bg-muted/50 px-1 py-0.5 rounded">mongorestore</code> for streaming backup without ZIP overhead.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Collections Overview */}
      <Card className="border-border/10 rounded-2xl overflow-hidden" data-testid="collections-card">
        <button
          onClick={() => setShowCollections(!showCollections)}
          className="w-full flex items-center justify-between px-5 py-4 bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Layers className="w-4 h-4 text-violet-500" />
            <span className="text-xs font-black uppercase tracking-widest">Database Collections</span>
            <Badge className="text-[8px] font-black bg-violet-500/10 text-violet-600 border-none">{collections.length} total</Badge>
          </div>
          {showCollections ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showCollections && (
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {collections.map((c) => (
                <div key={c.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/5">
                  <span className="text-[10px] font-bold truncate">{c.name}</span>
                  <Badge className="text-[8px] font-black bg-muted/50 text-foreground/70 border-none ml-2 shrink-0">{c.documents}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Backup History */}
      <div data-testid="backup-history">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-xs font-black uppercase tracking-widest">Backup History</h3>
          <Badge className="text-[8px] font-black bg-muted/50 text-foreground/70 border-none">{backups.length} backups</Badge>
        </div>

        {backups.length === 0 ? (
          <Card className="border-border/10 rounded-2xl border-dashed" data-testid="no-backups">
            <CardContent className="py-16 text-center">
              <FolderArchive className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">No Backups Yet</p>
              <p className="text-[10px] text-muted-foreground/60 font-bold">Create your first backup to secure your platform data</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <Card key={backup.id} className="border-border/10 rounded-2xl overflow-hidden hover:shadow-lg transition-all" data-testid={`backup-item-${backup.id}`}>
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${backup.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : backup.status === 'uploaded' ? 'bg-violet-500/10 text-violet-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {backup.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : backup.status === 'uploaded' ? <Upload className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-black truncate">{backup.label || backup.name}</p>
                          <Badge className={`text-[7px] font-black border-none uppercase ${backup.status === 'uploaded' ? 'bg-violet-500/10 text-violet-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                            {backup.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-[9px] text-muted-foreground font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatDate(backup.created_at)}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-bold">
                            {backup.collections} collections | {backup.documents} docs
                          </span>
                          <span className="text-[9px] font-black text-cyan-600">{backup.size}</span>
                        </div>
                        {backup.created_by && (
                          <span className="text-[8px] text-muted-foreground/60 font-bold mt-0.5 block">
                            by {backup.created_by}
                          </span>
                        )}
                        {backup.last_restored && (
                          <span className="text-[8px] text-violet-500 font-bold mt-0.5 block">
                            Last restored: {formatDate(backup.last_restored)} ({backup.restore_count || 1}x)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-auto sm:ml-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest gap-1.5 border-cyan-500/20 text-cyan-600 hover:bg-cyan-500 hover:text-white transition-all"
                        onClick={() => handleDownload(backup)}
                        disabled={downloading === backup.id}
                        data-testid={`download-backup-${backup.id}`}
                      >
                        {downloading === backup.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest gap-1.5 border-violet-500/20 text-violet-600 hover:bg-violet-500 hover:text-white transition-all"
                        onClick={() => setConfirmRestore(backup)}
                        disabled={restoring === backup.id}
                        data-testid={`restore-backup-${backup.id}`}
                      >
                        {restoring === backup.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 px-3 rounded-xl text-[9px] font-black uppercase tracking-widest gap-1.5 border-rose-500/20 text-rose-600 hover:bg-rose-500 hover:text-white transition-all"
                        onClick={() => setConfirmDelete(backup)}
                        disabled={deleting === backup.id}
                        data-testid={`delete-backup-${backup.id}`}
                      >
                        {deleting === backup.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>

                  {/* Expandable collection details */}
                  {backup.collection_details && (
                    <div className="mt-3">
                      <button
                        onClick={() => setExpandedBackup(expandedBackup === backup.id ? null : backup.id)}
                        className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        {expandedBackup === backup.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        Collection Details
                      </button>
                      {expandedBackup === backup.id && (
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                          {Object.entries(backup.collection_details).map(([name, count]) => (
                            <div key={name} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/5">
                              <span className="text-[9px] font-bold truncate">{name}</span>
                              <span className="text-[8px] font-black text-muted-foreground ml-1">{count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Best Practices Info */}
      <Card className="border-border/10 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-violet-500/5">
        <CardContent className="p-5">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-600 mb-3 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" /> Backup Best Practices
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">Create a backup before any major changes or deployments</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">Download backups and store them in cloud storage (Google Drive, S3)</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">Schedule regular weekly backups to prevent data loss</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">Restoring a backup will overwrite current data — always backup first!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Size Guide */}
      <Card className="border-border/10 rounded-2xl overflow-hidden" data-testid="data-size-guide">
        <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-tight">Data Size Migration Guide</CardTitle>
              <p className="text-[10px] text-muted-foreground font-bold mt-0.5">Choose the right backup strategy based on your data size</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {/* What gets backed up */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/10">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground mb-2">What Data Gets Backed Up</h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Text Data', desc: 'Profiles, messages, bookings, reviews, settings', size: 'Smallest' },
                { label: 'Ratings & Reviews', desc: 'Star ratings, comments, moderation data', size: 'Small' },
                { label: 'Image URLs', desc: 'Profile pic URLs, verification photos (stored as links)', size: 'Small' },
                { label: 'Transaction Data', desc: 'Payments, diamonds, subscriptions, referrals', size: 'Medium' },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-lg bg-background border border-border/10">
                  <p className="text-[10px] font-black text-foreground">{item.label}</p>
                  <p className="text-[9px] text-muted-foreground font-medium mt-1 leading-relaxed">{item.desc}</p>
                  <Badge className="mt-2 text-[7px] font-black bg-emerald-500/10 text-emerald-600 border-none">{item.size}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Size-based recommendations */}
          <div className="space-y-3">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-500" /> Strategy by Data Size
            </h5>

            {/* KB - MB */}
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-emerald-600">KB-MB</span>
                  <span className="text-[7px] font-bold text-emerald-600/60">{"<100MB"}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black text-emerald-700">Use This Admin Panel</p>
                    <Badge className="text-[7px] font-black bg-emerald-500/20 text-emerald-600 border-none">CURRENT</Badge>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1 leading-relaxed">
                    Perfect for text-only data like profiles, bookings, chats, reviews, settings. 
                    Click "Create Backup" → Download ZIP → Upload to new server or MongoDB Atlas using "Upload Backup".
                    Typical PlusOneStar database with 1K-10K users fits in 10-50MB.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge className="text-[7px] bg-muted/50 text-foreground/70 border-none">One-click</Badge>
                    <Badge className="text-[7px] bg-muted/50 text-foreground/70 border-none">ZIP download</Badge>
                    <Badge className="text-[7px] bg-muted/50 text-foreground/70 border-none">UI upload</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* 100MB - 1GB */}
            <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl bg-cyan-500/20 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-cyan-600">100MB</span>
                  <span className="text-[7px] font-bold text-cyan-600/60">to 1GB</span>
                </div>
                <div>
                  <p className="text-xs font-black text-cyan-700">Use mongodump/mongorestore (CLI)</p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1 leading-relaxed">
                    When your data includes many images stored as base64 or large chat histories.
                    Run <code className="text-[9px] bg-muted/50 px-1 py-0.5 rounded">mongodump --uri="mongodb://..." --db=test_database --out=/backup</code> on your server.
                    Streams data without creating ZIP. Restore with <code className="text-[9px] bg-muted/50 px-1 py-0.5 rounded">mongorestore --uri="mongodb+srv://..." /backup/test_database</code>.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge className="text-[7px] bg-muted/50 text-foreground/70 border-none">Streaming</Badge>
                    <Badge className="text-[7px] bg-muted/50 text-foreground/70 border-none">No ZIP overhead</Badge>
                    <Badge className="text-[7px] bg-muted/50 text-foreground/70 border-none">CLI command</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* 1GB - 100GB */}
            <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl bg-violet-500/20 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-violet-600">1GB</span>
                  <span className="text-[7px] font-bold text-violet-600/60">to 100GB</span>
                </div>
                <div>
                  <p className="text-xs font-black text-violet-700">MongoDB Atlas + Cloud Backups</p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1 leading-relaxed">
                    When you have lots of video metadata, large image collections, or 100K+ users. 
                    Migrate to <span className="font-black text-violet-600">MongoDB Atlas</span> (free tier: 512MB, M10: up to 100GB).
                    Atlas provides automatic daily backups, point-in-time recovery, and cloud-to-cloud backup — no manual work.
                    Store actual media files (images/videos) on a CDN like Cloudinary or AWS S3 — only store URLs in the database.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge className="text-[7px] bg-muted/50 text-foreground/70 border-none">Auto daily backup</Badge>
                    <Badge className="text-[7px] bg-muted/50 text-foreground/70 border-none">Point-in-time</Badge>
                    <Badge className="text-[7px] bg-muted/50 text-foreground/70 border-none">CDN for media</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* TB+ / PB */}
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-amber-600">TB+</span>
                  <span className="text-[7px] font-bold text-amber-600/60">& PB</span>
                </div>
                <div>
                  <p className="text-xs font-black text-amber-700">Enterprise: Atlas Dedicated + Ops Manager</p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1 leading-relaxed">
                    For massive scale — millions of users, TB/PB of data. Use <span className="font-black text-amber-600">MongoDB Atlas Dedicated Clusters</span> (M30+) with 
                    continuous backup, queryable snapshots, and cross-region replication.
                    Media (videos, images) MUST be on object storage (S3/GCS) — never in the database.
                    Database only stores text, metadata, and URLs. Use sharding for horizontal scaling.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge className="text-[7px] bg-muted/50 text-foreground/70 border-none">Continuous backup</Badge>
                    <Badge className="text-[7px] bg-muted/50 text-foreground/70 border-none">Cross-region</Badge>
                    <Badge className="text-[7px] bg-muted/50 text-foreground/70 border-none">Sharding</Badge>
                    <Badge className="text-[7px] bg-muted/50 text-foreground/70 border-none">Object storage</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Takeaway */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/10">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-1">Key Takeaway</p>
                <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
                  Never store large media files (images, videos) directly in MongoDB. Always use a CDN/object storage (Cloudinary, AWS S3, Google Cloud Storage) 
                  and store only the URL in your database. This keeps your database small, fast, and easy to backup at any scale. 
                  Your current PlusOneStar database stores image URLs — this is the correct approach!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirm Restore Modal */}
      <Dialog open={!!confirmRestore} onOpenChange={(open) => !open && setConfirmRestore(null)}>
        <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-border/10">
          <div className="bg-violet-600 p-6 text-white">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
              <RotateCcw className="w-7 h-7" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Restore Backup</DialogTitle>
            <DialogDescription className="text-white/70 text-xs font-bold mt-1">
              This will replace ALL current data with the backup data
            </DialogDescription>
          </div>
          <div className="p-6 space-y-4">
            {confirmRestore && (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-muted/20 border border-border/10">
                  <p className="text-xs font-black">{confirmRestore.label || confirmRestore.name}</p>
                  <p className="text-[10px] text-muted-foreground font-bold mt-1">
                    {confirmRestore.collections} collections | {confirmRestore.documents} documents | {confirmRestore.size}
                  </p>
                  <p className="text-[9px] text-muted-foreground/60 font-bold mt-1">{formatDate(confirmRestore.created_at)}</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-rose-700 leading-relaxed">
                    Warning: This action will drop and recreate all collections. Current data will be permanently lost unless you have a recent backup.
                  </p>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl font-bold text-xs"
                onClick={() => setConfirmRestore(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-black text-xs uppercase tracking-widest gap-2"
                onClick={() => handleRestore(confirmRestore)}
                disabled={restoring}
                data-testid="confirm-restore-btn"
              >
                {restoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Restore Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Modal */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-border/10">
          <div className="bg-rose-600 p-6 text-white">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
              <Trash2 className="w-7 h-7" />
            </div>
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Delete Backup</DialogTitle>
            <DialogDescription className="text-white/70 text-xs font-bold mt-1">
              This will permanently remove the backup from disk
            </DialogDescription>
          </div>
          <div className="p-6 space-y-4">
            {confirmDelete && (
              <div className="p-4 rounded-xl bg-muted/20 border border-border/10">
                <p className="text-xs font-black">{confirmDelete.label || confirmDelete.name}</p>
                <p className="text-[10px] text-muted-foreground font-bold mt-1">{confirmDelete.size} | {formatDate(confirmDelete.created_at)}</p>
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl font-bold text-xs"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest gap-2"
                onClick={() => handleDelete(confirmDelete)}
                disabled={deleting}
                data-testid="confirm-delete-btn"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
