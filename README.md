# RAG AI Chatbot

A production-grade Retrieval-Augmented Generation chatbot with admin panel. Combines vector similarity search (Pinecone) with LLM streaming (OpenRouter) to answer questions from a custom knowledge base.

## Features

- **Hybrid RAG** — Knowledge base first, general LLM fallback with source attribution
- **Real-time Streaming** — SSE-based response streaming via AI SDK v5
- **Dual-Model Fallback** — Automatic failover with first-chunk validation
- **Admin Panel** — FAQ management, knowledge bases, document upload, model config, analytics
- **Vector Search** — Pinecone semantic search with configurable similarity threshold
- **User Feedback** — Thumbs up/down on every response with analytics dashboard
- **Embeddable Widget** — Fixed bottom-right chat panel (Intercom/Drift style)
- **Rate Limiting** — Redis-backed per-IP rate limiting

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, TypeScript, Tailwind CSS 4, Zustand, React Query |
| Backend | Express 5, TypeScript, Prisma 6, PostgreSQL |
| AI/ML | OpenRouter (LLM), Pinecone (vectors), AI SDK v5 (streaming) |
| Infra | Redis (rate limiting), BullMQ (job queue) |

## Quick Start

```bash
# Backend
cd backend
cp .env.example .env  # Edit with your API keys
npm install
npx prisma migrate dev --schema=prisma/schema.prisma --name init
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` for the chat widget, `http://localhost:5173/#admin` for the admin panel.

## Documentation

| Document | Description |
|----------|-------------|
| [Setup Guide](docs/SETUP.md) | Full installation and configuration |
| [API Reference](docs/API.md) | All 22 endpoints with examples |
| [Architecture](docs/ARCHITECTURE.md) | System design, RAG pipeline, service layer |
| [Database](docs/DATABASE.md) | Schema reference, all 7 tables |
| [Deployment](docs/DEPLOYMENT.md) | Production build, Docker, Nginx |
| [Free Hosting](docs/FREE-HOSTING.md) | Deploy free on Vercel + Render + Neon (step-by-step) |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common issues and fixes |
| [Contributing](docs/CONTRIBUTING.md) | Development workflow and code patterns |
| [Development](DEVELOPMENT.md) | Developer notes, project conventions, key patterns |

## Project Structure

```
backend/
  src/
    server.ts, app.ts             # Entry points
    config/                       # Environment config
    shared/                       # Middleware, utils, errors
    providers/                    # OpenRouter, Pinecone clients
    chatbot/                      # Core feature
      services/                   # retrieval, llm, prompt, ingestion
      admin/                      # Admin CRUD + analytics
  prisma/schema.prisma            # Database schema

frontend/
  src/
    chatbot/                      # Chat widget components + hooks
    admin/                        # Admin panel (4 tabs)
    lib/                          # Shared UI components
```

## License

Private project.
