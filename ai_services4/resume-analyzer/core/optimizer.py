# ai_services4/resume-analyzer/core/optimizer.py

import json
import re
from core.gemini_client import call_gemini_ai
from core.chunking_similarity import chunk_text, retrieve_relevant_chunks_enhanced

def generate_resume_latex(resume_text: str, selected_skills: list) -> str:
    """
    🎯 OPTION 1: Ask Gemini to generate COMPLETE LaTeX code directly.
    Now with BETTER prompt using the exact template format!
    """
    try:
        print(f"🎨 Generating LaTeX code with {len(selected_skills)} skills")
        
        skills_str = ", ".join(selected_skills)
        
        # 🔥 ENHANCED PROMPT - Use the exact working template!
        prompt = f"""You are a LaTeX expert. Generate a COMPLETE, PROFESSIONAL resume in LaTeX format.

INPUT RESUME TEXT:
{resume_text[:3500]}

SKILLS TO ADD (ONLY THESE):
{skills_str}

CRITICAL RULES:
1. Add ONLY the skills from the list above - DO NOT add automotive, embedded, ARM, vehicle protocols, or any other skills not explicitly listed
2. Keep ALL existing content from the original resume
3. Use the EXACT template structure shown below
4. Replace placeholder URLs with actual GitHub/LinkedIn URLs from the resume (if found) or use generic placeholders
5. Maintain proper spacing and formatting

REQUIRED TEMPLATE STRUCTURE (USE THIS EXACTLY):

\\documentclass[letterpaper,11pt]{{article}}

\\usepackage{{latexsym}}
\\usepackage[empty]{{fullpage}}
\\usepackage{{titlesec}}
\\usepackage{{marvosym}}
\\usepackage[usenames,dvipsnames]{{color}}
\\usepackage{{verbatim}}
\\usepackage{{enumitem}}
\\usepackage[hidelinks]{{hyperref}}
\\usepackage{{fancyhdr}}
\\usepackage{{tabularx}}
\\usepackage{{xcolor}}

\\renewcommand{{\\familydefault}}{{\\sfdefault}}

\\pagestyle{{fancy}}
\\fancyhf{{}}
\\fancyfoot{{}}
\\renewcommand{{\\headrulewidth}}{{0pt}}
\\renewcommand{{\\footrulewidth}}{{0pt}}

\\addtolength{{\\oddsidemargin}}{{-0.5in}}
\\addtolength{{\\evensidemargin}}{{-0.5in}}
\\addtolength{{\\textwidth}}{{1in}}
\\addtolength{{\\topmargin}}{{-0.5in}}
\\addtolength{{\\textheight}}{{1.0in}}

\\urlstyle{{same}}
\\raggedbottom
\\raggedright
\\setlength{{\\tabcolsep}}{{0in}}

\\titleformat{{\\section}}{{
  \\vspace{{-6pt}}\\scshape\\raggedright\\large
}}{{}}{{0em}}{{}}[\\color{{black}}\\titlerule \\vspace{{-5pt}}]

\\newcommand{{\\resumeItem}}[1]{{
  \\item\\small{{
    {{#1 \\vspace{{-2pt}}}}
  }}
}}

\\newcommand{{\\resumeSubheading}}[4]{{
  \\vspace{{-2pt}}\\item
    \\begin{{tabular*}}{{0.97\\textwidth}}[t]{{l@{{\\extracolsep{{\\fill}}}}r}}
      \\textbf{{#1}} & #2 \\\\
      \\textit{{\\small#3}} & \\textit{{\\small #4}} \\\\
    \\end{{tabular*}}\\vspace{{-7pt}}
}}

\\newcommand{{\\resumeProjectHeading}}[2]{{
    \\vspace{{-2pt}}\\item
    \\begin{{tabular*}}{{0.97\\textwidth}}{{l@{{\\extracolsep{{\\fill}}}}r}}
      \\small#1 & #2 \\\\
    \\end{{tabular*}}\\vspace{{-7pt}}
}}

\\newcommand{{\\resumeSubItem}}[1]{{\\resumeItem{{#1}}\\vspace{{-4pt}}}}
\\renewcommand\\labelitemii{{$\\vcenter{{\\hbox{{\\tiny$\\bullet$}}}}$}}
\\newcommand{{\\resumeSubHeadingListStart}}{{\\begin{{itemize}}[leftmargin=0.15in, label={{}}]}}
\\newcommand{{\\resumeSubHeadingListEnd}}{{\\end{{itemize}}}}
\\newcommand{{\\resumeItemListStart}}{{\\begin{{itemize}}}}
\\newcommand{{\\resumeItemListEnd}}{{\\end{{itemize}}\\vspace{{-5pt}}}}

\\begin{{document}}

%----------HEADING----------
\\begin{{center}}
    \\textbf{{\\Huge \\scshape G. Karthick}} \\\\ \\vspace{{3pt}}
    \\small Pune, Maharashtra | 
    \\href{{tel:7824034918}}{{7824034918}} $|$ 
    \\href{{mailto:0105karthick@gmail.com}}{{\\underline{{0105karthick@gmail.com}}}} $|$ 
    \\href{{https://github.com/G-karthick0501}}{{\\underline{{GitHub}}}} $|$
    \\href{{https://linkedin.com/in/yourprofile}}{{\\underline{{LinkedIn}}}}
\\end{{center}}

%-----------SUMMARY-----------
\\vspace{{-8pt}}
\\begin{{center}}
    \\small{{[Insert summary from resume here]}}
\\end{{center}}

%-----------EDUCATION-----------
\\section{{Education}}
  \\resumeSubHeadingListStart
    \\resumeSubheading
      {{Institution Name}}{{Location}}
      {{Degree Name}}{{Dates}}
  \\resumeSubHeadingListEnd

%-----------TECHNICAL SKILLS-----------
\\section{{Technical Skills}}
 \\begin{{itemize}}[leftmargin=0.15in, label={{}}]
    \\small{{\\item{{
     \\textbf{{Languages}}{{: [List from resume]}} \\\\
     \\textbf{{DevOps \\& Cloud}}{{: [List from resume + ADD SELECTED SKILLS HERE: {skills_str}]}} \\\\
     \\textbf{{Backend \\& Databases}}{{: [List from resume]}} \\\\
     \\textbf{{Tools \\& Platforms}}{{: [List from resume]}}
    }}}}
 \\end{{itemize}}

[Continue with Projects, Experience, Certifications sections using the same format]

\\end{{document}}

IMPORTANT:
- Use \\resumeProjectHeading for projects
- Use \\resumeItem for bullet points
- Add ONLY these skills: {skills_str}
- DO NOT add: Embedded C, Automotive, ARM Cortex, Vehicle protocols, I2C, SPI, RS232, UART, or any other skills not in the list
- Keep proper spacing with \\vspace
- Use \\href for ALL links

OUTPUT ONLY THE COMPLETE LATEX CODE, NO EXPLANATIONS."""

        print("📤 Sending prompt to Gemini...")
        response = call_gemini_ai(prompt)
        
        # Clean up response - remove markdown if present
        latex_code = response.strip()
        
        # Remove markdown code blocks if Gemini added them
        latex_code = re.sub(r'^```latex\s*', '', latex_code, flags=re.MULTILINE)
        latex_code = re.sub(r'^```\s*', '', latex_code, flags=re.MULTILINE)
        latex_code = re.sub(r'```$', '', latex_code, flags=re.MULTILINE)
        latex_code = latex_code.strip()
        
        # Validate it's actually LaTeX
        if '\\documentclass' not in latex_code:
            print("⚠️  Response doesn't look like LaTeX, attempting to extract...")
            # Try to find LaTeX code in the response
            match = re.search(r'\\documentclass.*?\\end\{document\}', latex_code, re.DOTALL)
            if match:
                latex_code = match.group(0)
            else:
                raise Exception("Gemini did not return valid LaTeX code")
        
        print(f"✅ LaTeX code generated: {len(latex_code)} characters")
        print(f"📄 Preview (first 500 chars):")
        print(latex_code[:500])
        
        return latex_code
        
    except Exception as e:
        print(f"❌ Error generating LaTeX: {str(e)}")
        raise


