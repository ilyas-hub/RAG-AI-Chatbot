# Deployment Guide

## Production Build

### Backend

```bash
cd backend
npm run build
# Output: dist/

# Start production server
NODE_ENV=production npm start
```

### Frontend

```bash
cd frontend
npm run build
# Output: dist/

# Preview locally
npm run preview
```

## Environment Variables (Production)

### Backend

```env
PORT=3000
NODE_ENV=production

# Database (use connection pooler for production)
METADATA_DB_URL=postgresql://user:pass@host:5432/chatbot?schema=public&connection_limit=10

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-...

# Pinecone
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX_NAME=chatbot

# Redis
REDIS_URL=redis://default:pass@host:port

# Admin (CHANGE THIS!)
CHATBOT_ADMIN_SECRET=use-a-strong-random-string-here

# Optional: Cloudflare AI Gateway (for caching/logging LLM calls)
CLOUDFLARE_GATEWAY_BASE_URL=https://gateway.ai.cloudflare.com/v1/...

# Optional: Custom models
CHATBOT_DEFAULT_MODEL=nvidia/nemotron-3-nano-30b-a3b:free
CHATBOT_FALLBACK_MODEL=arcee-ai/trinity-mini:free
```

### Frontend

```env
VITE_API_BASE_URL=https://your-api-domain.com
```

## Deployment Options

### Option 1: VPS (DigitalOcean, Linode, etc.)

```bash
# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and build
git clone <repo> /app
cd /app/backend && npm ci && npm run build
cd /app/frontend && npm ci && npm run build

# Run database migrations
cd /app/backend
npx prisma migrate deploy --schema=prisma/schema.prisma

# Use PM2 for process management
npm install -g pm2
cd /app/backend && pm2 start dist/server.js --name chatbot-api

# Serve frontend with nginx (see nginx config below)
```

### Option 2: Railway / Render

1. Connect GitHub repo
2. Set build command: `cd backend && npm ci && npm run prisma:generate && npm run build`
3. Set start command: `cd backend && npm start`
4. Add all environment variables
5. Deploy frontend separately as a static site

### Option 3: Docker

```dockerfile
# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY prisma ./prisma
RUN npx prisma generate --schema=prisma/schema.prisma
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (static files)
    root /app/frontend/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /chatbot {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;

        # SSE support
        proxy_buffering off;
        proxy_read_timeout 300s;
    }

    location /health {
        proxy_pass http://localhost:3000;
    }
}
```

## Database Migration (Production)

```bash
cd backend

# Deploy migrations (non-interactive)
npx prisma migrate deploy --schema=prisma/schema.prisma

# Generate client
npx prisma generate --schema=prisma/schema.prisma
```

## Security Checklist

- [ ] Change `CHATBOT_ADMIN_SECRET` from default `admin123`
- [ ] Use HTTPS (SSL/TLS) in production
- [ ] Set `NODE_ENV=production`
- [ ] Restrict CORS origins in `app.ts`
- [ ] Rotate API keys (OpenRouter, Pinecone) if exposed
- [ ] Use connection pooler for PostgreSQL (PgBouncer or Prisma Accelerate)
- [ ] Set up log rotation for Pino logs
- [ ] Monitor Redis memory usage
- [ ] Set up database backups

## Monitoring

### Health Check

```bash
curl https://your-domain.com/health
# Expected: { "status": "ok" }
```

### Key Metrics to Monitor

- API response times (especially `/chatbot/chat`)
- LLM streaming latency (stored in `ChatMessage.latencyMs`)
- Pinecone query latency
- Redis memory usage
- PostgreSQL connection count
- Error rates (check Pino logs)
- Embedding status failures (`SELECT COUNT(*) FROM faq_content WHERE embedding_status = 'FAILED'`)
