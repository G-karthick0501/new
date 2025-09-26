# core/vector_store.py
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from core.chunking_similarity import get_embeddings

class SimpleVectorStore:
    def __init__(self):
        self.chunks = []
        self.embeddings = None

    def add(self, chunks: list[str]):
        embeds = get_embeddings(chunks).cpu().numpy()
        if self.embeddings is None:
            self.embeddings = embeds
        else:
            self.embeddings = np.vstack([self.embeddings, embeds])
        self.chunks.extend(chunks)

    def search(self, query: str, top_k: int = 3):
        query_emb = get_embeddings([query]).cpu().numpy()
        sims = cosine_similarity(query_emb, self.embeddings)[0]
        indices = np.argsort(sims)[-top_k:][::-1]
        return [(self.chunks[i], float(sims[i])) for i in indices]