# ============================================
# KEEP EXISTING FUNCTIONS FOR SKILL ANALYSIS
# ============================================

def extract_missing_skills(resume_text: str, jd_text: str, before_metrics: dict) -> list:
    """Extract missing skills from JD that aren't in resume"""
    try:
        missing_chunks = before_metrics.get("missing_chunks", [])
        missing_text = " ".join(missing_chunks[:10])
        
        prompt = f"""
Analyze this resume and job description to identify SPECIFIC, CONCRETE missing skills.

RESUME:
{resume_text[:1500]}

JOB DESCRIPTION:
{jd_text[:1500]}

MISSING CONTENT FROM JD:
{missing_text}

Extract ONLY specific technical skills, tools, or technologies that are:
1. Explicitly mentioned in the job description
2. NOT present in the resume
3. Concrete and actionable (e.g., "Docker", "Kubernetes", not "good communication")

Return a JSON array of 5-15 specific skills:
{{"skills": ["skill1", "skill2", "skill3"]}}

Focus on: programming languages, frameworks, tools, cloud platforms, databases, methodologies.
Return ONLY the JSON, no other text.
"""
        
        response = call_gemini_ai(prompt)
        match = re.search(r'\{.*\}', response, re.DOTALL)
        
        if match:
            data = json.loads(match.group(0))
            skills = data.get("skills", [])
            print(f"✅ Extracted {len(skills)} missing skills")
            return skills[:15]
        
        return []
        
    except Exception as e:
        print(f"❌ Error extracting skills: {str(e)}")
        return []


