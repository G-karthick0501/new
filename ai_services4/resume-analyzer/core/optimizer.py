import re
import json
from core.gemini_client import call_gemini_ai
from core.chunking_similarity import chunk_text, retrieve_relevant_chunks_enhanced

# ============================================
# 🧠 UNIFIED: Extract Missing Skills (Standard + Comprehensive)
# ============================================
def extract_missing_skills(resume_text: str, jd_text: str, before_metrics: dict, mode: str = "comprehensive") -> list:
    """
    Analyze JD and resume to identify missing skills.

    Args:
        resume_text (str): The text content of the resume.
        jd_text (str): The text content of the job description.
        before_metrics (dict): Contains 'missing_chunks' and other pre-analysis data.
        mode (str): Either "standard" (fast, limited) or "comprehensive" (deep, all skills).

    Returns:
        list: A list of missing skills extracted from JD vs resume.
    """
    try:
        missing_chunks = before_metrics.get("missing_chunks", [])
        if not missing_chunks:
            print("✅ No missing chunks - resume covers job requirements well.")
            return []

        print(f"📊 Analyzing {len(missing_chunks)} missing chunks in '{mode}' mode")

        # Determine chunk usage and prompt limits
        if mode == "comprehensive":
            chunk_limit = 15
            jd_limit = 3000
            max_skills = None  # No limit
            instruction = "Extract ALL skills, technologies, qualifications, and requirements that are missing."
        else:
            chunk_limit = 5
            jd_limit = 2000
            max_skills = 10
            instruction = "Extract the TOP missing skills and technologies (up to 10)."

        chunks_to_analyze = missing_chunks[:chunk_limit]

        # Build prompt dynamically
        prompt = f"""
You are a resume expert. Analyze the job description and identify missing skills, technologies, qualifications, and requirements
that the resume does not cover.

JOB DESCRIPTION:
{jd_text[:jd_limit]}

MISSING CONTENT FROM RESUME:
{" ".join(chunks_to_analyze)}

{instruction}

Be comprehensive and include:
- Technical skills (languages, frameworks, tools)
- Domain knowledge (industry-specific)
- Methodologies and standards (Agile, V-Model, AUTOSAR, etc.)
- Certifications and qualifications
- Soft skills (if explicitly mentioned)

Return ONLY a JSON array of strings:
["skill1", "skill2", "skill3", ...]
"""
        # Call Gemini
        response_text = call_gemini_ai(prompt)

        # Parse JSON array from response
        match = re.search(r"\[.*?\]", response_text, re.DOTALL)
        if match:
            skills = json.loads(match.group(0))
            if max_skills:
                skills = skills[:max_skills]
            print(f"✅ Extracted {len(skills)} missing skills ({mode} mode).")
            return skills

        else:
            print("⚠️ Couldn't parse JSON, using fallback extraction.")
            if mode == "comprehensive":
                return _extract_skills_fallback_enhanced(missing_chunks)
            return _extract_skills_fallback(missing_chunks)

    except Exception as e:
        print(f"❌ Error extracting missing skills ({mode} mode): {str(e)}")
        if mode == "comprehensive":
            return _extract_skills_fallback_enhanced(before_metrics.get("missing_chunks", []))
        return _extract_skills_fallback(before_metrics.get("missing_chunks", []))


# ============================================
# ⚙️ SIMPLE FALLBACK (STANDARD MODE)
# ============================================
def _extract_skills_fallback(missing_chunks: list) -> list:
    """Keyword-based simple fallback method (old logic)."""
    skills = []
    keywords = ["experience", "skill", "knowledge", "proficiency", "expertise"]

    for chunk in missing_chunks[:5]:
        words = chunk.split()
        for i, word in enumerate(words):
            if word.lower() in keywords and i + 1 < len(words):
                skill = " ".join(words[i+1:i+3])
                if 3 < len(skill) < 30:
                    skills.append(skill.title())

    # Remove duplicates and limit to 8
    return list(set(skills))[:8]


# ============================================
# ⚙️ ENHANCED FALLBACK (COMPREHENSIVE MODE)
# ============================================
def _extract_skills_fallback_enhanced(missing_chunks: list) -> list:
    """Enhanced fallback using n-gram scanning (new logic)."""
    skills = []
    for chunk in missing_chunks:
        words = chunk.split()
        for i in range(len(words)):
            # Two-word skills
            if i + 1 < len(words):
                two_word = " ".join(words[i:i+2])
                if 5 < len(two_word) < 50:
                    skills.append(two_word.strip())

            # Three-word skills
            if i + 2 < len(words):
                three_word = " ".join(words[i:i+3])
                if 8 < len(three_word) < 60:
                    skills.append(three_word.strip())

    # Deduplicate and format
    seen = set()
    unique_skills = []
    for skill in skills:
        skill_lower = skill.lower()
        if skill_lower not in seen and len(skill) > 3:
            seen.add(skill_lower)
            unique_skills.append(skill.title())

    print(f"✅ Fallback (enhanced) extracted {len(unique_skills)} skills.")
    return unique_skills


