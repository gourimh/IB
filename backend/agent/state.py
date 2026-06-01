from typing import TypedDict, List, Dict, Optional, Any


class AgentState(TypedDict):
    topic: str
    tone: str
    cta: str
    length: str
    include_hashtags: bool
    research_context: str
    similar_past_posts: List[Dict]
    style_vector_guidance: str
    draft_a: str
    draft_b: str
    critique_a: Dict
    critique_b: Dict
    optimised_a: str
    optimised_b: str
    virality_score_a: float
    virality_score_b: float
    final_post: str
    winning_variant: str
    session_id: str
    post_id: Optional[str]
