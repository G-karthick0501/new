# app.py
import os
os.environ["USE_TF"] = "0"

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from models.response_analyzer import ResponseAnalyzer
from models.transcription_service import TranscriptionService
from models.emotion_analyzer import EmotionAnalyzer

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = ResponseAnalyzer()
transcription_service = TranscriptionService()
emotion_analyzer = EmotionAnalyzer()

# Request model
class QAItem(BaseModel):
    question_text: str
    response_text: str

class QARequest(BaseModel):
    items: List[QAItem]

class EmotionHistoryRequest(BaseModel):
    emotion_history: List[Dict[str, Any]]

@app.get("/")
async def root():
    return {"message": "Interview Analyzer API is running"}

@app.post("/analyze")
async def analyze(request: QARequest):
    try:
        # Convert Pydantic models to dicts
        items = [{"question_text": i.question_text, "response_text": i.response_text} for i in request.items]
        
        # Call analyzer
        result = analyzer.analyze_batch(items)
        
        return {"analysis": result}
    
    except Exception as e:
        # Catch all exceptions and return a safe JSON response
        return {
            "detail": "Internal error during analysis",
            "error": str(e)
        }

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe audio file to text"""
    try:
        result = await transcription_service.transcribe_audio(file)
        return {
            "success": True,
            "transcription": result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "transcription": {
                "raw_text": "",
                "cleaned_text": ""
            }
        }

@app.post("/analyze-emotion")
async def analyze_emotion(file: UploadFile = File(...)):
    """Analyze emotion from a single frame"""
    print(f"\n🎬 Received emotion analysis request")
    print(f"📄 File: {file.filename}, Content-Type: {file.content_type}")
    try:
        result = await emotion_analyzer.analyze_frame(file)
        print(f"✅ Analysis result: {result.get('success', False)}")
        return result
    except Exception as e:
        import traceback
        print(f"❌ Endpoint error: {str(e)}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        return {
            "success": False,
            "error": str(e),
            "dominant_emotion": "unknown",
            "confidence": 0,
            "all_emotions": {}
        }

@app.post("/emotion-summary")
async def get_emotion_summary(request: EmotionHistoryRequest):
    """Generate emotion summary from history"""
    try:
        summary = emotion_analyzer.get_emotion_summary(request.emotion_history)
        return {
            "success": True,
            "summary": summary
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
