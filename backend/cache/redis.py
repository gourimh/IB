import os
import json
import time
from typing import Any, Optional

_memory: dict = {}
_expiry: dict = {}

def _use_memory() -> bool:
    return not (os.getenv("UPSTASH_REDIS_URL", "").strip() and os.getenv("UPSTASH_REDIS_TOKEN", "").strip())


def _mem_get(key: str) -> Optional[str]:
    exp = _expiry.get(key)
    if exp and time.time() > exp:
        _memory.pop(key, None)
        _expiry.pop(key, None)
        return None
    return _memory.get(key)


def _mem_set(key: str, value: str, ttl: int = 3600) -> None:
    _memory[key] = value
    _expiry[key] = time.time() + ttl


def _mem_incr(key: str, ttl: int = 60) -> int:
    exp = _expiry.get(key)
    if exp and time.time() > exp:
        _memory.pop(key, None)
        _expiry.pop(key, None)
    current = int(_memory.get(key, 0)) + 1
    _memory[key] = str(current)
    if key not in _expiry:
        _expiry[key] = time.time() + ttl
    return current


def _get_redis():
    from upstash_redis import Redis
    url = os.getenv("UPSTASH_REDIS_URL", "")
    token = os.getenv("UPSTASH_REDIS_TOKEN", "")
    return Redis(url=url, token=token)


def set_job(session_id: str, data: dict, ttl: int = 3600) -> None:
    val = json.dumps(data)
    if _use_memory():
        _mem_set(f"job:{session_id}", val, ttl)
    else:
        _get_redis().set(f"job:{session_id}", val, ex=ttl)


def get_job(session_id: str) -> Optional[dict]:
    if _use_memory():
        raw = _mem_get(f"job:{session_id}")
    else:
        raw = _get_redis().get(f"job:{session_id}")
    if raw is None:
        return None
    if isinstance(raw, str):
        return json.loads(raw)
    return raw


def update_job_status(session_id: str, status: str, extra: dict | None = None) -> None:
    job = get_job(session_id)
    if job is None:
        return
    job["status"] = status
    if extra:
        job.update(extra)
    set_job(session_id, job)


def check_rate_limit(ip: str, max_requests: int = 10, window: int = 60) -> bool:
    if _use_memory():
        count = _mem_incr(f"rate_limit:{ip}", ttl=window)
    else:
        r = _get_redis()
        key = f"rate_limit:{ip}"
        count = r.incr(key)
        if int(count) == 1:
            r.expire(key, window)
    return int(count) <= max_requests


def get_analytics_cache() -> Optional[dict]:
    if _use_memory():
        raw = _mem_get("analytics_cache")
    else:
        raw = _get_redis().get("analytics_cache")
    if raw is None:
        return None
    if isinstance(raw, str):
        return json.loads(raw)
    return raw


def set_analytics_cache(data: dict, ttl: int = 300) -> None:
    val = json.dumps(data)
    if _use_memory():
        _mem_set("analytics_cache", val, ttl)
    else:
        _get_redis().set("analytics_cache", val, ex=ttl)


def get_chat_history(session_id: str) -> list[dict]:
    if _use_memory():
        raw = _mem_get(f"chat:{session_id}")
    else:
        raw = _get_redis().get(f"chat:{session_id}")
    if raw is None:
        return []
    if isinstance(raw, str):
        return json.loads(raw)
    return raw


def save_chat_history(session_id: str, history: list[dict], ttl: int = 86400) -> None:
    val = json.dumps(history)
    if _use_memory():
        _mem_set(f"chat:{session_id}", val, ttl)
    else:
        _get_redis().set(f"chat:{session_id}", val, ex=ttl)


def clear_chat_history(session_id: str) -> None:
    if _use_memory():
        _memory.pop(f"chat:{session_id}", None)
        _expiry.pop(f"chat:{session_id}", None)
    else:
        _get_redis().delete(f"chat:{session_id}")
