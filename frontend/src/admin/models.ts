/** OpenRouter available models — curated list, no discontinued models */

export interface ModelOption {
  id: string;
  name: string;
  tier: 'free' | 'budget' | 'standard' | 'premium';
  promptPrice: string; // per 1M tokens
  completionPrice: string;
}

export const OPENROUTER_MODELS: ModelOption[] = [
  // Free
  { id: 'nvidia/nemotron-3-nano-30b-a3b:free', name: 'NVIDIA Nemotron 3 Nano 30B', tier: 'free', promptPrice: '$0', completionPrice: '$0' },
  { id: 'arcee-ai/trinity-large-preview:free', name: 'Arcee Trinity Large Preview', tier: 'free', promptPrice: '$0', completionPrice: '$0' },
  { id: 'arcee-ai/trinity-mini:free', name: 'Arcee Trinity Mini', tier: 'free', promptPrice: '$0', completionPrice: '$0' },
  { id: 'stepfun/step-3.5-flash:free', name: 'StepFun Step 3.5 Flash', tier: 'free', promptPrice: '$0', completionPrice: '$0' },
  { id: 'liquid/lfm-2.5-1.2b-instruct:free', name: 'LiquidAI LFM 2.5 1.2B Instruct', tier: 'free', promptPrice: '$0', completionPrice: '$0' },
  { id: 'liquid/lfm-2.5-1.2b-thinking:free', name: 'LiquidAI LFM 2.5 1.2B Thinking', tier: 'free', promptPrice: '$0', completionPrice: '$0' },

  // Budget (<$1/M)
  { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2', tier: 'budget', promptPrice: '$0.25', completionPrice: '$0.40' },
  { id: 'qwen/qwen3.5-flash-02-23', name: 'Qwen 3.5 Flash', tier: 'budget', promptPrice: '$0.10', completionPrice: '$0.40' },
  { id: 'mistralai/mistral-small-creative', name: 'Mistral Small Creative', tier: 'budget', promptPrice: '$0.10', completionPrice: '$0.30' },
  { id: 'mistralai/ministral-3b-2512', name: 'Mistral Ministral 3B', tier: 'budget', promptPrice: '$0.10', completionPrice: '$0.10' },
  { id: 'mistralai/ministral-8b-2512', name: 'Mistral Ministral 8B', tier: 'budget', promptPrice: '$0.15', completionPrice: '$0.15' },
  { id: 'mistralai/ministral-14b-2512', name: 'Mistral Ministral 14B', tier: 'budget', promptPrice: '$0.20', completionPrice: '$0.20' },
  { id: 'bytedance-seed/seed-2.0-mini', name: 'ByteDance Seed 2.0 Mini', tier: 'budget', promptPrice: '$0.10', completionPrice: '$0.40' },
  { id: 'bytedance-seed/seed-1.6-flash', name: 'ByteDance Seed 1.6 Flash', tier: 'budget', promptPrice: '$0.075', completionPrice: '$0.30' },
  { id: 'inception/mercury-2', name: 'Inception Mercury 2', tier: 'budget', promptPrice: '$0.25', completionPrice: '$0.75' },
  { id: 'nvidia/nemotron-3-nano-30b-a3b', name: 'NVIDIA Nemotron 3 Nano 30B', tier: 'budget', promptPrice: '$0.05', completionPrice: '$0.20' },
  { id: 'qwen/qwen3.5-27b', name: 'Qwen 3.5 27B', tier: 'budget', promptPrice: '$0.195', completionPrice: '$1.56' },
  { id: 'qwen/qwen3.5-122b-a10b', name: 'Qwen 3.5 122B (MoE)', tier: 'budget', promptPrice: '$0.26', completionPrice: '$2.08' },
  { id: 'qwen/qwen3.5-397b-a17b', name: 'Qwen 3.5 397B (MoE)', tier: 'budget', promptPrice: '$0.39', completionPrice: '$2.34' },
  { id: 'mistralai/mistral-large-2512', name: 'Mistral Large 3', tier: 'budget', promptPrice: '$0.50', completionPrice: '$1.50' },
  { id: 'mistralai/devstral-2512', name: 'Mistral Devstral 2', tier: 'budget', promptPrice: '$0.40', completionPrice: '$2.00' },
  { id: 'deepseek/deepseek-v3.2-speciale', name: 'DeepSeek V3.2 Speciale', tier: 'budget', promptPrice: '$0.40', completionPrice: '$1.20' },
  { id: 'moonshotai/kimi-k2.5', name: 'Moonshot Kimi K2.5', tier: 'budget', promptPrice: '$0.45', completionPrice: '$2.20' },
  { id: 'z-ai/glm-4.7-flash', name: 'GLM 4.7 Flash', tier: 'budget', promptPrice: '$0.06', completionPrice: '$0.40' },
  { id: 'z-ai/glm-4.7', name: 'GLM 4.7', tier: 'budget', promptPrice: '$0.38', completionPrice: '$1.98' },
  { id: 'z-ai/glm-5', name: 'GLM 5', tier: 'budget', promptPrice: '$0.80', completionPrice: '$2.56' },
  { id: 'minimax/minimax-m2.5', name: 'MiniMax M2.5', tier: 'budget', promptPrice: '$0.295', completionPrice: '$1.20' },
  { id: 'amazon/nova-2-lite-v1', name: 'Amazon Nova 2 Lite', tier: 'budget', promptPrice: '$0.30', completionPrice: '$2.50' },

  // Standard ($1-$5/M)
  { id: 'google/gemini-3-flash-preview', name: 'Google Gemini 3 Flash', tier: 'standard', promptPrice: '$0.50', completionPrice: '$3.00' },
  { id: 'google/gemini-3.1-pro-preview', name: 'Google Gemini 3.1 Pro', tier: 'standard', promptPrice: '$2.00', completionPrice: '$12.00' },
  { id: 'openai/gpt-5.2', name: 'OpenAI GPT-5.2', tier: 'standard', promptPrice: '$1.75', completionPrice: '$14.00' },
  { id: 'openai/gpt-5.2-chat', name: 'OpenAI GPT-5.2 Chat', tier: 'standard', promptPrice: '$1.75', completionPrice: '$14.00' },
  { id: 'openai/gpt-5.3-chat', name: 'OpenAI GPT-5.3 Chat', tier: 'standard', promptPrice: '$1.75', completionPrice: '$14.00' },
  { id: 'openai/gpt-5.4', name: 'OpenAI GPT-5.4', tier: 'standard', promptPrice: '$2.50', completionPrice: '$15.00' },
  { id: 'anthropic/claude-sonnet-4.6', name: 'Anthropic Claude Sonnet 4.6', tier: 'standard', promptPrice: '$3.00', completionPrice: '$15.00' },
  { id: 'anthropic/claude-opus-4.5', name: 'Anthropic Claude Opus 4.5', tier: 'standard', promptPrice: '$5.00', completionPrice: '$25.00' },
  { id: 'anthropic/claude-opus-4.6', name: 'Anthropic Claude Opus 4.6', tier: 'standard', promptPrice: '$5.00', completionPrice: '$25.00' },

  // Premium ($5+/M)
  { id: 'openai/gpt-5.2-pro', name: 'OpenAI GPT-5.2 Pro', tier: 'premium', promptPrice: '$21.00', completionPrice: '$168.00' },
  { id: 'openai/gpt-5.4-pro', name: 'OpenAI GPT-5.4 Pro', tier: 'premium', promptPrice: '$30.00', completionPrice: '$180.00' },
];

export const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  budget: 'Budget (<$1/M)',
  standard: 'Standard ($1-$5/M)',
  premium: 'Premium ($5+/M)',
};

export const TIER_COLORS: Record<string, string> = {
  free: 'bg-green-100 text-green-700',
  budget: 'bg-blue-100 text-blue-700',
  standard: 'bg-violet-100 text-violet-700',
  premium: 'bg-amber-100 text-amber-700',
};
