from sentence_transformers import SentenceTransformer, util
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer("all-MiniLM-L6-v2")

def chunk_text(text: str, chunk_size: int = 150) -> list[str]:
    words = text.split()
    return [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]

def get_embeddings(chunks: list[str]) -> np.ndarray:
    return model.encode(chunks, convert_to_tensor=True)

def compute_similarity(resume_embeds, jd_embeds) -> np.ndarray:
    return util.cos_sim(resume_embeds, jd_embeds).cpu().numpy()

def compute_missing(similarity_matrix: np.ndarray, resume_chunks: list[str], jd_chunks: list[str], threshold: float = 0.6):
    missing_info = {"missing_chunks": []}
    for jd_idx, jd_chunk in enumerate(jd_chunks):
        sim_scores = similarity_matrix[:, jd_idx]
        if sim_scores.max() < threshold:
            missing_info["missing_chunks"].append(jd_chunk)
    return missing_info

def compute_after_metrics(optimized_resume_text: str, jd_chunks: list[str]):
    resume_chunks = chunk_text(optimized_resume_text)
    resume_embeds = get_embeddings(resume_chunks)
    jd_embeds = get_embeddings(jd_chunks)
    similarity_matrix = compute_similarity(resume_embeds, jd_embeds)
    return compute_missing(similarity_matrix, resume_chunks, jd_chunks)

# Enhanced RAG Components
class SimpleVectorStore:
    def __init__(self):
        self.chunks = []
        self.embeddings = None
        self.metadata = []

    def add(self, chunks: list[str], sources: list[str] = None):
        embeds = get_embeddings(chunks).cpu().numpy()
        if self.embeddings is None:
            self.embeddings = embeds
        else:
            self.embeddings = np.vstack([self.embeddings, embeds])
        self.chunks.extend(chunks)
        self.metadata.extend(sources or [f"chunk_{i}" for i in range(len(chunks))])

    def search(self, query: str, top_k: int = 3):
        query_emb = get_embeddings([query]).cpu().numpy()
        sims = cosine_similarity(query_emb, self.embeddings)[0]
        indices = np.argsort(sims)[-top_k:][::-1]
        return [{"content": self.chunks[i], "score": float(sims[i]), "source": self.metadata[i]} for i in indices]

def retrieve_relevant_chunks_enhanced(resume_chunks, jd_text, top_k=5):
    store = SimpleVectorStore()
    store.add(resume_chunks)
    
    # Search with full JD
    jd_results = store.search(jd_text, top_k=3)
    
    # Search with JD keywords
    jd_words = [w for w in jd_text.lower().split() if len(w) > 4][:5]
    keyword_results = []
    for word in jd_words:
        keyword_results.extend(store.search(word, top_k=1))
    
    # Combine and deduplicate
    all_results = jd_results + keyword_results
    seen = set()
    unique_results = []
    for result in all_results:
        if result['content'] not in seen:
            seen.add(result['content'])
            unique_results.append(result)
    
    unique_results.sort(key=lambda x: x['score'], reverse=True)
    return unique_results[:top_k]