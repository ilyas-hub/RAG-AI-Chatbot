# Free Hosting Guide (No Credit Card Required)

## Overview

| Service | Purpose | Free Tier | Card Required? |
|---------|---------|-----------|----------------|
| **Vercel** | Frontend (React) | Unlimited | No |
| **Render** | Backend (Express) | 750 hrs/month | No |
| **Neon** | PostgreSQL Database | 0.5 GB | No |
| **Upstash** | Redis (rate limiting) | 10K commands/day | No |
| **Pinecone** | Vector DB | Already have | No |
| **OpenRouter** | LLM API | Free models | No |

**Total cost: $0/month**

Note: Render free tier has ~30 second cold start after 15 minutes of inactivity. After the first request, everything is fast.

---

## Step 1: Create PostgreSQL Database (Neon)

1. Go to **https://neon.tech**
2. Click **Sign Up** (use GitHub login for easiest setup)
3. Click **Create Project**
   - Project name: `rag-chatbot`
   - Region: **US East (Ohio)** (closest to Pinecone/OpenRouter)
   - Click **Create Project**
4. You'll see a connection string on the dashboard. It looks like:
   ```
   postgresql://neondb_owner:abc123xyz@ep-cool-name-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. **Copy this connection string** — save it in a notepad, you'll need it later
6. Done! Database is ready. No tables yet — Render will create them automatically during deploy.

---

## Step 2: Create Redis Database (Upstash)

1. Go to **https://upstash.com**
2. Click **Sign Up** (use GitHub login)
3. Click **Create Database**
   - Name: `rag-chatbot-redis`
   - Region: **US East 1**
   - Type: **Regional**
   - Click **Create**
4. On the database page, find **REST URL** section
5. Copy the **Redis URL** — it looks like:
   ```
   rediss://default:AXxxYYY@us1-abc-12345.upstash.io:6379
   ```
6. **Save this URL** — you'll need it later
7. Done!

---

## Step 3: Deploy Backend on Render

1. Go to **https://render.com**
2. Click **Get Started for Free** → Sign up with **GitHub**
3. After login, click **New** → **Web Service**
4. Click **Connect** next to your `RAG-AI-Chatbot` repository
   - If you don't see it, click **Configure account** to give Render access to your GitHub repos
5. Fill in the settings:

   | Setting | Value |
   |---------|-------|
   | **Name** | `rag-ai-chatbot-api` |
   | **Region** | `Oregon (US West)` or `Ohio (US East)` |
   | **Root Directory** | `backend` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install && npx prisma generate --schema=prisma/schema.prisma && npm run build` |
   | **Start Command** | `npx prisma migrate deploy --schema=prisma/schema.prisma && npm start` |
   | **Instance Type** | **Free** |

6. Scroll down to **Environment Variables** → click **Add Environment Variable** for each:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `3000` |
   | `METADATA_DB_URL` | *(paste your Neon connection string from Step 1)* |
   | `OPENROUTER_API_KEY` | *(your OpenRouter API key — starts with `sk-or-v1-`)* |
   | `PINECONE_API_KEY` | *(your Pinecone API key — starts with `pcsk_`)* |
   | `PINECONE_INDEX_NAME` | `chatbot` |
   | `REDIS_URL` | *(paste your Upstash Redis URL from Step 2)* |
   | `CHATBOT_ADMIN_SECRET` | *(choose a strong secret — e.g., `mySecretAdmin2026!`)* |

7. Click **Create Web Service**
8. Wait 3-5 minutes for the build to complete
9. Render will give you a URL like: `https://rag-ai-chatbot-api.onrender.com`
10. **Test it:** Open your browser and go to:
    ```
    https://rag-ai-chatbot-api.onrender.com/health
    ```
    You should see: `{"status":"ok"}`

    (First time may take 30 seconds — this is normal, the server is waking up)

11. **Save your Render URL** — you'll need it for the frontend

---

## Step 4: Deploy Frontend on Vercel

1. Go to **https://vercel.com**
2. Click **Sign Up** → use **GitHub** login
3. Click **Add New...** → **Project**
4. Find your `RAG-AI-Chatbot` repo → click **Import**
5. Fill in the settings:

   | Setting | Value |
   |---------|-------|
   | **Project Name** | `rag-ai-chatbot` |
   | **Framework Preset** | `Vite` |
   | **Root Directory** | Click **Edit** → type `frontend` → click **Continue** |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

