"""
Zero-cost RAG retrieval: local sentence-transformers embeddings + numpy
cosine similarity. No Pinecone/Weaviate service, no per-call embedding cost.

For hackathon scale (dozens of docs) this is instant and free. If you
outgrow it, swap in pgvector later without changing the calling code much.
"""
import numpy as np
from sentence_transformers import SentenceTransformer

_model = None


def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def embed_texts(texts: list[str]) -> np.ndarray:
    return get_model().encode(texts, normalize_embeddings=True)


def retrieve(query: str, chunks: list[dict], top_k: int = 5) -> list[dict]:
    """
    chunks: list of {"text": ..., "document_id": ..., "filename": ...}
    Returns top_k chunks with a similarity score, for citation + confidence.
    """
    if not chunks:
        return []

    query_vec = embed_texts([query])[0]
    chunk_vecs = embed_texts([c["text"] for c in chunks])

    scores = chunk_vecs @ query_vec  # cosine similarity (vectors are normalized)

    ranked = sorted(zip(chunks, scores), key=lambda cs: cs[1], reverse=True)[:top_k]

    return [{**c, "similarity": float(s)} for c, s in ranked]


def chunk_document_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Simple sliding-window chunking by characters -- good enough for a hackathon."""
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks
