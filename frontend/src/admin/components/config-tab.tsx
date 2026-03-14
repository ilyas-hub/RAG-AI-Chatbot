import { useEffect, useState } from 'react';
import { Save, RefreshCw, Zap, Shield, MessageSquare, Bot, AlertTriangle, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useConfig, useUpdateConfig, useReindex, useTestModel } from '../hooks';
import { ModelSelector } from './model-selector';
import { OPENROUTER_MODELS } from '../models';

export function ConfigTab() {
  const { data: config, isLoading } = useConfig();
  const updateConfig = useUpdateConfig();
  const reindex = useReindex();

  const [form, setForm] = useState({
    isEnabled: true,
    welcomeMessage: '',
    fallbackMessage: '',
    primaryModel: '',
    fallbackModel: '',
    temperature: 0.3,
    maxTokens: 1024,
    rateLimitPerMinute: 20,
    allowAnonymous: true,
    enableFeedback: true,
    customInstructions: '',
  });

  useEffect(() => {
    if (config) {
      setForm({
        isEnabled: config.isEnabled,
        welcomeMessage: config.welcomeMessage,
        fallbackMessage: config.fallbackMessage,
        primaryModel: config.primaryModel,
        fallbackModel: config.fallbackModel,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        rateLimitPerMinute: config.rateLimitPerMinute,
        allowAnonymous: config.allowAnonymous,
        enableFeedback: config.enableFeedback,
        customInstructions: config.customInstructions || '',
      });
    }
  }, [config]);

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateConfig.mutate(form, {
      onSuccess: () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      },
      onError: (err) => alert(`Save failed: ${err.message}`),
    });
  };

  const handleReindex = () => {
    if (!window.confirm('Re-index all FAQs and documents? This may take a while.')) return;
    reindex.mutate(undefined, {
      onSuccess: (res) => alert(`Re-indexed ${res.faqs} FAQs and ${res.documents} documents`),
      onError: (err) => alert(`Re-index failed: ${err.message}`),
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading configuration...</div>;
  }

  const inputClass = 'w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 transition-colors';

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Settings</h2>
          <p className="text-sm text-muted-foreground">Configure your chatbot behavior and models</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReindex}
            disabled={reindex.isPending}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/60 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${reindex.isPending ? 'animate-spin' : ''}`} />
            {reindex.isPending ? 'Re-indexing...' : 'Re-index All'}
          </button>
          <button
            onClick={handleSave}
            disabled={updateConfig.isPending}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-md transition-all ${
              saved
                ? 'bg-green-500'
                : 'bg-gradient-to-r from-indigo-500 to-violet-500 hover:shadow-lg'
            } disabled:opacity-50 cursor-pointer`}
          >
            <Save className="h-3.5 w-3.5" />
            {saved ? 'Saved!' : updateConfig.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* General */}
      <Section icon={Zap} title="General">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <Toggle label="Chatbot Enabled" checked={form.isEnabled} onChange={(v) => setForm({ ...form, isEnabled: v })} />
          <Toggle label="Allow Anonymous" checked={form.allowAnonymous} onChange={(v) => setForm({ ...form, allowAnonymous: v })} />
          <Toggle label="Enable Feedback" checked={form.enableFeedback} onChange={(v) => setForm({ ...form, enableFeedback: v })} />
        </div>
      </Section>

      {/* Messages */}
      <Section icon={MessageSquare} title="Messages">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Welcome Message</label>
            <textarea
              value={form.welcomeMessage}
              onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
              rows={2}
              className={`${inputClass} mt-1 resize-none`}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Fallback Message</label>
            <p className="text-xs text-muted-foreground mb-1">Shown when all LLM providers fail</p>
            <textarea
              value={form.fallbackMessage}
              onChange={(e) => setForm({ ...form, fallbackMessage: e.target.value })}
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </Section>

      {/* Models */}
      <Section icon={Bot} title="AI Models">
        <div className="space-y-4">
          <PaidModelWarning primaryModel={form.primaryModel} fallbackModel={form.fallbackModel} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <ModelSelector
                label="Primary Model"
                value={form.primaryModel}
                onChange={(v) => setForm({ ...form, primaryModel: v })}
              />
              <TestModelButton modelId={form.primaryModel} />
            </div>
            <div className="space-y-2">
              <ModelSelector
                label="Fallback Model"
                value={form.fallbackModel}
                onChange={(v) => setForm({ ...form, fallbackModel: v })}
              />
              <TestModelButton modelId={form.fallbackModel} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Temperature</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                  className="flex-1 accent-indigo-500"
                />
                <span className="w-10 text-center text-sm font-mono bg-muted rounded px-1.5 py-0.5">
                  {form.temperature.toFixed(1)}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Max Tokens</label>
              <input
                type="number"
                min={64}
                max={4096}
                value={form.maxTokens}
                onChange={(e) => setForm({ ...form, maxTokens: parseInt(e.target.value) || 1024 })}
                className={`${inputClass} mt-1`}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Rate Limit /min</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={form.rateLimitPerMinute}
                onChange={(e) => setForm({ ...form, rateLimitPerMinute: parseInt(e.target.value) || 20 })}
                className={`${inputClass} mt-1`}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Custom Instructions */}
      <Section icon={Shield} title="Custom Instructions">
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            Additional instructions injected into the system prompt. Use this to customize the chatbot's persona or behavior.
          </p>
          <textarea
            value={form.customInstructions}
            onChange={(e) => setForm({ ...form, customInstructions: e.target.value })}
            rows={5}
            className={`${inputClass} resize-none font-mono text-xs`}
            placeholder="e.g. Always respond in a professional tone. Focus on product-related questions."
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {form.customInstructions.length} / 5000
          </p>
        </div>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-indigo-500" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function PaidModelWarning({ primaryModel, fallbackModel }: { primaryModel: string; fallbackModel: string }) {
  const hasPaid = [primaryModel, fallbackModel].some((id) => {
    const model = OPENROUTER_MODELS.find((m) => m.id === id);
    return model && model.tier !== 'free';
  });

  if (!hasPaid) return null;

  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
      <span>
        One or more selected models requires paid credits on OpenRouter. Ensure your API key has sufficient balance, or the model will fail at runtime. Use the "Test" button below to verify.
      </span>
    </div>
  );
}

function TestModelButton({ modelId }: { modelId: string }) {
  const testModel = useTestModel();
  const [result, setResult] = useState<{ success: boolean; responseTime: number; error?: string } | null>(null);

  const handleTest = () => {
    if (!modelId) return;
    setResult(null);
    testModel.mutate(modelId, {
      onSuccess: (data) => setResult(data),
      onError: (err) => setResult({ success: false, responseTime: 0, error: err.message }),
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleTest}
        disabled={!modelId || testModel.isPending}
        className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/60 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {testModel.isPending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Play className="h-3 w-3" />
        )}
        {testModel.isPending ? 'Testing...' : 'Test'}
      </button>
      {result && (
        <span className={`flex items-center gap-1 text-xs ${result.success ? 'text-green-600' : 'text-red-500'}`}>
          {result.success ? (
            <>
              <CheckCircle className="h-3 w-3" />
              OK ({result.responseTime}ms)
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3" />
              {result.error}
            </>
          )}
        </span>
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          checked ? 'bg-indigo-500' : 'bg-muted-foreground/20'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`}
        />
      </button>
      <span className="text-sm">{label}</span>
    </label>
  );
}
