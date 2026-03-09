import { useState } from 'react';
import { Plus, Trash2, Upload, Database, FileText } from 'lucide-react';
import { Button } from '@/lib/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/lib/ui/dialog';
import { useKnowledgeBases, useCreateKB, useDeleteKB, useUploadDocument } from '../hooks';

export function KbTab() {
  const [createOpen, setCreateOpen] = useState(false);
  const [docDialogKbId, setDocDialogKbId] = useState<string | null>(null);

  const { data: kbs, isLoading } = useKnowledgeBases();
  const createKb = useCreateKB();
  const deleteKb = useDeleteKB();

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this knowledge base? All documents and vectors will be removed.')) return;
    deleteKb.mutate(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Knowledge Bases</h2>
          <p className="text-sm text-muted-foreground">Manage your document collections for RAG</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New Knowledge Base
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Loading...</div>
      ) : !kbs?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-3">
            <Database className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">No knowledge bases yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {kbs.map((kb) => (
            <div key={kb.id} className="rounded-xl border bg-white p-5 shadow-sm space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                    <Database className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{kb.name}</span>
                      {kb.isDefault && (
                        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">Default</span>
                      )}
                    </div>
                    {kb.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{kb.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(kb.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {kb._count.documents} docs
                </div>
                <span>{kb._count.faqContents} FAQs</span>
                <span className="font-mono text-[10px]">{kb.embeddingModel}</span>
              </div>

              <button
                onClick={() => setDocDialogKbId(kb.id)}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/60 transition-colors w-full justify-center cursor-pointer"
              >
                <Upload className="h-3 w-3" />
                Upload Document
              </button>
            </div>
          ))}
        </div>
      )}

      <CreateKbDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (data) => {
          await createKb.mutateAsync(data);
          setCreateOpen(false);
        }}
        isPending={createKb.isPending}
      />

      <UploadDocDialog
        open={!!docDialogKbId}
        kbId={docDialogKbId}
        onClose={() => setDocDialogKbId(null)}
      />
    </div>
  );
}

function CreateKbDialog({
  open, onClose, onSubmit, isPending,
}: {
  open: boolean; onClose: () => void;
  onSubmit: (data: { name: string; description?: string; isDefault?: boolean }) => Promise<void>;
  isPending: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) { setName(''); setDescription(''); setIsDefault(false); }
    else onClose();
  };

  const inputClass = 'w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-colors';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Knowledge Base</DialogTitle>
          <DialogDescription>Create a knowledge base to organize your documents and FAQs.</DialogDescription>
        </DialogHeader>
        <form onSubmit={async (e) => { e.preventDefault(); await onSubmit({ name, description: description || undefined, isDefault }); }} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={`${inputClass} mt-1`} />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputClass} mt-1 resize-none`} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="accent-indigo-500" />
            Set as default
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <button type="submit" disabled={isPending} className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer">
              {isPending ? 'Creating...' : 'Create'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UploadDocDialog({ open, kbId, onClose }: { open: boolean; kbId: string | null; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sourceType, setSourceType] = useState('MANUAL');
  const uploadDoc = useUploadDocument();

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) { setTitle(''); setContent(''); setSourceType('MANUAL'); }
    else onClose();
  };

  const inputClass = 'w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-colors';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>Add a document to the knowledge base. It will be chunked and embedded automatically.</DialogDescription>
        </DialogHeader>
        <form onSubmit={async (e) => { e.preventDefault(); if (!kbId) return; await uploadDoc.mutateAsync({ kbId, data: { title, content, sourceType } }); onClose(); }} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className={`${inputClass} mt-1`} />
          </div>
          <div>
            <label className="text-sm font-medium">Source Type</label>
            <select value={sourceType} onChange={(e) => setSourceType(e.target.value)} className={`${inputClass} mt-1`}>
              <option value="MANUAL">Manual</option>
              <option value="URL">URL</option>
              <option value="FILE_UPLOAD">File Upload</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Content</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={8} className={`${inputClass} mt-1 resize-none font-mono text-xs`} placeholder="Paste document content here..." />
            <p className="mt-1 text-xs text-muted-foreground text-right">{content.length} characters</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <button type="submit" disabled={uploadDoc.isPending} className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer">
              {uploadDoc.isPending ? 'Uploading...' : 'Upload'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