def generate_improvement_tips(before_metrics: dict) -> list:
    """Generate improvement tips based on analysis"""
    try:
        missing_chunks = before_metrics.get("missing_chunks", [])
        
        if not missing_chunks:
            return []
        
        missing_text = " ".join(missing_chunks[:5])
        
        prompt = f"""
Based on this gap analysis, provide 3-5 SPECIFIC, ACTIONABLE improvement tips for the resume.

MISSING CONTENT FROM JD:
{missing_text}

Return a JSON array:
{{"tips": ["tip1", "tip2", "tip3"]}}

Make tips specific, professional, and actionable.
Return ONLY the JSON, no other text.
"""
        
        response = call_gemini_ai(prompt)
        match = re.search(r'\{.*\}', response, re.DOTALL)
        
        if match:
            data = json.loads(match.group(0))
            tips = data.get("tips", [])
            return tips[:5]
        
        return []
        
    except Exception as e:
        print(f"❌ Error generating tips: {str(e)}")
        return []


# ============================================
# LEGACY FUNCTION - Keep for text output
# ============================================

def optimize_resume_with_selected_skills(resume_text: str, jd_text: str, before_metrics: dict, selected_skills: list) -> dict:
    """
    Legacy function for text optimization.
    Returns plain text for display in UI.
    """
    try:
        skills_str = ", ".join(selected_skills)
        
        # Simple text optimization for UI display
        optimized_text = resume_text + f"\n\nTECHNICAL SKILLS\nAdditional Skills: {skills_str}"
        
        return {
            "optimized_resume_text": optimized_text,
            "added_skills": selected_skills,
            "changes_made": [f"Added {len(selected_skills)} skills"]
        }
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {
            "optimized_resume_text": resume_text,
            "added_skills": selected_skills,
            "changes_made": []
        }