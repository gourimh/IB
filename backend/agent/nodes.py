import os
import json
import re

from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from .state import AgentState
from .prompts import (
    INFINITYBOX_SYSTEM_PROMPT,
    DRAFT_GENERATION_PROMPT,
    CRITIQUE_PROMPT,
    OPTIMISE_PROMPT,
    SCORE_PROMPT,
    LENGTH_CHARS,
)
from db.supabase import get_top_posts_for_context, similarity_search, save_post
from db.embeddings import embed_text

MODEL = "llama-3.3-70b-versatile"


def _make_llm(temperature: float = 0.7, max_output_tokens: int = 4096) -> ChatGroq:
    return ChatGroq(
        model=MODEL,
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=temperature,
        max_tokens=max_output_tokens,
    )


def _system() -> SystemMessage:
    return SystemMessage(content=INFINITYBOX_SYSTEM_PROMPT)


def _parse_drafts(content: str) -> tuple[str, str]:
    a_match = re.search(r"=== DRAFT A START ===(.*?)=== DRAFT A END ===", content, re.DOTALL)
    b_match = re.search(r"=== DRAFT B START ===(.*?)=== DRAFT B END ===", content, re.DOTALL)
    draft_a = a_match.group(1).strip() if a_match else content
    draft_b = b_match.group(1).strip() if b_match else content
    return draft_a, draft_b


def _parse_json_response(content: str) -> dict:
    text = content
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        text = text.split("```")[1].split("```")[0]
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        json_match = re.search(r"\{.*\}", text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass
        return {}


async def context_loader(state: AgentState) -> dict:
    top_posts = get_top_posts_for_context(n=5)

    similar_posts: list[dict] = []
    try:
        topic_embedding = await embed_text(state["topic"])
        similar_posts = similarity_search(topic_embedding, limit=3)
    except Exception:
        similar_posts = []

    if top_posts:
        tones = list({p.get("tone", "") for p in top_posts if p.get("tone")})
        style_guidance = (
            f"Top performing posts use these tones: {', '.join(tones)}. "
            f"They open with a provocative question or a specific number. "
            f"Bullet-point breakdowns of costs/benefits perform best."
        )
    else:
        style_guidance = (
            "No historical posts yet. Use the proven InfinityBox post structure: "
            "Hook → Hidden insight → Bullet breakdown → Systemic reframe → CTA → Hashtags."
        )

    return {
        "similar_past_posts": similar_posts,
        "style_vector_guidance": style_guidance,
        "research_context": state.get("research_context", ""),
    }


async def research_node(state: AgentState) -> dict:
    tavily_key = os.getenv("TAVILY_API_KEY", "")
    if not tavily_key:
        return {"research_context": ""}

    try:
        from tavily import AsyncTavilyClient
        client = AsyncTavilyClient(api_key=tavily_key)
        results = await client.search(
            query=f"InfinityBox B2B hygiene cafeteria operations India {state['topic']}",
            max_results=5,
            search_depth="basic",
        )
        contents = [
            r.get("content", "")[:300]
            for r in results.get("results", [])[:4]
            if r.get("content")
        ]
        research_text = (
            "RELEVANT RESEARCH:\n" + "\n\n".join(f"• {c}" for c in contents)
            if contents else ""
        )
        research_text = research_text[:1200]
    except Exception:
        research_text = ""

    return {"research_context": research_text}


async def draft_node(state: AgentState) -> dict:
    llm = _make_llm(temperature=0.8, max_output_tokens=2500)

    length = state.get("length", "medium")
    cta = state.get("cta") or "Comment below or DM me to learn more"

    prompt = DRAFT_GENERATION_PROMPT.format(
        topic=state["topic"],
        tone=state.get("tone", "thought-leadership"),
        length=length,
        length_chars=LENGTH_CHARS.get(length, LENGTH_CHARS["medium"]),
        cta=cta,
        include_hashtags=state.get("include_hashtags", True),
        research_context=state.get("research_context") or "No additional research available.",
        style_guidance=state.get("style_vector_guidance") or "Use the proven InfinityBox post structure.",
    )

    response = await llm.ainvoke([_system(), HumanMessage(content=prompt)])
    content = response.content if isinstance(response.content, str) else str(response.content)

    draft_a, draft_b = _parse_drafts(content)
    return {"draft_a": draft_a, "draft_b": draft_b}


async def critique_node(state: AgentState) -> dict:
    llm = _make_llm(temperature=0.3, max_output_tokens=500)

    async def critique_one(post: str) -> dict:
        response = await llm.ainvoke([HumanMessage(content=CRITIQUE_PROMPT.format(post=post))])
        content = response.content if isinstance(response.content, str) else str(response.content)
        return _parse_json_response(content)

    critique_a = await critique_one(state.get("draft_a", ""))
    critique_b = await critique_one(state.get("draft_b", ""))
    return {"critique_a": critique_a, "critique_b": critique_b}


async def optimise_node(state: AgentState) -> dict:
    llm = _make_llm(temperature=0.7, max_output_tokens=1500)

    async def optimise_one(post: str, critique: dict) -> str:
        prompt = OPTIMISE_PROMPT.format(post=post, critique=json.dumps(critique, indent=2))
        response = await llm.ainvoke([_system(), HumanMessage(content=prompt)])
        return response.content if isinstance(response.content, str) else str(response.content)

    optimised_a = await optimise_one(state.get("draft_a", ""), state.get("critique_a", {}))
    optimised_b = await optimise_one(state.get("draft_b", ""), state.get("critique_b", {}))
    return {"optimised_a": optimised_a, "optimised_b": optimised_b}


async def score_node(state: AgentState) -> dict:
    llm = _make_llm(temperature=0.1, max_output_tokens=400)

    prompt = SCORE_PROMPT.format(
        post_a=state.get("optimised_a", state.get("draft_a", "")),
        post_b=state.get("optimised_b", state.get("draft_b", "")),
    )
    response = await llm.ainvoke([HumanMessage(content=prompt)])
    content = response.content if isinstance(response.content, str) else str(response.content)
    scores = _parse_json_response(content)

    score_a = float(scores.get("score_a", 70.0))
    score_b = float(scores.get("score_b", 70.0))
    winner = "A" if score_a >= score_b else "B"
    final_post = state.get("optimised_a", "") if winner == "A" else state.get("optimised_b", "")

    return {
        "virality_score_a": score_a,
        "virality_score_b": score_b,
        "winning_variant": winner,
        "final_post": final_post,
    }


async def save_node(state: AgentState) -> dict:
    final_post = state.get("final_post", "")

    try:
        embedding = await embed_text(final_post)
    except Exception:
        embedding = None

    saved = save_post({
        "session_id": state["session_id"],
        "topic": state["topic"],
        "tone": state.get("tone", "thought-leadership"),
        "cta": state.get("cta", ""),
        "length": state.get("length", "medium"),
        "include_hashtags": state.get("include_hashtags", True),
        "draft_a": state.get("draft_a", ""),
        "draft_b": state.get("draft_b", ""),
        "final_post": final_post,
        "winning_variant": state.get("winning_variant", "A"),
        "virality_score_a": state.get("virality_score_a", 0),
        "virality_score_b": state.get("virality_score_b", 0),
        "critique_a": state.get("critique_a", {}),
        "critique_b": state.get("critique_b", {}),
        "research_context": state.get("research_context", ""),
        "embedding": embedding,
    })

    return {"post_id": saved.get("id", "")}
