EMBEDDING_DIM = 768


async def embed_text(text: str) -> list[float]:
    raise NotImplementedError("Embeddings not configured — semantic search disabled")


async def embed_texts(texts: list[str]) -> list[list[float]]:
    raise NotImplementedError("Embeddings not configured — semantic search disabled")
