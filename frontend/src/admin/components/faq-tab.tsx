import { useState } from 'react';
import { Plus, RefreshCw, Trash2, Pencil, Search } from 'lucide-react';
import { Button } from '@/lib/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/lib/ui/dialog';
import { useFaqs, useCreateFaq, useUpdateFaq, useDeleteFaq, useSyncFaqs, useKnowledgeBases } from '../hooks';
import type { FaqItem } from '../types';

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
};

export function FaqTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useFaqs();
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const deleteFaq = useDeleteFaq();
  const syncFaqs = useSyncFaqs();

  const handleCreate = () => {
    setEditingFaq(null);
    setDialogOpen(true);
  };

  const handleEdit = (faq: FaqItem) => {
    setEditingFaq(faq);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this FAQ? This will also remove it from Pinecone.')) return;
    deleteFaq.mutate(id);
  };

  const handleSync = () => {
    syncFaqs.mutate(undefined, {
      onSuccess: (res) => alert(`Synced ${res.synced} FAQs to Pinecone`),
      onError: (err) => alert(`Sync failed: ${err.message}`),
    });
  };

  const filteredFaqs = data?.faqs.filter((faq) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return faq.question.toLowerCase().includes(s) || faq.answer.toLowerCase().includes(s) || faq.category.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">FAQ Management</h2>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} total FAQs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSync}
            disabled={syncFaqs.isPending}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncFaqs.isPending ? 'animate-spin' : ''}`} />
            {syncFaqs.isPending ? 'Syncing...' : 'Sync to Pinecone'}
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New FAQ
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search FAQs..."
          className="w-full rounded-lg border bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-colors shadow-sm"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Loading...</div>
      ) : !filteredFaqs?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-sm">
            {search ? 'No FAQs match your search.' : 'No FAQs yet. Create one to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="group flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                    {faq.category}
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLE[faq.embeddingStatus]}`}>
                    {faq.embeddingStatus}
                  </span>
                  {!faq.isActive && (
                    <span className="rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">Inactive</span>
                  )}
                </div>
                <p className="text-sm font-medium leading-snug">{faq.question}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{faq.answer}</p>
                {faq.keywords.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {faq.keywords.map((kw) => (
                      <span key={kw} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{kw}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(faq)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDelete(faq.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <FaqDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        faq={editingFaq}
        onSubmit={async (formData) => {
          if (editingFaq) {
            await updateFaq.mutateAsync({ id: editingFaq.id, data: formData });
          } else {
            await createFaq.mutateAsync(formData as any);
          }
          setDialogOpen(false);
        }}
        isPending={createFaq.isPending || updateFaq.isPending}
      />
    </div>
  );
}

function FaqDialog({
  open, onClose, faq, onSubmit, isPending,
}: {
  open: boolean; onClose: () => void; faq: FaqItem | null;
  onSubmit: (data: Record<string, unknown>) => Promise<void>; isPending: boolean;
}) {
  const [category, setCategory] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [keywords, setKeywords] = useState('');
  const [kbId, setKbId] = useState('');
  const { data: kbs } = useKnowledgeBases();

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setCategory(faq?.category || '');
      setQuestion(faq?.question || '');
      setAnswer(faq?.answer || '');
      setKeywords(faq?.keywords?.join(', ') || '');
      setKbId(faq?.knowledgeBaseId || '');
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = { category, question, answer };
    if (keywords.trim()) data.keywords = keywords.split(',').map((k) => k.trim()).filter(Boolean);
    if (kbId) data.knowledgeBaseId = kbId;
    await onSubmit(data);
  };

  const inputClass = 'w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-colors';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{faq ? 'Edit FAQ' : 'New FAQ'}</DialogTitle>
          <DialogDescription>
            {faq ? 'Update this FAQ entry.' : 'Create a new FAQ. It will be auto-embedded to Pinecone.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} required className={`${inputClass} mt-1`} placeholder="e.g. billing, features" />
          </div>
          <div>
            <label className="text-sm font-medium">Question</label>
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)} required rows={2} className={`${inputClass} mt-1 resize-none`} />
          </div>
          <div>
            <label className="text-sm font-medium">Answer</label>
            <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} required rows={4} className={`${inputClass} mt-1 resize-none`} />
          </div>
          <div>
            <label className="text-sm font-medium">Keywords (comma-separated)</label>
            <input value={keywords} onChange={(e) => setKeywords(e.target.value)} className={`${inputClass} mt-1`} placeholder="price, plan, subscription" />
          </div>
          <div>
            <label className="text-sm font-medium">Knowledge Base (optional)</label>
            <select value={kbId} onChange={(e) => setKbId(e.target.value)} className={`${inputClass} mt-1`}>
              <option value="">None</option>
              {kbs?.map((kb) => <option key={kb.id} value={kb.id}>{kb.name}</option>)}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPending ? 'Saving...' : faq ? 'Update' : 'Create'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
