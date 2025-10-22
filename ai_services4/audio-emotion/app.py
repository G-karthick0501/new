from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import tempfile
import logging
from typing import Dict
from config import config
from emotion_analyzer import get_analyzer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Audio Emotion Analysis Service",
    description="Microservice for analyzing emotions from audio files using Wav2Vec2",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize analyzer on startup
analyzer = None

@app.on_event("startup")
async def startup_event():
    """Load model on startup"""
    global analyzer
    try:
        logger.info("Loading emotion analyzer...")
        analyzer = get_analyzer()
        logger.info("Emotion analyzer loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load analyzer: {str(e)}")
        raise

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Audio Emotion Analysis",
        "status": "running",
        "version": "1.0.0",
        "model": config.MODEL_NAME
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        if analyzer is None:
            return JSONResponse(
                status_code=503,
                content={"status": "unhealthy", "error": "Model not loaded"}
            )
        
        return {
            "status": "healthy",
            "model": config.MODEL_NAME,
            "service": "audio-emotion-analysis",
            "device": analyzer.device
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "error": str(e)}
        )

@app.post("/analyze-audio")
async def analyze_audio(file: UploadFile = File(...)):
    """
    Analyze emotion from uploaded audio file
    
    Args:
        file: Audio file (WAV, MP3, FLAC, OGG)
    
    Returns:
        JSON with emotion analysis results
    """
    if analyzer is None:
        raise HTTPException(
            status_code=503,
            detail="Service not ready. Model is still loading."
        )
    
    try:
        # Validate file extension
        file_extension = file.filename.split(".")[-1].lower()
        if file_extension not in config.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file format. Allowed: {', '.join(config.ALLOWED_EXTENSIONS)}"
            )
        
        # Read file content
        content = await file.read()
        
        # Check file size
        if len(content) > config.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {config.MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        
        # Create temporary file to save uploaded audio
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_extension}") as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Analyze emotion
            result = analyzer.analyze_emotion(temp_file_path)
            
            # Add filename to result
            result["filename"] = file.filename
            
            logger.info(f"Successfully analyzed: {file.filename} -> {result['emotion']} ({result['confidence']:.2%})")
            return result
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error analyzing audio: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error processing audio: {str(e)}"
        )

@app.get("/supported-emotions")
async def get_supported_emotions():
    """Get list of emotions that can be detected"""
    if analyzer is None:
        raise HTTPException(
            status_code=503,
            detail="Service not ready. Model is still loading."
        )
    
    try:
        emotions = list(analyzer.model.config.id2label.values())
        return {
            "emotions": emotions,
            "count": len(emotions)
        }
    except Exception as e:
        logger.error(f"Error getting emotions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=config.SERVICE_PORT,
        reload=True
    )