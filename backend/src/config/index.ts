import 'dotenv/config';

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
  },

  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    isConfigured: !!process.env.OPENROUTER_API_KEY,
  },

  pinecone: {
    apiKey: process.env.PINECONE_API_KEY || '',
    indexName: process.env.PINECONE_INDEX_NAME || 'chatbot',
    isConfigured: !!process.env.PINECONE_API_KEY,
  },

  redis: {
    url: process.env.REDIS_URL || '',
    isConfigured: !!process.env.REDIS_URL,
  },

  cloudflare: {
    gatewayBaseUrl: process.env.CLOUDFLARE_GATEWAY_BASE_URL || '',
    isConfigured: !!process.env.CLOUDFLARE_GATEWAY_BASE_URL,
  },

  auth: {
    jwksUrl: process.env.LOGTO_JWKS_URL || process.env.AUTH_JWKS_URL || '',
    issuer: process.env.LOGTO_ISSUER || process.env.AUTH_ISSUER || '',
    audience: process.env.LOGTO_RESOURCE_INDICATOR || process.env.AUTH_AUDIENCE || '',
    superAdminRoleId: process.env.SUPER_ADMIN_ROLE_ID || 'super-admin',
  },

  database: {
    metadataUrl: process.env.METADATA_DB_URL || '',
  },

  chatbot: {
    defaultModel: process.env.CHATBOT_DEFAULT_MODEL || 'nvidia/nemotron-3-nano-30b-a3b:free',
    fallbackModel: process.env.CHATBOT_FALLBACK_MODEL || 'arcee-ai/trinity-mini:free',
    embeddingModel: process.env.CHATBOT_EMBEDDING_MODEL || 'openai/text-embedding-3-small',
    scoreThreshold: parseFloat(process.env.CHATBOT_SCORE_THRESHOLD || '0.72'),
    maxContextChunks: parseInt(process.env.CHATBOT_MAX_CONTEXT_CHUNKS || '5', 10),
  },
} as const;
