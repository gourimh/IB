import os
from typing import Any, Optional
from supabase import create_client, Client

_client: Client | None = None


def _supabase_configured() -> bool:
    return bool(os.getenv("SUPABASE_URL", "").strip() and os.getenv("SUPABASE_SERVICE_KEY", "").strip())


def get_supabase() -> Client:
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_KEY", "")
        if not url or not key:
            raise RuntimeError("SUPABASE not configured — add SUPABASE_URL and SUPABASE_SERVICE_KEY to backend/.env")
        _client = create_client(url, key)
    return _client


def save_post(data: dict) -> dict:
    if not _supabase_configured():
        return {"id": "local-" + str(abs(hash(data.get("topic", ""))))[:8]}
    sb = get_supabase()
    try:
        result = sb.table("posts").insert(data).execute()
        return result.data[0] if result.data else {}
    except Exception:
        # Retry without v2 columns in case migrations haven't been run yet
        v2_cols = {"business_impact_score", "business_impact_rationale"}
        fallback = {k: v for k, v in data.items() if k not in v2_cols}
        try:
            result = sb.table("posts").insert(fallback).execute()
            return result.data[0] if result.data else {}
        except Exception as e:
            print(f"[supabase] save_post failed: {e}")
            return {}


def get_post_by_id(post_id: str) -> Optional[dict]:
    if not _supabase_configured():
        return None
    sb = get_supabase()
    result = sb.table("posts").select("*").eq("id", post_id).is_("deleted_at", "null").single().execute()
    return result.data


def list_posts(page: int = 1, limit: int = 20, tone: Optional[str] = None) -> tuple[list[dict], int]:
    if not _supabase_configured():
        return [], 0
    sb = get_supabase()
    offset = (page - 1) * limit
    query = sb.table("posts").select("*", count="exact").is_("deleted_at", "null")
    if tone:
        query = query.eq("tone", tone)
    result = query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    return result.data, result.count or 0


def similarity_search(embedding: list[float], limit: int = 10) -> list[dict]:
    if not _supabase_configured():
        return []
    sb = get_supabase()
    result = sb.rpc("match_posts", {"query_embedding": embedding, "match_count": limit}).execute()
    return result.data or []


def get_top_posts_for_context(n: int = 5) -> list[dict]:
    if not _supabase_configured():
        return []
    sb = get_supabase()
    result = (
        sb.table("posts")
        .select("id, topic, final_post, tone, virality_score_a, virality_score_b, engagement_score")
        .is_("deleted_at", "null")
        .order("engagement_score", desc=True)
        .limit(n)
        .execute()
    )
    return result.data or []


def update_engagement(post_id: str, data: dict) -> dict:
    if not _supabase_configured():
        return {}
    sb = get_supabase()
    result = sb.table("posts").update(data).eq("id", post_id).execute()
    return result.data[0] if result.data else {}


def soft_delete_post(post_id: str) -> None:
    if not _supabase_configured():
        return
    sb = get_supabase()
    from datetime import datetime, timezone
    sb.table("posts").update({"deleted_at": datetime.now(timezone.utc).isoformat()}).eq("id", post_id).execute()


def list_topics(status: str | None = None) -> list[dict]:
    if not _supabase_configured():
        return []
    try:
        sb = get_supabase()
        query = sb.table("topics").select("*")
        if status:
            query = query.eq("status", status)
        result = query.order("priority_score", desc=True).order("created_at", desc=True).execute()
        return result.data or []
    except Exception as e:
        print(f"[supabase] list_topics failed: {e}")
        return []


def save_topics(topics: list[dict]) -> list[dict]:
    if not _supabase_configured():
        return []
    try:
        sb = get_supabase()
        result = sb.table("topics").insert(topics).execute()
        return result.data or []
    except Exception as e:
        print(f"[supabase] save_topics failed: {e}")
        return []


