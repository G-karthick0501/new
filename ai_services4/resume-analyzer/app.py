from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
import json
import subprocess
import tempfile
import os
from core import optimizer, chunking_similarity as cs
from services import preprocessing
from utils.file_utils import extract_text_from_pdf

app = FastAPI(title="Resume Analyzer")

origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


# ============================================
# ENDPOINT 1: ANALYZE SKILLS
# ============================================
@app.post("/analyze-skills")
async def analyze_skills(resume_file: UploadFile = File(...), jd_file: UploadFile = File(...)):
    try:
        print("🎯 /analyze-skills called")
        
        resume_text = preprocessing.clean_text(extract_text_from_pdf(resume_file))
        jd_text = preprocessing.clean_text(extract_text_from_pdf(jd_file))
        
        original_resume_text = resume_text
        clean_resume = preprocessing.lemmatize_text(resume_text)
        clean_jd = preprocessing.lemmatize_text(jd_text)

        resume_chunks = cs.chunk_text(clean_resume)
        jd_chunks = cs.chunk_text(clean_jd)

        resume_embeds = cs.get_embeddings(resume_chunks)
        jd_embeds = cs.get_embeddings(jd_chunks)

        similarity_matrix = cs.compute_similarity(resume_embeds, jd_embeds)
        before_metrics = cs.compute_missing(similarity_matrix, resume_chunks, jd_chunks)

        missing_skills = optimizer.extract_missing_skills(clean_resume, clean_jd, before_metrics)
        improvement_tips = optimizer.generate_improvement_tips(before_metrics)

        # ✅ ADD THESE METRICS
        total_jd_chunks = len(jd_chunks)
        missing_chunks_count = len(before_metrics.get("missing_chunks", []))
        matched_chunks = total_jd_chunks - missing_chunks_count
        
        # Real cosine-based match score
        match_score = matched_chunks / total_jd_chunks if total_jd_chunks > 0 else 0

        print(f"✅ Analysis complete:")
        print(f"   Total JD chunks: {total_jd_chunks}")
        print(f"   Missing chunks: {missing_chunks_count}")
        print(f"   Match score: {match_score:.2f}")

        return {
            "success": True,
            "missing_skills": missing_skills,
            "improvement_tips": improvement_tips,
            "before_missing_chunks": before_metrics.get("missing_chunks", []),
            "original_resume_text": original_resume_text,
            
            # ✅ NEW FIELDS
            "total_jd_chunks": total_jd_chunks,
            "missing_chunks_count": missing_chunks_count,
            "match_score": round(match_score, 4),
            
            "message": "Analysis complete"
        }

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {"success": False, "error": str(e), "missing_skills": [], "improvement_tips": []}

# ============================================
# ENDPOINT 2: OPTIMIZE (Text for UI)
# ============================================
@app.post("/optimize-with-skills")
async def optimize_with_skills(resume_file: UploadFile = File(...), jd_file: UploadFile = File(...), selected_skills: str = Form(...)):
    try:
        print("🎯 /optimize-with-skills called")
        
        skills_list = json.loads(selected_skills)
        resume_text = preprocessing.clean_text(extract_text_from_pdf(resume_file))
        jd_text = preprocessing.clean_text(extract_text_from_pdf(jd_file))
        
        clean_resume = preprocessing.lemmatize_text(resume_text)
        clean_jd = preprocessing.lemmatize_text(jd_text)

        resume_chunks = cs.chunk_text(clean_resume)
        jd_chunks = cs.chunk_text(clean_jd)
        resume_embeds = cs.get_embeddings(resume_chunks)
        jd_embeds = cs.get_embeddings(jd_chunks)
        similarity_matrix = cs.compute_similarity(resume_embeds, jd_embeds)
        before_metrics = cs.compute_missing(similarity_matrix, resume_chunks, jd_chunks)

        # Get optimized text for UI display
        result = optimizer.optimize_resume_with_selected_skills(clean_resume, clean_jd, before_metrics, skills_list)

        return {
            "success": True,
            "optimized_resume_text": result["optimized_resume_text"],
            "added_skills": skills_list,
            "message": "Optimization complete"
        }

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return {"success": False, "error": str(e)}


