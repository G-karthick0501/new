# app.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
from models.response_analyzer import ResponseAnalyzer

app = FastAPI()
analyzer = ResponseAnalyzer()

# Request model
class QAItem(BaseModel):
    question_text: str
    response_text: str

class QARequest(BaseModel):
    items: List[QAItem]

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