def update_topic(topic_id: str, data: dict) -> dict:
    if not _supabase_configured():
        return {}
    try:
        sb = get_supabase()
        result = sb.table("topics").update(data).eq("id", topic_id).execute()
        return result.data[0] if result.data else {}
    except Exception as e:
        print(f"[supabase] update_topic failed: {e}")
        return {}


def delete_topic(topic_id: str) -> None:
    if not _supabase_configured():
        return
    sb = get_supabase()
    sb.table("topics").delete().eq("id", topic_id).execute()


def get_recent_post_topics(n: int = 15) -> list[str]:
    if not _supabase_configured():
        return []
    sb = get_supabase()
    result = (
        sb.table("posts")
        .select("topic")
        .is_("deleted_at", "null")
        .order("created_at", desc=True)
        .limit(n)
        .execute()
    )
    return [r["topic"] for r in (result.data or []) if r.get("topic")]


def get_analytics_data() -> dict:
    if not _supabase_configured():
        return {
            "total_posts": 0, "avg_virality_score": 0, "avg_engagement_score": 0,
            "best_tone": None, "posts_this_week": 0, "posts_this_month": 0,
            "tone_breakdown": {}, "top_posts": [], "best_performing_post": None,
            "score_over_time": [],
        }
    sb = get_supabase()

    all_posts = (
        sb.table("posts")
        .select("tone, virality_score_a, virality_score_b, winning_variant, engagement_score, created_at")
        .is_("deleted_at", "null")
        .execute()
    )
    posts = all_posts.data or []

    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    total_posts = len(posts)
    posts_this_week = sum(1 for p in posts if p.get("created_at") and p["created_at"] >= week_ago.isoformat())
    posts_this_month = sum(1 for p in posts if p.get("created_at") and p["created_at"] >= month_ago.isoformat())

    scores = []
    for p in posts:
        v = p.get("winning_variant")
        if v == "A" and p.get("virality_score_a"):
            scores.append(p["virality_score_a"])
        elif v == "B" and p.get("virality_score_b"):
            scores.append(p["virality_score_b"])

    avg_virality = round(sum(scores) / len(scores), 1) if scores else 0

    eng_scores = [p["engagement_score"] for p in posts if p.get("engagement_score")]
    avg_engagement = round(sum(eng_scores) / len(eng_scores), 2) if eng_scores else 0

    tone_breakdown: dict[str, int] = {}
    for p in posts:
        t = p.get("tone", "unknown")
        tone_breakdown[t] = tone_breakdown.get(t, 0) + 1

    top_tone = max(tone_breakdown, key=tone_breakdown.get) if tone_breakdown else None

    top_posts_result = (
        sb.table("posts")
        .select("id, topic, tone, virality_score_a, virality_score_b, winning_variant, engagement_score, created_at")
        .is_("deleted_at", "null")
        .order("engagement_score", desc=True)
        .limit(5)
        .execute()
    )

    best_post_result = (
        sb.table("posts")
        .select("id, topic, tone, engagement_score, final_post")
        .is_("deleted_at", "null")
        .order("engagement_score", desc=True)
        .limit(1)
        .execute()
    )

    score_over_time_result = (
        sb.table("posts")
        .select("created_at, virality_score_a, virality_score_b, winning_variant")
        .is_("deleted_at", "null")
        .order("created_at", desc=False)
        .limit(50)
        .execute()
    )

    score_over_time = []
    for p in (score_over_time_result.data or []):
        v = p.get("winning_variant")
        score = p.get("virality_score_a") if v == "A" else p.get("virality_score_b")
        score_over_time.append({"date": p.get("created_at", "")[:10], "score": score or 0})

    return {
        "total_posts": total_posts,
        "avg_virality_score": avg_virality,
        "avg_engagement_score": avg_engagement,
        "best_tone": top_tone,
        "posts_this_week": posts_this_week,
        "posts_this_month": posts_this_month,
        "tone_breakdown": tone_breakdown,
        "top_posts": top_posts_result.data or [],
        "best_performing_post": best_post_result.data[0] if best_post_result.data else None,
        "score_over_time": score_over_time,
    }
