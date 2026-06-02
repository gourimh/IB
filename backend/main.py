import os
import uuid
import json
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

from agent.graph import create_graph, GRAPH_NODE_NAMES, STREAMING_NODES
from agent.state import AgentState
from agent.nodes import _make_llm
from agent.prompts import REFINE_PROMPT, TOPIC_GENERATION_PROMPT, TOPIC_SCORE_PROMPT
from cache.redis import (
    set_job,
    get_job,
    update_job_status,
    check_rate_limit,
    get_analytics_cache,
    set_analytics_cache,
)
from db.supabase import (
    get_post_by_id,
    list_posts,
    similarity_search,
    update_engagement,
    soft_delete_post,
    get_analytics_data,
    list_topics,
    save_topics,
    update_topic,
    delete_topic,
    get_recent_post_topics,
)
from db.embeddings import embed_text

agent_graph = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global agent_graph
    agent_graph = create_graph()
    yield


app = FastAPI(title="InfinityBox LinkedIn Agent", version="1.0.0", lifespan=lifespan)

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    os.getenv("FRONTEND_URL", "https://your-vercel-app.vercel.app"),
]

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    os.getenv("FRONTEND_URL", ""),   # set this to your Vercel URL in Render env vars
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten to ALLOWED_ORIGINS once deployed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    topic: str = Field(..., min_length=5, max_length=500)
    tone: str = Field(default="thought-leadership")
    cta: str = Field(default="Comment below or DM me to learn more")
    length: str = Field(default="medium")
    include_hashtags: bool = Field(default=True)


class EngagementUpdate(BaseModel):
    impressions: int = Field(..., ge=0)
    reactions: int = Field(..., ge=0)
    comments: int = Field(..., ge=0)
    shares: int = Field(..., ge=0)
    reposts: int = Field(..., ge=0)


class RefineRequest(BaseModel):
    post: str = Field(..., min_length=10)
    feedback: str = Field(..., min_length=3, max_length=1000)


@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/api/generate")
async def generate(request: Request, body: GenerateRequest):
    client_ip = request.client.host if request.client else "unknown"

    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests. Please wait before generating again.")

    valid_tones = {"thought-leadership", "storytelling", "data-driven", "contrarian", "listicle"}
    if body.tone not in valid_tones:
        body.tone = "thought-leadership"

    valid_lengths = {"short", "medium", "long"}
    if body.length not in valid_lengths:
        body.length = "medium"

    session_id = str(uuid.uuid4())

    job_data = {
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "input": {
            "topic": body.topic,
            "tone": body.tone,
            "cta": body.cta,
            "length": body.length,
            "include_hashtags": body.include_hashtags,
            "session_id": session_id,
            "research_context": "",
            "similar_past_posts": [],
            "style_vector_guidance": "",
            "draft_a": "",
            "draft_b": "",
            "critique_a": {},
            "critique_b": {},
            "optimised_a": "",
            "optimised_b": "",
            "virality_score_a": 0.0,
            "virality_score_b": 0.0,
            "final_post": "",
            "winning_variant": "",
            "post_id": None,
            "business_impact_score": 0.0,
            "business_impact_rationale": "",
        },
        "post_id": None,
    }

    set_job(session_id, job_data)
    return {"session_id": session_id}


@app.websocket("/api/stream/{session_id}")
async def stream_generation(websocket: WebSocket, session_id: str):
    await websocket.accept()

    job = get_job(session_id)
    if not job:
        await websocket.send_json({"type": "error", "message": "Session not found or expired"})
        await websocket.close()
        return

    initial_state: AgentState = job["input"]
    update_job_status(session_id, "streaming")

    post_id = ""
    final_post_text = ""
    optimised_a = ""
    optimised_b = ""

    try:
        async for event in agent_graph.astream_events(initial_state, version="v2"):
            kind = event.get("event", "")
            name = event.get("name", "")
            metadata = event.get("metadata", {})
            langgraph_node = metadata.get("langgraph_node", "")

            if kind == "on_chain_start" and name in GRAPH_NODE_NAMES:
                await websocket.send_json({"type": "node_start", "node": name})

            elif kind == "on_chat_model_stream" and langgraph_node in STREAMING_NODES:
                chunk = event.get("data", {}).get("chunk")
                if chunk:
                    content = chunk.content
                    if isinstance(content, str) and content:
                        await websocket.send_json({"type": "token", "content": content})
                    elif isinstance(content, list):
                        for part in content:
                            if isinstance(part, dict) and part.get("type") == "text":
                                text = part.get("text", "")
                                if text:
                                    await websocket.send_json({"type": "token", "content": text})

            elif kind == "on_chain_end" and name in GRAPH_NODE_NAMES:
                await websocket.send_json({"type": "node_complete", "node": name})
                output = event.get("data", {}).get("output", {})

                if name == "optimise_node" and output:
                    optimised_a = output.get("optimised_a", "")
                    optimised_b = output.get("optimised_b", "")

                if name == "score_node" and output:
                    scores_data = {
                        "score_a": output.get("virality_score_a", 0),
                        "score_b": output.get("virality_score_b", 0),
                        "winner": output.get("winning_variant", "A"),
                        "optimised_a": optimised_a,
                        "optimised_b": optimised_b,
                    }
                    await websocket.send_json({"type": "scores", "data": scores_data})
                    final_post_text = output.get("final_post", "")

                if name == "business_impact_node" and output:
                    await websocket.send_json({
                        "type": "business_impact",
                        "score": output.get("business_impact_score", 0),
                        "rationale": output.get("business_impact_rationale", ""),
                    })

                if name == "save_node" and output:
                    post_id = output.get("post_id", "")

        update_job_status(session_id, "complete", {"post_id": post_id})
        await websocket.send_json({
            "type": "complete",
            "post_id": post_id,
            "final_post": final_post_text,
        })

    except WebSocketDisconnect:
        update_job_status(session_id, "error")
    except Exception as e:
        update_job_status(session_id, "error")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


