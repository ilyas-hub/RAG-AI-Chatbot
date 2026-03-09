# Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19)                  │
│                                                          │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │ Chat Widget   │  │  Admin Panel  │  │ State Mgmt   │  │
│  │ (FAB + Panel) │  │ (4 tabs)      │  │ Zustand + RQ │  │
│  └──────┬────────┘  └──────┬────────┘  └──────────────┘  │
│         │ SSE Stream       │ REST + X-Admin-Secret        │
└─────────┼──────────────────┼─────────────────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND (Express 5)                    │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                 ChatbotService                      │  │
│  │                                                     │  │
│  │  1. RetrievalService  ──> Pinecone (vector search) │  │
│  │  2. PromptService     ──> Context assembly          │  │
│  │  3. LLMService        ──> OpenRouter (streaming)    │  │
│  │  4. IngestionService  ──> Chunk + embed + upsert    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │PostgreSQL│  │ Pinecone │  │OpenRouter│  │  Redis  │  │
│  │(Prisma)  │  │(Vectors) │  │ (LLM)   │  │(RateL.) │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘  │
└─────────────────────────────────────────────────────────┘
```

## RAG Pipeline Flow

```
User Message
    │
    ▼
┌─────────────────┐
│ 1. Save message  │  (ChatMessage table, role: USER)
└────────┬─────────┘
         ▼
┌─────────────────┐     ┌──────────────┐
│ 2. Embed query   │────>│ OpenRouter    │
│    (1536-dim)    │<────│ Embeddings   │
└────────┬─────────┘     └──────────────┘
         │  LRU cache (200 entries, 30-min TTL)
         ▼
┌─────────────────┐     ┌──────────────┐
│ 3. Vector search │────>│ Pinecone     │
│    topK=10       │<────│ cosine sim.  │
│    threshold=0.72│     └──────────────┘
└────────┬─────────┘
         │  Filter: top 5 chunks above threshold
         ▼
┌─────────────────┐
│ 4. Build prompt  │  System prompt + context chunks + custom instructions
│    + history     │  Last 6 conversation messages
└────────┬─────────┘
         ▼
┌─────────────────┐     ┌──────────────┐
│ 5. LLM stream   │────>│ OpenRouter   │
│    primary model │     │ (streaming)  │
│    ↓ fallback    │     └──────────────┘
│    static msg    │
└────────┬─────────┘
         │  SSE text/plain
         ▼
┌─────────────────┐
│ 6. Save response │  Update ChatMessage: content, tokens, latency, chunks
│    + title gen   │  Auto-generate conversation title
└──────────────────┘
```

## Document Ingestion Flow

```
FAQ / Document Upload
    │
    ▼
┌─────────────────────┐
│ 1. Save to DB        │  FaqContent or KnowledgeDocument
│    status: PENDING   │
└──────────┬───────────┘
           ▼
┌─────────────────────┐
│ 2. Chunk text        │  800 chars, 200 overlap, sentence boundaries
│    (documents only)  │  SHA-256 dedup for documents
└──────────┬───────────┘
           ▼
┌─────────────────────┐     ┌──────────────┐
│ 3. Embed chunks      │────>│ OpenRouter    │
│    batch: 100/call   │<────│ Embeddings   │
│    status: PROCESSING│     └──────────────┘
└──────────┬───────────┘
           ▼
┌─────────────────────┐     ┌──────────────┐
│ 4. Upsert vectors    │────>│ Pinecone     │
│    with metadata     │     │ (global ns)  │
│    status: COMPLETED │     └──────────────┘
└──────────────────────┘

Metadata stored per vector:
  - FAQ:      { sourceType: 'faq', faqId, category }
  - Document: { sourceType: 'document', documentId, title, chunkIndex }
```

## Frontend Architecture

```
App.tsx (hash routing)
├── / ──> Chat Widget
│         ├── ChatPanel
│         │   ├── Header (gradient, online status)
│         │   ├── MessageBubble[] (user gradient / assistant white)
│         │   │   └── FeedbackButtons (thumbs up/down)
│         │   ├── TypingIndicator (animated dots)
│         │   └── ChatInput (text + send button)
│         └── FAB (floating action button, bottom-right)
│
└── #admin ──> AdminApp
              ├── AdminLogin (shared secret auth)
              └── AdminLayout (tab navigation)
                  ├── FaqTab (search, CRUD, sync)
                  ├── KbTab (card grid, document upload)
                  ├── ConfigTab (toggles, model selector, sliders)
                  └── AnalyticsTab (stat cards, feedback bars)
```

## Service Layer (Backend)

| Service | Responsibility |
|---------|---------------|
| `ChatbotService` | Main orchestration: config caching, chat flow, conversation CRUD, feedback |
| `RetrievalService` | Query embedding (cached), Pinecone search, batch embedding for storage |
| `LLMService` | Model streaming with primary/fallback, first-chunk validation, timeout handling |
| `PromptService` | System prompt construction, context formatting, conversation history |
| `IngestionService` | Text chunking, content hashing, FAQ/document embedding, vector upsert/delete |
| `ChatbotAdminService` | KB CRUD, FAQ CRUD, config management, analytics aggregation, reindex |

## Database Schema

```
ChatConversation (1) ──< (N) ChatMessage
KnowledgeBase    (1) ──< (N) KnowledgeDocument
KnowledgeBase    (1) ──< (N) FaqContent
ChatbotConfig    (singleton)
PromptTemplate   (versioned)
```

See `backend/prisma/schema.prisma` for full schema.

## Authentication Layers

| Layer | Method | Used For |
|-------|--------|----------|
| None | Anonymous | User chat endpoints |
| X-Admin-Secret | Shared secret (timing-safe) | Admin panel API |
| X-Widget-Key | API key | External widget embedding |
| Authorization: Bearer | JWT (Logto, optional) | Authenticated user tracking |

## Caching Strategy

| Cache | Type | Size | TTL | Purpose |
|-------|------|------|-----|---------|
| Embedding cache | LRU (in-memory) | 200 entries | 30 min | Avoid re-embedding repeated queries |
| Config cache | Simple (in-memory) | 1 entry | 5 min | Reduce DB reads for chatbot config |
| React Query | Client-side | Per-query | 30 sec staleTime | Avoid unnecessary API refetches |
