# core/semantic_analyzer.py
from sentence_transformers import SentenceTransformer, util
from functools import lru_cache
import hashlib
from typing import List, Optional

class SemanticAnalyzer:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
        self._embedding_cache = {}  # Additional cache for batch operations
        
    def _get_text_hash(self, text: str) -> str:
        """Generate hash for text to use as cache key"""
        return hashlib.md5(text.encode('utf-8')).hexdigest()
    
    @lru_cache(maxsize=1000)
    def _get_cached_embedding(self, text_hash: str, text: str):
        """LRU cached embedding computation"""
        return self.model.encode(text, convert_to_tensor=True)
    
    def get_embedding(self, text: str):
        """Get embedding with caching"""
        text_hash = self._get_text_hash(text)
        return self._get_cached_embedding(text_hash, text)
    
    def get_batch_embeddings(self, texts: List[str]):
        """Get embeddings for multiple texts efficiently"""
        # Check which texts are already cached
        cached_embeddings = []
        uncached_texts = []
        uncached_indices = []
        
        for i, text in enumerate(texts):
            text_hash = self._get_text_hash(text)
            if text_hash in self._embedding_cache:
                cached_embeddings.append((i, self._embedding_cache[text_hash]))
            else:
                uncached_texts.append(text)
                uncached_indices.append(i)
        
        # Compute uncached embeddings in batch
        if uncached_texts:
            new_embeddings = self.model.encode(uncached_texts, convert_to_tensor=True)
            
            # Cache new embeddings
            for text, embedding, idx in zip(uncached_texts, new_embeddings, uncached_indices):
                text_hash = self._get_text_hash(text)
                self._embedding_cache[text_hash] = embedding
                cached_embeddings.append((idx, embedding))
        
        # Sort by original index and return embeddings
        cached_embeddings.sort(key=lambda x: x[0])
        return [emb for _, emb in cached_embeddings]

    def relevance_score(self, question: str, response: str) -> float:
        """Calculate semantic relevance between question and response with caching"""
        try:
            q_emb = self.get_embedding(question)
            r_emb = self.get_embedding(response)
            similarity = util.pytorch_cos_sim(q_emb, r_emb).item()
            
            # Ensure similarity is between 0 and 1
            return max(0.0, min(1.0, similarity))
        except Exception as e:
            print(f"Error computing relevance score: {e}")
            return 0.0

    def topic_coherence(self, response: str) -> float:
        """Calculate topic coherence within response with caching"""
        try:
            # Split into sentences, filter empty ones
            sentences = [s.strip() for s in response.split('.') if s.strip()]
            
            if len(sentences) <= 1:
                return 1.0
            
            # Get embeddings for all sentences efficiently
            embeddings = self.get_batch_embeddings(sentences)
            
            if len(embeddings) <= 1:
                return 1.0
                
            # Compute pairwise similarities
            similarities = []
            for i in range(len(embeddings)):
                for j in range(i + 1, len(embeddings)):
                    sim = util.pytorch_cos_sim(embeddings[i], embeddings[j]).item()
                    similarities.append(sim)
            
            # Return average similarity
            coherence = sum(similarities) / len(similarities) if similarities else 0.0
            return max(0.0, min(1.0, coherence))
            
        except Exception as e:
            print(f"Error computing topic coherence: {e}")
            return 0.0

    def batch_relevance_scores(self, questions: List[str], responses: List[str]) -> List[float]:
        """Compute relevance scores for multiple Q&A pairs efficiently"""
        if len(questions) != len(responses):
            raise ValueError("Questions and responses lists must have same length")
        
        # Get embeddings for all questions and responses in batches
        q_embeddings = self.get_batch_embeddings(questions)
        r_embeddings = self.get_batch_embeddings(responses)
        
        # Compute similarities
        scores = []
        for q_emb, r_emb in zip(q_embeddings, r_embeddings):
            try:
                similarity = util.pytorch_cos_sim(q_emb, r_emb).item()
                scores.append(max(0.0, min(1.0, similarity)))
            except Exception:
                scores.append(0.0)
        
        return scores
    
    def clear_cache(self):
        """Clear embedding cache"""
        self._embedding_cache.clear()
        self._get_cached_embedding.cache_clear()
    
    def get_cache_stats(self) -> dict:
        """Get cache statistics"""
        return {
            "lru_cache_info": self._get_cached_embedding.cache_info()._asdict(),
            "batch_cache_size": len(self._embedding_cache)
        }