# InfinityBox LinkedIn Post Generator

A full-stack agentic AI application that generates optimised, high-engagement LinkedIn posts for InfinityBox using a multi-node LangGraph pipeline with real-time streaming.

## Architecture

- **Agent**: LangGraph 7-node pipeline (Context → Research → Draft → Critique → Optimise → Score → Save)
- **LLM**: Claude claude-sonnet-4-20250514 with prompt caching
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

1. Create a free Redis database at [console.upstash.com](https://console.upstash.com)
2. Copy the **REST URL** and **REST Token** from the database details page

### 3. API Keys

You need:
- **Anthropic API key** — [console.anthropic.com](https://console.anthropic.com)
- **OpenAI API key** (for embeddings) — [platform.openai.com](https://platform.openai.com)
- **Tavily API key** (optional, for research) — [tavily.com](https://tavily.com)
- **LangSmith API key** (optional, for tracing) — [smith.langchain.com](https://smith.langchain.com)

---

## Backend

```bash
cd backend
cp .env.example .env
# Fill in all values in .env

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`

### Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Claude API key |
| `TAVILY_API_KEY` | Tavily search API key (optional) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service_role key |
| `OPENAI_API_KEY` | OpenAI API key (for embeddings) |
| `UPSTASH_REDIS_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_TOKEN` | Upstash Redis REST token |
| `LANGSMITH_API_KEY` | LangSmith API key (optional) |
| `LANGSMITH_PROJECT` | LangSmith project name |
| `LANGCHAIN_TRACING_V2` | Set to `true` to enable LangSmith tracing |

---

## Frontend

```bash
cd infinitybox-ui
cp .env.example .env
# .env already has localhost defaults for dev

npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Deployment

### Backend → Railway

1. Push this repo to GitHub
2. Create a new Railway project, connect the repo
3. Set root directory to `backend/`
4. Set all environment variables in the Railway dashboard
5. Railway will auto-detect Python and use the `railway.toml` start command

### Frontend → Vercel

1. Connect your GitHub repo to Vercel
2. Set root directory to `infinitybox-ui/`
3. Set environment variables:
   - `VITE_API_BASE_URL` = your Railway backend URL (e.g. `https://your-app.railway.app`)
   - `VITE_WS_BASE_URL` = `wss://your-app.railway.app`
4. Deploy

---

## How It Works

1. User enters a topic, tone, CTA, and length preferences
2. `POST /api/generate` creates a session and stores it in Redis
3. Frontend opens a WebSocket to `/api/stream/{session_id}`
4. LangGraph pipeline runs:
   - **context_loader**: Fetches top posts from Supabase, runs pgvector similarity search for past similar posts, builds style guidance
   - **research_node**: Searches Tavily for current stats and angles on the topic
   - **draft_node**: Generates Draft A (rhetorical hook) and Draft B (stat-first hook) in one Claude call with prompt caching
   - **critique_node**: Claude scores each draft on 5 dimensions (hook, readability, CTA, brand, virality)
   - **optimise_node**: Claude rewrites each draft incorporating the critique
   - **score_node**: Claude assigns a final virality score (0-100) to each optimised draft, picks winner
   - **save_node**: Embeds the final post and saves to Supabase
5. Tokens from draft_node and optimise_node stream word-by-word to the browser via WebSocket
6. User can log LinkedIn engagement metrics → system calculates engagement score and re-ranks posts

## Semantic Search

The `/api/posts?search=` endpoint embeds the search query using OpenAI's `text-embedding-3-small` and runs a pgvector cosine similarity search to find semantically similar posts — not SQL keyword matching.

## Prompt Caching

The large InfinityBox system prompt (company context, LinkedIn algorithm rules, brand voice) is sent to Claude with `cache_control: {"type": "ephemeral"}`, meaning Anthropic caches it server-side for 5 minutes. This reduces latency and cost on the draft, optimise, and other nodes that use the system prompt repeatedly.
