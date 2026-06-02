# InfinityBox LinkedIn Post Generator

AI-powered LinkedIn post generator for InfinityBox. Generates, critiques, optimises, and scores posts using a LangGraph pipeline with real-time streaming.

## Stack

- **LLM**: Llama 3.3 70B via Groq (free tier) with automatic fallback to Llama 3.1 8B
- **Pipeline**: LangGraph 8-node (Context → Research → Draft → Critique → Optimise → Score → Business Impact → Save)
- **Backend**: FastAPI + WebSocket streaming
- **Database**: Supabase (PostgreSQL + pgvector)
- **Cache**: Upstash Redis
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion

---

## Setup

### 1. Database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `supabase_migrations.sql`
3. Copy your **Project URL** and **service_role** key from Settings → API

### 2. Redis (Upstash)

1. Create a free database at [console.upstash.com](https://console.upstash.com)
2. Copy the **REST URL** and **REST Token**

### 3. API Keys

You only need:
- **Groq API key** (free) — [console.groq.com](https://console.groq.com)

---

## Backend

```bash
cd backend
cp .env.example .env
# Fill in values in .env

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ | Groq API key (free at console.groq.com) |
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | ✅ | Supabase service_role key |
| `UPSTASH_REDIS_URL` | ✅ | Upstash Redis REST URL |
| `UPSTASH_REDIS_TOKEN` | ✅ | Upstash Redis REST token |
| `TAVILY_API_KEY` | Optional | For web research on topics |

---

## Frontend

```bash
cd infinitybox-ui
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Deployment (free)

### Backend → Render

1. Push repo to GitHub
2. New Web Service on [render.com](https://render.com)
3. Root directory: `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add all environment variables from the table above

### Frontend → Vercel

1. Import repo on [vercel.com](https://vercel.com)
2. Root directory: `infinitybox-ui`
3. Add environment variables:
   - `VITE_API_BASE_URL` = your Render backend URL
   - `VITE_WS_BASE_URL` = `wss://your-backend.onrender.com`

---

## Features

- **Generate** — Fill in topic, tone, length → 8-node pipeline generates, critiques, optimises, and scores two post variants, picks the best one
- **Topics** — AI generates post topic ideas with priority scores, company impact and virality scores per topic
- **Library** — All generated posts in a searchable, filterable table with grouping by topic
- **Analytics** — Engagement tracking, virality scores, tone breakdown charts
- **Refinement** — Request changes to any generated post inline
- **Mobile responsive** — Works on phone and tablet
