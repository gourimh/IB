from langgraph.graph import StateGraph, END

from .state import AgentState
from .nodes import (
    context_loader,
    research_node,
    draft_node,
    critique_node,
    optimise_node,
    score_node,
    save_node,
)


def create_graph():
    builder = StateGraph(AgentState)

    builder.add_node("context_loader", context_loader)
    builder.add_node("research_node", research_node)
    builder.add_node("draft_node", draft_node)
    builder.add_node("critique_node", critique_node)
    builder.add_node("optimise_node", optimise_node)
    builder.add_node("score_node", score_node)
    builder.add_node("save_node", save_node)

    builder.set_entry_point("context_loader")
    builder.add_edge("context_loader", "research_node")
    builder.add_edge("research_node", "draft_node")
    builder.add_edge("draft_node", "critique_node")
    builder.add_edge("critique_node", "optimise_node")
    builder.add_edge("optimise_node", "score_node")
    builder.add_edge("score_node", "save_node")
    builder.add_edge("save_node", END)

    return builder.compile()


GRAPH_NODE_NAMES = {
    "context_loader",
    "research_node",
    "draft_node",
    "critique_node",
    "optimise_node",
    "score_node",
    "save_node",
}

STREAMING_NODES = {"draft_node", "optimise_node"}
