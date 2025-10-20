import whisper
import os
from fastapi.responses import JSONResponse
from fastapi import FastAPI, UploadFile, File, Form
from typing import List, Optional
import json
from core import optimizer, chunking_similarity as cs
from services import preprocessing
from utils.file_utils import extract_text_from_pdf

app = FastAPI(title="Resume Analyzer")

# ============================================
# 🆕 ENDPOINT 1: ANALYZE SKILLS ONLY
# ============================================
@app.post("/analyze-skills")
async def analyze_skills(
    resume_file: UploadFile = File(...), 
    jd_file: UploadFile = File(...)
):
    """
    Step 1: Analyze resume and identify missing skills.
    Does NOT generate optimized resume yet.
    """
    try:
        print("🎯 /analyze-skills called")
        
        # Extract and preprocess text
        resume_text = preprocessing.clean_text(extract_text_from_pdf(resume_file))
        jd_text = preprocessing.clean_text(extract_text_from_pdf(jd_file))
        
        original_resume_text = resume_text

        clean_resume = preprocessing.lemmatize_text(resume_text)
        clean_jd = preprocessing.lemmatize_text(jd_text)

        print(f"📄 Resume length: {len(resume_text)} chars")
        print(f"📄 JD length: {len(jd_text)} chars")

        # Chunking & embeddings
        resume_chunks = cs.chunk_text(clean_resume)
        jd_chunks = cs.chunk_text(clean_jd)

        print(f"📦 Resume chunks: {len(resume_chunks)}")
        print(f"📦 JD chunks: {len(jd_chunks)}")

        resume_embeds = cs.get_embeddings(resume_chunks)
        jd_embeds = cs.get_embeddings(jd_chunks)

        # Compute similarity and missing chunks
        similarity_matrix = cs.compute_similarity(resume_embeds, jd_embeds)
        before_metrics = cs.compute_missing(similarity_matrix, resume_chunks, jd_chunks)

        print(f"📊 Missing chunks: {len(before_metrics.get('missing_chunks', []))}")

        # Extract missing skills from JD (NOT optimization yet!)
        missing_skills = optimizer.extract_missing_skills(clean_resume, clean_jd, before_metrics)
        improvement_tips = optimizer.generate_improvement_tips(before_metrics)

        print(f"✅ Missing skills identified: {len(missing_skills)}")
        print(f"✅ Improvement tips: {len(improvement_tips)}")

        return {
            "success": True,
            "missing_skills": missing_skills,
            "improvement_tips": improvement_tips,
            "before_missing_chunks": before_metrics.get("missing_chunks", []),
            "original_resume_text": original_resume_text,
            "message": "Analysis complete. Select skills to add, then call /optimize-with-skills"
        }

    except Exception as e:
        print(f"❌ Error in /analyze-skills: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "missing_skills": [],
            "improvement_tips": [],
            "before_missing_chunks": [],
            "original_resume_text": ""
        }


# ============================================
# 🆕 ENDPOINT 2: OPTIMIZE WITH SELECTED SKILLS
# ============================================
@app.post("/optimize-with-skills")
async def optimize_with_skills(
    resume_file: UploadFile = File(...),
    jd_file: UploadFile = File(...),
    selected_skills: str = Form(...)  # JSON string of selected skills
):
    """
    Step 2: Generate optimized resume using ONLY the selected skills.
    """
    try:
        print("🎯 /optimize-with-skills called")
        
        # Parse selected skills
        skills_list = json.loads(selected_skills)
        print(f"✅ Selected skills ({len(skills_list)}): {skills_list}")

        # Extract and preprocess text
        resume_text = preprocessing.clean_text(extract_text_from_pdf(resume_file))
        jd_text = preprocessing.clean_text(extract_text_from_pdf(jd_file))
        
        clean_resume = preprocessing.lemmatize_text(resume_text)
        clean_jd = preprocessing.lemmatize_text(jd_text)

        # Chunking for context
        resume_chunks = cs.chunk_text(clean_resume)
        jd_chunks = cs.chunk_text(clean_jd)

        resume_embeds = cs.get_embeddings(resume_chunks)
        jd_embeds = cs.get_embeddings(jd_chunks)

        similarity_matrix = cs.compute_similarity(resume_embeds, jd_embeds)
        before_metrics = cs.compute_missing(similarity_matrix, resume_chunks, jd_chunks)

        print(f"📦 Before optimization - Missing chunks: {len(before_metrics.get('missing_chunks', []))}")

        # Generate optimized resume with ONLY selected skills
        gemini_output = optimizer.optimize_resume_with_selected_skills(
            clean_resume, 
            clean_jd, 
            before_metrics,
            skills_list  # Pass selected skills
        )

        # Compute after metrics
        optimized_text = gemini_output.get("optimized_resume_text", "")
        after_metrics = cs.compute_after_metrics(optimized_text, jd_chunks)

        print(f"📦 After optimization - Missing chunks: {len(after_metrics.get('missing_chunks', []))}")
        print(f"✅ Optimization complete. Resume length: {len(optimized_text)} chars")

        return {
            "success": True,
            "optimized_resume_text": optimized_text,
            "added_skills": skills_list,
            "before_missing_chunks": before_metrics.get("missing_chunks", []),
            "after_missing_chunks": after_metrics.get("missing_chunks", []),
            "improvement": len(before_metrics.get("missing_chunks", [])) - len(after_metrics.get("missing_chunks", [])),
            "message": "Optimization complete with selected skills"
        }

    except Exception as e:
        print(f"❌ Error in /optimize-with-skills: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "optimized_resume_text": "",
            "added_skills": [],
            "before_missing_chunks": [],
            "after_missing_chunks": []
        }


# ============================================
# 🔧 KEEP OLD ENDPOINT FOR BACKWARD COMPATIBILITY (Optional)
# ============================================
@app.post("/analyze")
async def analyze_resume_legacy(
    resume_file: UploadFile = File(...), 
    jd_file: UploadFile = File(...)
):
    """
    Legacy endpoint - kept for backward compatibility.
    Redirects to new two-step flow.
    """
    print("⚠️  /analyze called (legacy endpoint)")
    print("⚠️  Consider using /analyze-skills and /optimize-with-skills instead")
    
    # For now, just do the analysis step
    return await analyze_skills(resume_file, jd_file)
