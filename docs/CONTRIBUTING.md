# Contributing & Development Guide

## Development Workflow

```bash
# Start both servers
cd backend && npm run dev    # Terminal 1 (port 3000)
cd frontend && npm run dev   # Terminal 2 (port 5173)
```

## Code Organization

### Backend Pattern

Each feature follows this structure:
```
feature/
  feature.routes.ts        # Express routes
  feature.controller.ts    # Request handling, validation
  feature.service.ts       # Business logic
  feature.types.ts         # TypeScript types
  feature.validation.ts    # Valibot schemas
  admin/                   # Admin-only endpoints
  adapters/                # External service adapters
  services/                # Domain services
```

### Frontend Pattern

```
feature/
  api/                     # React Query hooks + API calls
  components/              # React components
  stores/                  # Zustand stores
  types/                   # TypeScript types
```

## Adding a New FAQ Category

1. Create FAQ via admin panel (`/#admin` > FAQ tab > New FAQ)
2. Fill in category, question, answer, keywords
3. FAQ auto-embeds to Pinecone on creation
4. Or bulk sync: FAQ tab > "Sync to Pinecone"

## Adding a New Document

1. Admin panel > Knowledge Bases tab
2. Create a KB if none exists
3. Click "Upload Document" on a KB card
4. Paste content, set title and source type
5. Document auto-chunks and embeds

## Adding a New API Endpoint

1. Add route in `chatbot.routes.ts`
2. Add validation schema in `chatbot.validation.ts`
3. Add controller method in `chatbot.controller.ts`
4. Add service method in `chatbot.service.ts` or admin service
5. Add types in `chatbot.types.ts`

## Adding a New Admin Tab

1. Create component in `frontend/src/admin/components/new-tab.tsx`
2. Add to `TABS` array in `admin-layout.tsx`
3. Add API functions in `admin/api.ts`
4. Add React Query hooks in `admin/hooks.ts`
5. Add types in `admin/types.ts`

## Adding a New OpenRouter Model

Edit `frontend/src/admin/models.ts`:

```typescript
{ id: 'provider/model-name', name: 'Model Name', tier: 'free', pricing: 'Free' },
```

Verify model is active: `curl https://openrouter.ai/api/v1/models | jq '.data[] | select(.id == "provider/model-name")'`

## Running Tests

```bash
# Backend
cd backend
npm test              # Run once
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# Frontend
cd frontend
npm test              # Run once
npm run test:coverage # Coverage report
```

## Database Changes

```bash
cd backend

# Create migration
npx prisma migrate dev --schema=prisma/schema.prisma --name describe-change

# Apply in production
npx prisma migrate deploy --schema=prisma/schema.prisma

# Regenerate client after schema changes
npx prisma generate --schema=prisma/schema.prisma

# Reset database (DESTRUCTIVE)
npx prisma migrate reset --schema=prisma/schema.prisma
```

## Code Style

- TypeScript strict mode enabled
- Path alias: `@/` maps to `src/`
- Backend validation: Valibot (not Zod)
- Frontend styling: Tailwind utility classes only
- Color theme: indigo-500 to violet-500 gradient
- Components: Functional, no class components
- State: Zustand for UI, React Query for server state
- No default exports (except pages/entry points)

## Key Files to Know

| File | Purpose |
|------|---------|
| `backend/src/chatbot/chatbot.service.ts` | Main chat orchestration |
| `backend/src/chatbot/services/retrieval.service.ts` | RAG query pipeline |
| `backend/src/chatbot/services/llm.service.ts` | LLM streaming + fallback |
| `backend/src/chatbot/services/prompt.service.ts` | System prompt construction |
| `backend/src/chatbot/services/ingestion.service.ts` | Document chunking + embedding |
| `backend/src/config/index.ts` | All environment config |
| `frontend/src/chatbot/api/use-chat-stream.ts` | AI SDK streaming hook |
| `frontend/src/admin/models.ts` | OpenRouter model list |
| `backend/prisma/schema.prisma` | Database schema |
