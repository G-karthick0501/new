import whisper
import os
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse

from core import optimizer, chunking_similarity as cs
from services import preprocessing
from utils.file_utils import extract_text_from_pdf

app = FastAPI(title="Resume Analyzer")

# Load Whisper model once (at startup)
# model = whisper.load_model("small")  # tiny, base, small, medium, large

# -------------------------
# Resume Analyzer Route
# -------------------------
@app.post("/analyze")
async def analyze_resume(resume_file: UploadFile = File(...), jd_file: UploadFile = File(...)):
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

    gemini_output = optimizer.optimize_resume(clean_resume, clean_jd, before_metrics)
    after_metrics = cs.compute_after_metrics(gemini_output.get("optimized_resume_text", ""), jd_chunks)

    return {
        "before_missing_chunks": before_metrics.get("missing_chunks", []),
        "after_missing_chunks": after_metrics.get("missing_chunks", []),
        "optimized_resume_text": gemini_output.get("optimized_resume_text", ""),
        "missing_skills": gemini_output.get("missing_skills", []),
        "improvement_tips": gemini_output.get("improvement_tips", [])
    }

''' 
# -------------------------
# New Whisper Transcription Route
# -------------------------
@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if not file:
        return JSONResponse(status_code=400, content={"error": "No audio file uploaded"})
    
    temp_filename = f"temp_{file.filename}"
    with open(temp_filename, "wb") as f:
        f.write(await file.read())
    
    # Transcribe with Whisper
    result = model.transcribe(temp_filename)
    
    # Cleanup
    os.remove(temp_filename)
    
    return {"text": result["text"]}
'''