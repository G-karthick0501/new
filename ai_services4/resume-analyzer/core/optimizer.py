import re
import json
from core.gemini_client import call_gemini_ai
from core.chunking_similarity import chunk_text, retrieve_relevant_chunks_enhanced

def optimize_resume(resume_text: str, jd_text: str, before_metrics: dict) -> dict:
    try:
        # Chunk resume
        resume_chunks = chunk_text(resume_text, chunk_size=150)
        
        # RAG Retrieval
        retrieved = retrieve_relevant_chunks_enhanced(resume_chunks, jd_text, top_k=5)
        
        if retrieved:
            context_parts = []
            for item in retrieved:
                context_parts.append(f"[Score: {item['score']:.2f}] {item['content']}")
            relevant_context = "\n\n".join(context_parts)
        else:
            relevant_context = resume_text
        
        # Enhanced prompt
        prompt = f"""
You are an expert career coach. Optimize this resume using the most relevant parts.

RELEVANT RESUME CONTENT:
{relevant_context}

JOB DESCRIPTION:
{jd_text}

ANALYSIS:
{before_metrics}

Return JSON with:
- "optimized_resume_text": improved resume content
- "missing_skills": skills from JD not in resume
- "improvement_tips": actionable advice

Return ONLY the JSON object.
"""
        
        response_text = call_gemini_ai(prompt)
        
        # Parse response
        match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        else:
            return {
                "optimized_resume_text": response_text.strip(),
                "missing_skills": [],
                "improvement_tips": []
            }
    
    except Exception as e:
        return {
            "optimized_resume_text": resume_text,
            "missing_skills": [],
            "improvement_tips": []
        }