# Setup Guide

## Prerequisites

- Node.js 20+ (recommended: 24.x)
- PostgreSQL 15+
- Redis (local or cloud like Redis Labs)
- Pinecone account (free tier works)
- OpenRouter account (free tier works)

## 1. Clone & Install

```bash
cd "A:\RAG AI Chatbot"

# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

## 2. PostgreSQL Database Setup

### Create the database

```sql
-- Connect to PostgreSQL (psql, pgAdmin, or any client)
CREATE DATABASE chatbot;
```

### Configure connection

Create `backend/.env`:

```env
METADATA_DB_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/chatbot?schema=public
```

### Run migrations

```bash
cd backend
npx prisma generate --schema=prisma/schema.prisma
npx prisma migrate dev --schema=prisma/schema.prisma --name init
```

### Verify

```bash
npx prisma studio --schema=prisma/schema.prisma
```

This opens a browser UI at `localhost:5555` to inspect your tables.

## 3. Pinecone Setup

1. Go to [pinecone.io](https://www.pinecone.io/) and create a free account
2. Create an index:
   - **Name:** `chatbot`
   - **Dimensions:** `1536`
   - **Metric:** `cosine`
   - **Cloud:** AWS / us-east-1 (serverless)
3. Copy your API key

Add to `backend/.env`:

```env
PINECONE_API_KEY=pcsk_your_key_here
PINECONE_INDEX_NAME=chatbot
```

## 4. OpenRouter Setup

1. Go to [openrouter.ai](https://openrouter.ai/) and create a free account
2. Generate an API key from the dashboard
3. Free tier gives access to models like `nvidia/nemotron-3-nano-30b-a3b:free`

Add to `backend/.env`:

```env
OPENROUTER_API_KEY=sk-or-v1-your_key_here
```

## 5. Redis Setup

### Option A: Local Redis

```bash
# Linux/Mac
sudo apt install redis-server
redis-server

# Windows: Use WSL or Docker
docker run -d -p 6379:6379 redis
```

### Option B: Redis Cloud (free)

1. Go to [redis.com/try-free](https://redis.com/try-free/)
2. Create a free database
3. Copy the connection URL

Add to `backend/.env`:

```env
REDIS_URL=redis://default:password@your-redis-host:port
```

## 6. Complete Backend .env

```env
PORT=3000
NODE_ENV=development

# Database
METADATA_DB_URL=postgresql://postgres:password@localhost:5432/chatbot?schema=public

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-your_key

# Pinecone
PINECONE_API_KEY=pcsk_your_key
PINECONE_INDEX_NAME=chatbot

# Redis
REDIS_URL=redis://localhost:6379

# Admin
CHATBOT_ADMIN_SECRET=change-this-to-something-secure
```

## 7. Frontend .env

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## 8. Start Development

```bash
# Terminal 1: Backend
cd backend
npm run dev
# Server starts at http://localhost:3000

# Terminal 2: Frontend
cd frontend
npm run dev
# Opens at http://localhost:5173
```

## 9. Verify Everything Works

1. **Chat Widget:** Open `http://localhost:5173` — click the floating button bottom-right
2. **Admin Panel:** Open `http://localhost:5173/#admin` — login with your `CHATBOT_ADMIN_SECRET`
3. **Health Check:** `curl http://localhost:3000/health`
4. **Prisma Studio:** `cd backend && npx prisma studio --schema=prisma/schema.prisma`

## 10. Seed Data (Optional)

```bash
cd backend

# Seed sample FAQs
npm run seed:chatbot

# Ingest FAQs to Pinecone (embeds + upserts)
npm run ingest:chatbot
```

## Troubleshooting

### "No endpoints found" for model
OpenRouter models get discontinued. Update models in:
- `backend/src/config/index.ts` (defaultModel, fallbackModel)
- `backend/prisma/schema.prisma` (ChatbotConfig defaults)
- Delete old config: `DELETE FROM chatbot_config;` (auto-recreates with new defaults)

### Prisma "Can't reach database"
- Check PostgreSQL is running: `pg_isready`
- Verify `METADATA_DB_URL` in `.env`
- Ensure database exists: `psql -l | grep chatbot`

### Redis connection refused
- If Redis is optional for dev, the app works without it (rate limiting disabled)
- Check Redis is running: `redis-cli ping`

### CORS errors
- Ensure frontend `.env` has correct `VITE_API_BASE_URL`
- Vite proxy handles `/chatbot` routes in dev mode
