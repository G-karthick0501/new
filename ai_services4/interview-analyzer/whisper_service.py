#!/usr/bin/env python3
"""
Ultra-Fast Transcription Service - faster-whisper with tiny.en model
Port: 8001
"""

import os
import tempfile
import time
import json
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import re

# Initialize FastAPI
app = FastAPI()

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model once on startup
from faster_whisper import WhisperModel
start_load = time.time()
model = WhisperModel("tiny.en", device="cpu", compute_type="int8")
load_time = time.time() - start_load

print(f"✅ tiny.en model loaded in {load_time:.2f}s")

def clean_transcription(text):
    """Clean and format transcription text"""
    if not text:
        return ""
    
    # Remove extra whitespace and clean up
    text = re.sub(r'\s+', ' ', text.strip())
    
    # Remove common transcription artifacts
    text = re.sub(r'\[.*?\]', '', text)  # Remove [music], [noise], etc.
    text = re.sub(r'\(.*?\)', '', text)  # Remove (inaudible), etc.
    
    # Capitalize first letter
    if text:
        text = text[0].upper() + text[1:]
    
    # Add period if missing
    if text and text[-1] not in '.!?':
        text += '.'
    
    return text

def transcribe_with_model(audio_file_path):
    """Transcribe audio using preloaded tiny.en model"""
    
    try:
        # Check if file exists and has content
        if not os.path.exists(audio_file_path):
            raise Exception("Audio file does not exist")
        
        file_size = os.path.getsize(audio_file_path)
        if file_size < 100:  # Very small file, likely empty
            return "No audio detected"
        
        start_time = time.time()
        segments, info = model.transcribe(
            audio_file_path,
            beam_size=1,
            language="en"
        )
        # Iterate through the generator properly
        transcription_segments = []
        for segment in segments:
            transcription_segments.append(segment.text)
        transcription = " ".join(transcription_segments)
        elapsed = time.time() - start_time
        
        return clean_transcription(transcription)
        
    except Exception as e:
        raise Exception(f"Transcription failed: {str(e)}")

@app.get("/")
async def root():
    return {
        "service": "Ultra-Fast Whisper Service (faster-whisper)",
        "provider": "faster-whisper (Python + CTranslate2)",
        "status": "ready",
        "port": 8001,
        "model": "tiny.en (preloaded)",
        "load_time": f"{load_time:.2f}s (one-time)",
        "speed": "~3 seconds per transcription",
        "endpoints": [
            "/transcribe",
            "/health"
        ]
    }

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe audio file using faster-whisper with preloaded model"""
    
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Save uploaded file to temp location
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name
    
    try:
        # Transcribe the audio
        transcription = transcribe_with_model(temp_file_path)
        
        # Debug: ensure transcription is a string
        if not isinstance(transcription, str):
            transcription = str(transcription)
        
        return {
            "success": True,
            "transcription": {
                "raw_text": transcription,
                "cleaned_text": transcription
            },
            "language": "en",
            "duration": 0,
            "provider": "faster-whisper",
            "model": "tiny.en",
            "speed": f"~3 seconds (model preloaded)"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "provider": "faster-whisper",
            "model": "tiny.en"
        }
    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": True,
        "load_time": f"{load_time:.2f}s",
        "ready": True
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
