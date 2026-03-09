# RAG AI Chatbot — Claude Code Instructions

## Project Overview

Standalone RAG (Retrieval-Augmented Generation) AI Chatbot. Monorepo with `backend/` (Express 5 + TypeScript) and `frontend/` (React 19 + Vite 7 + TypeScript).

## Tech Stack

- **Backend:** Express 5, TypeScript 5.9, Prisma 6.17 (PostgreSQL), Pinecone 4.0, AI SDK v5, ioredis, BullMQ, Valibot, Pino
- **Frontend:** React 19, Vite 7, Tailwind CSS 4, Zustand 5, TanStack React Query 5, AI SDK v5 (`@ai-sdk/react`), Radix UI, Lucide icons
- **LLM:** OpenRouter (primary: `nvidia/nemotron-3-nano-30b-a3b:free`, fallback: `arcee-ai/trinity-mini:free`)
- **Embeddings:** `text-embedding-3-small` via OpenRouter (1536 dimensions)
- **Vector DB:** Pinecone (serverless, `chatbot` index, `global` namespace)
- **Database:** PostgreSQL (local, `chatbot` database)

## Project Structure

```
backend/
  src/
    server.ts              # HTTP entry point
    app.ts                 # Express app config (cors, helmet, compression, routes)
    config/index.ts        # All env config
    shared/utils/          # logger, errors, response helpers
    shared/middleware/      # auth, rate-limit, error-handler
    database/connection/    # Prisma singleton
    providers/openrouter/   # OpenRouter LLM client
    providers/pinecone/     # Pinecone vector client
    chatbot/
      chatbot.routes.ts    # 22 API endpoints
      chatbot.controller.ts
      chatbot.service.ts   # Main orchestration (retrieve -> prompt -> stream -> save)
      chatbot.types.ts
      chatbot.validation.ts
      admin/               # Admin auth, controller, service (CRUD + analytics)
      adapters/            # Database + auth adapters
      services/            # retrieval, llm, prompt, ingestion
  prisma/schema.prisma     # 7 tables, 3 enums

frontend/
  src/
    App.tsx                # Hash-based routing (/ = chat, #admin = admin panel)
    env.ts                 # VITE_API_BASE_URL
    lib/                   # api-client, utils, ui components (button, dialog, scroll-area)
    chatbot/               # User-facing chat widget
      api/                 # use-chat-stream, use-conversations, use-feedback
      components/          # chat-widget, chat-panel, message-bubble, chat-input, typing-indicator, feedback-buttons
      stores/              # Zustand chat store
    admin/                 # Admin panel
      api.ts, hooks.ts     # Admin API + React Query hooks
      models.ts            # Curated OpenRouter model list (40+ models)
      components/          # admin-layout, admin-login, faq-tab, kb-tab, config-tab, analytics-tab, model-selector
```

## Commands

```bash
# Backend
cd backend
npm run dev                    # Start dev server (tsx watch, port 3000)
npm run build                  # TypeScript compile + tsc-alias
npm run prisma:generate        # Generate Prisma client
npm run prisma:migrate:dev     # Run migrations
npm run prisma:studio          # Open Prisma Studio
npm run seed:chatbot           # Seed FAQ data
npm run ingest:chatbot         # Ingest FAQs to Pinecone
npm test                       # Vitest

# Frontend
cd frontend
npm run dev                    # Vite dev server (port 5173, proxy /chatbot -> :3000)
npm run build                  # TypeScript check + Vite build
npm run lint                   # ESLint
npm test                       # Vitest
```

## Path Aliases

Both backend and frontend use `@/` -> `src/` path alias.

## Key Patterns

### RAG Pipeline
`User message -> Embed query -> Pinecone search (topK=10, threshold=0.72) -> Take top 5 chunks -> Inject into system prompt -> LLM stream response -> Save to DB`

### Dual-Model Fallback
Primary model -> first-chunk validation -> if retriable error (429/502/503/504) -> fallback model -> if both fail -> static fallback message.

### Admin Auth
`X-Admin-Secret` header with timing-safe comparison (`crypto.timingSafeEqual`). Default secret in env: `CHATBOT_ADMIN_SECRET`.

### Frontend Routing
Hash-based: `localhost:5173/` = chat widget, `localhost:5173/#admin` = admin panel.

### State Management
- **Zustand:** UI state only (isOpen, isStreaming, activeConversationId)
- **React Query:** All server state (FAQs, KBs, config, analytics) with cache invalidation on mutations

## Database

PostgreSQL via Prisma. Schema at `backend/prisma/schema.prisma`. Prisma client output: `node_modules/@prisma/client-metadata`.

Tables: ChatConversation, ChatMessage, FaqContent, KnowledgeBase, KnowledgeDocument, ChatbotConfig, PromptTemplate.

## Environment

Backend `.env` requires: `METADATA_DB_URL`, `OPENROUTER_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX_NAME`, `CHATBOT_ADMIN_SECRET`, `REDIS_URL`.

Frontend `.env` requires: `VITE_API_BASE_URL=http://localhost:3000`.

## Code Style

- No Logto auth on user-facing routes (anonymous access allowed)
- Tailwind utility classes, no CSS modules
- Gradient theme: indigo-500 to violet-500
- `bg-white` for cards (no dark mode currently)
- `cursor-pointer` explicitly on all custom-styled buttons
- Valibot for backend validation, not Zod
- Express 5 (async error handling built-in)
- AI SDK v5 (`useChat` + `TextStreamChatTransport` for streaming)

## Important Notes

- Prisma client is generated to `@prisma/client-metadata` (not default `@prisma/client`)
- OpenRouter models change frequently — check `frontend/src/admin/models.ts` for curated list
- Free models have rate limits; dual-model fallback handles this
- Document chunking: 800 chars, 200 overlap, sentence-boundary splitting
- Embedding cache: LRU, 200 entries, 30-min TTL
- Config cache: 5-min in-memory TTL