6. Click **Environment Variables** and add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE_URL` | *(paste your Render URL from Step 3 — e.g., `https://rag-ai-chatbot-api.onrender.com`)* |

   **Important:** Do NOT add a trailing slash. Correct: `https://rag-ai-chatbot-api.onrender.com`

7. Click **Deploy**
8. Wait 1-2 minutes
9. Vercel gives you a URL like: `https://rag-ai-chatbot.vercel.app`
10. Done!

---

## Step 5: Test Everything

### Test the chat
1. Open `https://rag-ai-chatbot.vercel.app`
2. Click the floating chat button (bottom-right)
3. Type "Hello" and send
4. You should get a streaming response from the AI
   - First time may take 30 seconds (Render cold start)
   - After that, responses are fast

### Test the admin panel
1. Open `https://rag-ai-chatbot.vercel.app/#admin`
2. Enter the `CHATBOT_ADMIN_SECRET` you set in Step 3
3. You should see the admin dashboard with 4 tabs

### Test the health check
1. Open `https://rag-ai-chatbot-api.onrender.com/health`
2. Should show `{"status":"ok"}`

---

## Step 6: Add FAQs (First Time Setup)

After deployment, your knowledge base is empty. Add some FAQs:

1. Go to `https://rag-ai-chatbot.vercel.app/#admin`
2. Login with your admin secret
3. Go to **FAQ** tab → click **New FAQ**
4. Add a few FAQs:
   - Category: `general`
   - Question: `What is this chatbot?`
   - Answer: `This is a RAG AI chatbot that answers questions from a knowledge base.`
5. After adding FAQs, click **Sync to Pinecone**
6. Wait for status badges to show **COMPLETED**
7. Now test in the chat — ask the question you added

---

## Troubleshooting

### Render shows "Build failed"
- Check the build logs on Render dashboard
- Most common: missing environment variable — double check all 8 env vars are set
- If Prisma error: make sure `METADATA_DB_URL` is correct

### Vercel shows "Build failed"
- Check if `Root Directory` is set to `frontend`
- Check if `VITE_API_BASE_URL` is set correctly (no trailing slash)

### Chat shows error / no response
- First check: is the backend awake? Visit `https://your-render-url.onrender.com/health`
- If it takes 30 seconds then responds "ok" — backend was sleeping, try the chat again
- If it shows error — check Render logs for the specific error

### "Cannot connect to backend" on admin login
- Check CORS: your Vercel URL must be allowed by the backend
- The backend allows all origins by default, so this shouldn't happen
- Check browser DevTools → Network tab for the actual error

### FAQs not working in chat
1. Check FAQ embedding status in admin panel — should say COMPLETED
2. If PENDING, click "Sync to Pinecone"
3. If FAILED, check that `PINECONE_API_KEY` and `OPENROUTER_API_KEY` are correct in Render env vars

### Render server keeps sleeping
This is normal on the free tier. The server sleeps after 15 minutes of no requests. Options:
- Accept the 30s cold start (fine for portfolio)
- Use a free uptime monitor like **UptimeRobot** (https://uptimerobot.com) to ping your health endpoint every 14 minutes — this keeps the server awake

---

## Summary of URLs

After setup, you'll have:

| What | URL |
|------|-----|
| **Chat Widget** | `https://rag-ai-chatbot.vercel.app` |
| **Admin Panel** | `https://rag-ai-chatbot.vercel.app/#admin` |
| **Backend API** | `https://rag-ai-chatbot-api.onrender.com` |
| **Health Check** | `https://rag-ai-chatbot-api.onrender.com/health` |
| **Database** | Neon dashboard at neon.tech |
| **Redis** | Upstash dashboard at upstash.com |
| **Source Code** | `https://github.com/ilyas-hub/RAG-AI-Chatbot` |

---

## Keeping Server Awake (Optional)

To avoid the 30-second cold start on Render free tier:

1. Go to **https://uptimerobot.com** → Sign up (free)
2. Click **Add New Monitor**
   - Monitor Type: **HTTP(s)**
   - Friendly Name: `RAG Chatbot Backend`
   - URL: `https://rag-ai-chatbot-api.onrender.com/health`
   - Monitoring Interval: **every 5 minutes**
3. Click **Create Monitor**

This pings your backend every 5 minutes, preventing it from sleeping. 100% free, no card needed.
