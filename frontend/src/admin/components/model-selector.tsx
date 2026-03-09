/**
 * Searchable model selector dropdown
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { OPENROUTER_MODELS, TIER_LABELS, TIER_COLORS, type ModelOption } from '../models';

interface ModelSelectorProps {
  value: string;
  onChange: (modelId: string) => void;
  label: string;
}

export function ModelSelector({ value, onChange, label }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const filtered = OPENROUTER_MODELS.filter((m) => {
    const matchSearch = !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase());
    const matchTier = !selectedTier || m.tier === selectedTier;
    return matchSearch && matchTier;
  });

  // Group by tier
  const grouped = filtered.reduce<Record<string, ModelOption[]>>((acc, m) => {
    (acc[m.tier] ??= []).push(m);
    return acc;
  }, {});

  const selected = OPENROUTER_MODELS.find((m) => m.id === value);

  return (
    <div ref={containerRef} className="relative">
      <label className="text-sm font-medium">{label}</label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mt-1 flex w-full items-center justify-between rounded-lg border bg-background px-3 py-2.5 text-sm text-left hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-colors"
      >
        {selected ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${TIER_COLORS[selected.tier]}`}>
              {selected.tier.toUpperCase()}
            </span>
            <span className="truncate">{selected.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{selected.promptPrice}/M</span>
          </div>
        ) : (
          <span className="text-muted-foreground truncate">{value || 'Select a model...'}</span>
        )}
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-background shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Search */}
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models..."
              className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Tier filters */}
          <div className="flex gap-1 px-3 py-2 border-b overflow-x-auto">
            <TierPill label="All" active={!selectedTier} onClick={() => setSelectedTier(null)} />
            {Object.entries(TIER_LABELS).map(([key, label]) => (
              <TierPill key={key} label={label} active={selectedTier === key} onClick={() => setSelectedTier(selectedTier === key ? null : key)} />
            ))}
          </div>

          {/* Model list */}
          <div className="max-h-64 overflow-y-auto py-1">
            {Object.keys(grouped).length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground text-center">No models found</p>
            ) : (
              Object.entries(grouped).map(([tier, models]) => (
                <div key={tier}>
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background">
                    {TIER_LABELS[tier]} ({models.length})
                  </p>
                  {models.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        onChange(m.id);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted/60 transition-colors ${
                        m.id === value ? 'bg-indigo-50 text-indigo-700' : ''
                      }`}
                    >
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${TIER_COLORS[m.tier]}`}>
                        {m.tier === 'free' ? 'FREE' : m.promptPrice}
                      </span>
                      <span className="flex-1 truncate">{m.name}</span>
                      <span className="shrink-0 text-[11px] text-muted-foreground font-mono">{m.promptPrice}/{m.completionPrice}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Custom model input */}
          <div className="border-t px-3 py-2">
            <p className="text-[10px] text-muted-foreground mb-1">Or enter a custom model ID:</p>
            <input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full rounded border bg-muted/30 px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
              placeholder="provider/model-name"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TierPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
        active
          ? 'bg-indigo-100 text-indigo-700'
          : 'bg-muted/60 text-muted-foreground hover:bg-muted'
      }`}
    >
      {label}
    </button>
  );
}
