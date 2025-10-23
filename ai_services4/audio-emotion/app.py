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
        "model": "superb/wav2vec2-base-superb-er"
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
            "model": "superb/wav2vec2-base-superb-er",
            "service": "audio-emotion-analysis",
            "device": analyzer.device,
            "emotions": list(analyzer.id2label.values())
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
    Analyze emotion from uploaded audio file (SHORT AUDIO)
    
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




@app.post("/analyze-audio-long")
async def analyze_audio_long(
    file: UploadFile = File(...),
    remove_silence: bool = True
):
    """
    Analyze emotion from long audio files with chunking (LONG AUDIO)
    
    Args:
        file: Audio file (WAV, MP3, FLAC, OGG)
        remove_silence: Whether to remove silent parts (default: True)
    
    Returns:
        JSON with aggregated emotion analysis results
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
        
        # Check file size (allow larger files for long audio)
        max_size = config.MAX_FILE_SIZE * 5  # 50MB for long audio
        if len(content) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {max_size / 1024 / 1024}MB"
            )
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_extension}") as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Analyze with chunking
            result = analyzer.analyze_emotion_with_chunks(temp_file_path, remove_silence)
            result["filename"] = file.filename
            
            logger.info(f"Successfully analyzed long audio: {file.filename}")
            return result
            
        finally:
            # Clean up
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


@app.post("/analyze-audio-complete")
async def analyze_audio_complete(
    file: UploadFile = File(...),
    remove_silence: bool = True
):
    """
    Complete audio analysis: Emotion + Objective Metrics
    
    Args:
        file: Audio file (WAV, MP3, FLAC, OGG)
        remove_silence: Whether to remove silent parts for emotion (default: True)
    
    Returns:
        JSON with emotion analysis + audio metrics + interpretation
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
        max_size = config.MAX_FILE_SIZE * 5  # 50MB
        if len(content) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {max_size / 1024 / 1024}MB"
            )
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_extension}") as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Complete analysis
            result = analyzer.analyze_emotion_with_metrics(temp_file_path, remove_silence)
            result["filename"] = file.filename
            
            logger.info(f"Complete analysis done: {file.filename}")
            return result
            
        finally:
            # Clean up
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
    
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in complete analysis: {str(e)}")
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