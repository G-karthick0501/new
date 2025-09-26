# core/retriever.py
from core.vector_store import SimpleVectorStore

def retrieve_relevant_chunks(resume_chunks, jd_text, top_k=5):
    store = SimpleVectorStore()
    store.add(resume_chunks)
    return store.search(jd_text, top_k=top_k)