# ============================================
# ENDPOINT 3: GENERATE PDF (Gemini → LaTeX)
# ============================================
@app.post("/generate-pdf")
async def generate_pdf(resume_file: UploadFile = File(...), jd_file: UploadFile = File(...), selected_skills: str = Form(...)):
    """
    🎯 OPTION 1: Gemini generates LaTeX directly, we compile it!
    Like: User asks ChatGPT for LaTeX → pastes in Overleaf → Compile
    """
    try:
        print("📄 Generating PDF using Gemini LaTeX generation...")
        
        skills_list = json.loads(selected_skills)
        print(f"➕ Adding {len(skills_list)} skills: {skills_list}")
        
        # Get original resume text
        resume_text = preprocessing.clean_text(extract_text_from_pdf(resume_file))
        
        # 🔥 Ask Gemini to generate complete LaTeX code
        print("🎨 Asking Gemini to generate LaTeX code...")
        latex_code = optimizer.generate_resume_latex(resume_text, skills_list)
        
        # 🔧 Compile the LaTeX code with Tectonic
        print("📝 Compiling LaTeX with Tectonic...")
        pdf_bytes = compile_latex_to_pdf(latex_code)
        
        print(f"✅ PDF generated: {len(pdf_bytes)} bytes")
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=optimized_resume.pdf"}
        )
        
    except Exception as e:
        print(f"❌ PDF generation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


def compile_latex_to_pdf(latex_code: str) -> bytes:
    """
    Compile LaTeX code to PDF using Tectonic.
    Just like pressing "Compile" in Overleaf!
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        tex_file = os.path.join(tmpdir, 'resume.tex')
        pdf_file = os.path.join(tmpdir, 'resume.pdf')
        
        # Write LaTeX code to file
        with open(tex_file, 'w', encoding='utf-8') as f:
            f.write(latex_code)
        
        print(f"📝 Compiling LaTeX in {tmpdir}")
        
        # Compile with Tectonic
        result = subprocess.run(
            ['tectonic', '-X', 'compile', tex_file, '--outdir', tmpdir],
            capture_output=True,
            text=True,
            timeout=180,
            cwd=tmpdir
        )
        
        if result.returncode != 0:
            print(f"❌ LaTeX compilation failed:")
            print(f"STDOUT: {result.stdout}")
            print(f"STDERR: {result.stderr}")
            
            # Save failed .tex for debugging
            debug_file = os.path.join(tempfile.gettempdir(), 'failed_resume.tex')
            try:
                with open(debug_file, 'w', encoding='utf-8') as f:
                    f.write(latex_code)
                print(f"💾 Failed .tex saved to: {debug_file}")
            except:
                pass
            
            raise Exception(f"LaTeX compilation error: {result.stderr[:500]}")
        
        print(f"✅ PDF compiled successfully")
        
        # Read PDF
        if not os.path.exists(pdf_file):
            raise Exception("PDF file not generated")
        
        with open(pdf_file, 'rb') as f:
            pdf_bytes = f.read()
        
        print(f"📄 PDF size: {len(pdf_bytes)} bytes")
        
        return pdf_bytes


# ============================================
# TEST ENDPOINT
# ============================================
@app.get("/test-latex")
async def test_latex():
    """Test: Generate sample LaTeX and compile"""
    sample_latex = r"""
\documentclass[11pt,letterpaper]{article}
\usepackage[margin=0.7in]{geometry}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage{hyperref}

\begin{document}

\begin{center}
{\Large \textbf{G. KARTHICK}} \\
Pune, Maharashtra | 7824034918 | 0105karthick@gmail.com \\
\href{https://github.com/G-karthick0501}{GitHub} | \href{https://linkedin.com/in/gkarthick}{LinkedIn}
\end{center}

\section*{Summary}
Final-year Computer Science student with hands-on experience in DevOps engineering, CI/CD automation, and full-stack development.

\section*{Education}
\textbf{Symbiosis Institute of Technology} \hfill Pune, Maharashtra \\
Bachelor of Technology in Computer Science Engineering \hfill May 2022 - May 2026

\section*{Technical Skills}
\textbf{Languages:} C, Python, JavaScript, Java, SQL \\
\textbf{DevOps \& Cloud:} Docker, Kubernetes, GitHub Actions, Ansible

\section*{Projects}
\textbf{DevCruite - Enterprise DevOps Platform} \\
\begin{itemize}[leftmargin=*]
    \item Architected production-ready CI/CD pipelines using GitHub Actions
    \item Containerized microservices with Docker Compose
\end{itemize}

\end{document}
"""
    
    try:
        pdf_bytes = compile_latex_to_pdf(sample_latex)
        return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=test.pdf"})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}


@app.post("/analyze")
async def analyze_resume_legacy(resume_file: UploadFile = File(...), jd_file: UploadFile = File(...)):
    return await analyze_skills(resume_file, jd_file)