# ============================================
# 🆕 FUNCTION 2: Generate Improvement Tips
# ============================================
def generate_improvement_tips(before_metrics: dict) -> list:
    """
    Generate actionable improvement tips based on missing chunks.
    """
    try:
        missing_chunks = before_metrics.get("missing_chunks", [])
        
        if not missing_chunks:
            return ["Your resume already covers most job requirements!"]
        
        tips = []
        
        # Analyze missing chunks for patterns
        chunk_text = " ".join(missing_chunks[:5]).lower()
        
        # Pattern-based tips
        if "experience" in chunk_text or "year" in chunk_text:
            tips.append("Highlight years of experience in relevant technologies")
        
        if "project" in chunk_text or "develop" in chunk_text:
            tips.append("Add specific projects that demonstrate required skills")
        
        if "lead" in chunk_text or "manage" in chunk_text:
            tips.append("Emphasize leadership and management experience")
        
        if "team" in chunk_text or "collaborate" in chunk_text:
            tips.append("Mention teamwork and collaboration achievements")
        
        if "cloud" in chunk_text or "aws" in chunk_text or "azure" in chunk_text:
            tips.append("Include cloud platform experience if applicable")
        
        if "agile" in chunk_text or "scrum" in chunk_text:
            tips.append("Highlight experience with Agile/Scrum methodologies")
        
        # Generic tips
        tips.append("Use metrics and numbers to quantify achievements")
        tips.append("Align your resume keywords with job description terminology")
        
        return tips[:6]  # Max 6 tips
    
    except Exception as e:
        print(f"❌ Error generating tips: {str(e)}")
        return ["Review job description and align your resume accordingly"]


# ============================================
# 🆕 FUNCTION 3: Optimize with Selected Skills
# ============================================
def optimize_resume_with_selected_skills(
    resume_text: str, 
    jd_text: str, 
    before_metrics: dict,
    selected_skills: list
) -> dict:
    """
    Generate optimized resume using ONLY the selected skills.
    This is called after user has chosen which skills to add.
    """
    try:
        print(f"🔧 Optimizing resume with {len(selected_skills)} selected skills")
        
        # Chunk resume for RAG retrieval
        resume_chunks = chunk_text(resume_text, chunk_size=150)
        
        # RAG Retrieval - get relevant context
        retrieved = retrieve_relevant_chunks_enhanced(resume_chunks, jd_text, top_k=5)
        
        if retrieved:
            context_parts = []
            for item in retrieved:
                context_parts.append(f"[Score: {item['score']:.2f}] {item['content']}")
            relevant_context = "\n\n".join(context_parts)
        else:
            relevant_context = resume_text[:2000]  # Fallback to first part
        
        # Build skills string
        skills_to_add = ", ".join(selected_skills)
        
        # Enhanced prompt with selected skills
        prompt = f"""
You are an expert resume writer. Optimize this resume by incorporating ONLY these selected skills: {skills_to_add}

IMPORTANT INSTRUCTIONS:
1. Add the selected skills naturally into relevant sections
2. Keep the original resume structure and format
3. Preserve all existing achievements and experience
4. DO NOT remove any existing content
5. DO NOT add skills that were not selected
6. Make the additions feel natural and authentic

RELEVANT RESUME CONTENT:
{relevant_context}

FULL JOB DESCRIPTION:
{jd_text[:2000]}

SELECTED SKILLS TO ADD:
{skills_to_add}

Return a JSON object with:
{{
  "optimized_resume_text": "the complete optimized resume text",
  "added_skills": {json.dumps(selected_skills)},
  "changes_made": ["list of specific changes made"]
}}

Return ONLY the JSON object, no other text.
"""
        
        response_text = call_gemini_ai(prompt)
        
        # Parse response
        match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if match:
            result = json.loads(match.group(0))
            print(f"✅ Resume optimized with selected skills")
            return result
        else:
            # Fallback: return original with note
            print("⚠️  Couldn't parse optimization JSON, using fallback")
            return {
                "optimized_resume_text": resume_text + f"\n\nAdditional Skills: {skills_to_add}",
                "added_skills": selected_skills,
                "changes_made": [f"Added skills: {skills_to_add}"]
            }
    
    except Exception as e:
        print(f"❌ Error optimizing resume: {str(e)}")
        return {
            "optimized_resume_text": resume_text,
            "added_skills": selected_skills,
            "changes_made": []
        }


# ============================================
# 🔧 ORIGINAL FUNCTION - Keep for compatibility
# ============================================
def optimize_resume(resume_text: str, jd_text: str, before_metrics: dict) -> dict:
    """
    Original optimize_resume function - kept for backward compatibility.
    Now calls the new functions internally with comprehensive mode.
    """
    try:
        # Extract all missing skills in comprehensive mode
        missing_skills = extract_missing_skills(resume_text, jd_text, before_metrics, mode="comprehensive")
        
        # Optimize with ALL skills (legacy behavior)
        optimization_result = optimize_resume_with_selected_skills(
            resume_text,
            jd_text,
            before_metrics,
            missing_skills
        )
        
        # Add missing_skills and improvement_tips to result
        optimization_result["missing_skills"] = missing_skills
        optimization_result["improvement_tips"] = generate_improvement_tips(before_metrics)
        
        return optimization_result
    
    except Exception as e:
        print(f"❌ Error in optimize_resume: {str(e)}")
        return {
            "optimized_resume_text": resume_text,
            "missing_skills": [],
            "improvement_tips": []
        }