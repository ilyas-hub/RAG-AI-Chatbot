# Troubleshooting

## Common Issues

### "No endpoints found" / Model errors

**Symptom:** Chat returns error, backend logs show "No endpoints found for model"

**Cause:** OpenRouter model has been discontinued or renamed.

**Fix:**
1. Check current free models: `curl https://openrouter.ai/api/v1/models | jq '.data[] | select(.pricing.prompt == "0") | .id'`
2. Update `backend/src/config/index.ts` (defaultModel, fallbackModel)
3. Update `backend/prisma/schema.prisma` (ChatbotConfig defaults)
4. Delete stale config from DB:
   ```sql
   DELETE FROM chatbot_config;
   ```
   (Auto-recreates with new defaults on next request)

### Database connection fails

**Symptom:** `Can't reach database server` or `Connection refused`

**Fix:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify `.env`: `METADATA_DB_URL=postgresql://user:pass@localhost:5432/chatbot?schema=public`
3. Check database exists: `psql -l | grep chatbot`
4. If new database, run migrations:
   ```bash
   cd backend
   npx prisma migrate dev --schema=prisma/schema.prisma --name init
   ```

### Prisma client not generated

**Symptom:** `Cannot find module '@prisma/client-metadata'`

**Fix:**
```bash
cd backend
npx prisma generate --schema=prisma/schema.prisma
```

Note: Client generates to `@prisma/client-metadata` (not default `@prisma/client`).

### CORS errors

**Symptom:** Browser console shows `Access-Control-Allow-Origin` errors

**Fix:**
1. Check `frontend/.env`: `VITE_API_BASE_URL=http://localhost:3000`
2. In dev mode, Vite proxy handles this (`vite.config.ts` proxies `/chatbot` to `:3000`)
3. For production, configure CORS origins in `backend/src/app.ts`

### Redis connection refused

**Symptom:** Rate limiting middleware crashes, `ECONNREFUSED` in logs

**Fix:**
- Redis is optional for development. If not available, comment out rate limiter in `chatbot.routes.ts`
- Or start Redis: `docker run -d -p 6379:6379 redis`
- Or use cloud Redis and set `REDIS_URL` in `.env`

### Chat input not sending / no streaming response

**Symptom:** User types message but nothing happens

**Check:**
1. Backend running? `curl http://localhost:3000/health`
2. Frontend connecting to right URL? Check `VITE_API_BASE_URL`
3. Open browser DevTools > Network tab, look for `/chatbot/chat` request
4. Check backend terminal for error logs

### Admin panel won't login

**Symptom:** "Invalid admin secret" error

**Fix:**
1. Check `CHATBOT_ADMIN_SECRET` in `backend/.env`
2. Default is `admin123` if not set
3. Secret is compared with `crypto.timingSafeEqual` — must be exact match
4. Check browser DevTools > Network > look for the auth test request

### FAQs not appearing in chat responses

**Symptom:** Chat works but doesn't use FAQ knowledge

**Check:**
1. FAQs embedded? Admin panel > FAQ tab — check embedding status badges
2. If PENDING, click "Sync to Pinecone"
3. Verify Pinecone has vectors: check Pinecone dashboard
4. Check similarity threshold — default 0.72 may be too strict for your data
5. Try lowering threshold in config or admin panel

### Embedding fails (FAILED status)

**Symptom:** FAQ or document shows FAILED embedding status

**Cause:** Usually OpenRouter API key issue or rate limit

**Fix:**
1. Check `OPENROUTER_API_KEY` is valid
2. Check OpenRouter dashboard for rate limit status
3. Try "Re-index All" from admin Settings tab
4. Check backend logs for specific error message

### Frontend build fails

**Symptom:** `tsc` or `vite build` errors

**Fix:**
```bash
cd frontend
# Check TypeScript errors
npx tsc --noEmit

# If path alias issues, check tsconfig.json has:
# "paths": { "@/*": ["src/*"] }

# If dependency issues
rm -rf node_modules && npm install
```

### Backend build fails

**Symptom:** `npm run build` TypeScript errors

**Fix:**
```bash
cd backend
# Check TypeScript errors
npx tsc --noEmit

# If path alias issues after build
# tsc-alias resolves @/ paths in dist/
npm run build  # runs tsc + tsc-alias

# If Prisma types missing
npx prisma generate --schema=prisma/schema.prisma
```

## Useful Debug Commands

```bash
# Check all services
curl http://localhost:3000/health

# Test chat endpoint
curl -X POST http://localhost:3000/chatbot/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}'

# Test admin auth
curl http://localhost:3000/chatbot/admin/config \
  -H "X-Admin-Secret: admin123"

# Check Pinecone stats
curl "https://chatbot-xxx.svc.pinecone.io/describe_index_stats" \
  -H "Api-Key: pcsk_your_key"

# View database
cd backend && npx prisma studio --schema=prisma/schema.prisma

# Check logs (backend runs with pino)
# Logs are JSON by default, pipe through pino-pretty:
npm run dev  # already configured with pino-pretty in dev
```

## Performance Issues

### Slow chat responses

1. Check which model is being used (free models are slower)
2. Check `latencyMs` in ChatMessage table
3. Reduce `maxTokens` in config (smaller responses = faster)
4. Check Pinecone query latency (should be <100ms)
5. Consider upgrading from free to paid OpenRouter models

### High memory usage

1. Check embedding cache size (200 entries max, configurable in `retrieval.service.ts`)
2. Check for memory leaks in streaming (ensure streams are properly closed)
3. Monitor Node.js heap: `node --max-old-space-size=512 dist/server.js`