@app.get("/api/posts")
async def get_posts(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    tone: str = Query(default=None),
    search: str = Query(default=None),
):
    if search:
        try:
            embedding = await embed_text(search)
            results = similarity_search(embedding, limit=limit)
            return {"posts": results, "total": len(results), "page": 1, "semantic": True}
        except Exception:
            pass

    posts, total = list_posts(page=page, limit=limit, tone=tone)
    return {"posts": posts, "total": total, "page": page, "semantic": False}


@app.get("/api/posts/{post_id}")
async def get_post(post_id: str):
    post = get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@app.patch("/api/posts/{post_id}/engagement")
async def log_engagement(post_id: str, body: EngagementUpdate):
    post = get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    impressions = max(body.impressions, 1)
    engagement_score = (
        (body.reactions * 3 + body.comments * 5 + body.shares * 7 + body.reposts * 6) / impressions * 1000
    )
    engagement_score = round(engagement_score, 4)

    final_post = post.get("final_post", "")
    try:
        embedding = await embed_text(final_post)
    except Exception:
        embedding = None

    data = {
        "impressions": body.impressions,
        "reactions": body.reactions,
        "comments": body.comments,
        "shares": body.shares,
        "reposts": body.reposts,
        "engagement_score": engagement_score,
    }
    if embedding:
        data["embedding"] = embedding

    updated = update_engagement(post_id, data)
    return {"post": updated, "engagement_score": engagement_score}


@app.delete("/api/posts/{post_id}")
async def delete_post(post_id: str):
    post = get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    soft_delete_post(post_id)
    return {"message": "Post deleted"}


@app.get("/api/analytics")
async def analytics():
    cached = get_analytics_cache()
    if cached:
        return cached

    data = get_analytics_data()
    set_analytics_cache(data, ttl=300)
    return data


@app.post("/api/regenerate/{post_id}")
async def regenerate(request: Request, post_id: str):
    post = get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests.")

    session_id = str(uuid.uuid4())
    job_data = {
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "input": {
            "topic": post.get("topic", ""),
            "tone": post.get("tone", "thought-leadership"),
            "cta": post.get("cta", ""),
            "length": post.get("length", "medium"),
            "include_hashtags": post.get("include_hashtags", True),
            "session_id": session_id,
            "research_context": "",
            "similar_past_posts": [],
            "style_vector_guidance": "",
            "draft_a": "",
            "draft_b": "",
            "critique_a": {},
            "critique_b": {},
            "optimised_a": "",
            "optimised_b": "",
            "virality_score_a": 0.0,
            "virality_score_b": 0.0,
            "final_post": "",
            "winning_variant": "",
            "post_id": None,
            "business_impact_score": 0.0,
            "business_impact_rationale": "",
        },
        "post_id": None,
    }
    set_job(session_id, job_data)
    return {"session_id": session_id}


class TopicScoreRequest(BaseModel):
    title: str
    rationale: str = ""
    suggested_tone: str = "thought-leadership"


@app.post("/api/topics/score")
async def score_topic_idea(body: TopicScoreRequest):
    from langchain_core.messages import HumanMessage
    import json as _json
    import re as _re
    llm = _make_llm(temperature=0.4, max_output_tokens=700)
    prompt = TOPIC_SCORE_PROMPT.format(
        title=body.title,
        rationale=body.rationale or "No rationale provided.",
        tone=body.suggested_tone,
    )
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    content = response.content if isinstance(response.content, str) else str(response.content)
    try:
        text = content
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
        result = _json.loads(text.strip())
    except Exception:
        match = _re.search(r"\{.*\}", content, _re.DOTALL)
        try:
            result = _json.loads(match.group()) if match else {}
        except Exception:
            result = {}
    return {
        "company_impact": float(result.get("company_impact", 60)),
        "company_impact_reason": str(result.get("company_impact_reason", "")),
        "virality_potential": float(result.get("virality_potential", 60)),
        "virality_reason": str(result.get("virality_reason", "")),
    }


class TopicStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|used|archived)$")
    post_id: str = Field(default="")


@app.get("/api/topics")
async def get_topics(status: str = Query(default=None)):
    topics = list_topics(status=status or None)
    return {"topics": topics}


@app.post("/api/topics/generate")
async def generate_topics(request: Request, count: int = Query(default=6, ge=1, le=10)):
    import asyncio
    from langchain_core.messages import HumanMessage
    import json as _json
    import re as _re

    client_ip = request.client.host if request.client else "unknown"
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests.")

    recent = get_recent_post_topics(n=15)
    recent_str = "\n".join(f"- {t}" for t in recent) if recent else "None yet"

    # Step 1 — generate topics
    llm = _make_llm(temperature=0.9, max_output_tokens=1500)
    prompt = TOPIC_GENERATION_PROMPT.format(count=count, recent_topics=recent_str)
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    content = response.content if isinstance(response.content, str) else str(response.content)

    def _parse_json_list(text: str) -> list:
        try:
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            result = _json.loads(text.strip())
            if isinstance(result, list):
                return result
        except Exception:
            pass
        match = _re.search(r"\[.*\]", text, _re.DOTALL)
        if match:
            try:
                return _json.loads(match.group())
            except Exception:
                pass
        return []

    def _parse_json_obj(text: str) -> dict:
        try:
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0]
            elif "```" in text:
                text = text.split("```")[1].split("```")[0]
            return _json.loads(text.strip())
        except Exception:
            pass
        match = _re.search(r"\{.*\}", text, _re.DOTALL)
        if match:
            try:
                return _json.loads(match.group())
            except Exception:
                pass
        return {}

    topics_raw = [t for t in _parse_json_list(content) if t.get("title")]

    # Step 2 — score all topics in parallel
    async def _score_one(t: dict) -> dict:
        try:
            score_llm = _make_llm(temperature=0.4, max_output_tokens=700)
            score_prompt = TOPIC_SCORE_PROMPT.format(
                title=t.get("title", ""),
                rationale=t.get("rationale", ""),
                tone=t.get("suggested_tone", "thought-leadership"),
            )
            r = await score_llm.ainvoke([HumanMessage(content=score_prompt)])
            c = r.content if isinstance(r.content, str) else str(r.content)
            s = _parse_json_obj(c)
            return {
                "company_impact": float(s.get("company_impact", 60)),
                "company_impact_reason": str(s.get("company_impact_reason", "")),
                "virality_potential": float(s.get("virality_potential", 60)),
                "virality_reason": str(s.get("virality_reason", "")),
            }
        except Exception:
            return {"company_impact": 0.0, "company_impact_reason": "", "virality_potential": 0.0, "virality_reason": ""}

    scores_list = await asyncio.gather(*[_score_one(t) for t in topics_raw])

    to_save = [
        {
            "title": t.get("title", ""),
            "rationale": t.get("rationale", ""),
            "suggested_tone": t.get("suggested_tone", "thought-leadership"),
            "priority_score": int(t.get("priority_score", 5)),
            "status": "pending",
            **scores_list[i],
        }
        for i, t in enumerate(topics_raw)
    ]

    saved = save_topics(to_save)

    # If DB save failed (e.g. topics table not yet created), still return generated topics
    if not saved and to_save:
        raise HTTPException(
            status_code=500,
            detail="Topics generated but could not be saved. Please run the V2 Supabase migrations (ALTER TABLE + CREATE TABLE topics) from supabase_migrations.sql then try again."
        )

    return {"topics": saved, "count": len(saved)}


@app.delete("/api/topics/{topic_id}")
async def remove_topic(topic_id: str):
    delete_topic(topic_id)
    return {"message": "Topic deleted"}


@app.patch("/api/topics/{topic_id}")
async def patch_topic(topic_id: str, body: TopicStatusUpdate):
    data: dict = {"status": body.status}
    if body.status == "used":
        data["used_at"] = datetime.now(timezone.utc).isoformat()
        if body.post_id:
            data["post_id"] = body.post_id
    updated = update_topic(topic_id, data)
    return updated


@app.post("/api/refine")
async def refine_post(body: RefineRequest):
    from langchain_core.messages import HumanMessage
    llm = _make_llm(temperature=0.7, max_output_tokens=4096)
    prompt = REFINE_PROMPT.format(post=body.post, feedback=body.feedback)
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    refined = response.content if isinstance(response.content, str) else str(response.content)
    return {"refined_post": refined}
