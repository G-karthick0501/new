from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import tempfile
import logging
from typing import Dict
import time
from config import config
from emotion_analyzer_mfcc_svm import get_analyzer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Audio Emotion Analysis Service - CPU Friendly",
    description="Microservice for analyzing emotions from audio files using MFCC + SVM",
    version="2.0.0"
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
        logger.info("Loading CPU-friendly MFCC+SVM emotion analyzer...")
        start_time = time.time()
        analyzer = get_analyzer()
        load_time = time.time() - start_time
        logger.info(f"MFCC+SVM analyzer loaded successfully in {load_time:.2f}s")
    except Exception as e:
        logger.error(f"Failed to load analyzer: {str(e)}")
        raise

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Audio Emotion Analysis - CPU Friendly",
        "status": "running",
        "version": "2.0.0",
        "model": "MFCC + SVM",
        "architecture": "CPU-optimized",
        "model_size": "<5MB",
        "memory_usage": "<100MB"
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
            "model": "MFCC + SVM",
            "service": "audio-emotion-analysis-cpu-friendly",
            "emotions": analyzer.get_supported_emotions(),
            "architecture": "CPU-optimized",
            "model_size": "<5MB",
            "memory_usage": "<100MB",
            "processing_speed": "fast"
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
    Analyze emotion from uploaded audio file (CPU-friendly version)
    
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
            # Start timing
            start_time = time.time()
            
            # Analyze emotion
            result = analyzer.analyze_emotion(temp_file_path)
            
            # Add timing and metadata
            processing_time = time.time() - start_time
            result["filename"] = file.filename
            result["processing_time_seconds"] = round(processing_time, 3)
            result["model_info"] = {
                "type": "MFCC + SVM",
                "size": "<5MB",
                "architecture": "CPU-optimized"
            }
            
            logger.info(f"Successfully analyzed: {file.filename} -> {result['emotion']} ({result['confidence']:.2%}) in {processing_time:.3f}s")
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
    Analyze emotion from long audio files with chunking (CPU-friendly version)
    
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
            # Start timing
            start_time = time.time()
            
            # Analyze with chunking
            result = analyzer.analyze_emotion_with_chunks(temp_file_path, remove_silence)
            
            # Add timing and metadata
            processing_time = time.time() - start_time
            result["filename"] = file.filename
            result["processing_time_seconds"] = round(processing_time, 3)
            result["model_info"] = {
                "type": "MFCC + SVM (chunked)",
                "size": "<5MB",
                "architecture": "CPU-optimized"
            }
            
            logger.info(f"Successfully analyzed long audio: {file.filename} in {processing_time:.3f}s")
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

@app.get("/supported-emotions")
async def get_supported_emotions():
    """Get list of emotions that can be detected"""
    if analyzer is None:
        raise HTTPException(
            status_code=503,
            detail="Service not ready. Model is still loading."
        )
    
    try:
        emotions = analyzer.get_supported_emotions()
        return {
            "emotions": emotions,
            "count": len(emotions),
            "model_type": "MFCC + SVM",
            "architecture": "CPU-optimized"
        }
    except Exception as e:
        logger.error(f"Error getting emotions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model-info")
async def get_model_info():
    """Get information about the current model"""
    return {
        "name": "MFCC + SVM Emotion Classifier",
        "type": "CPU-optimized Machine Learning",
        "model_size": "<5MB",
        "memory_usage": "<100MB",
        "processing_speed": "Fast (CPU)",
        "accuracy": "70-80% (research-backed)",
        "advantages": [
            "Lightweight and fast",
            "CPU-friendly architecture",
            "Low memory footprint",
            "No GPU required",
            "Quick startup time"
        ],
        "supported_emotions": analyzer.get_supported_emotions() if analyzer else []
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app_cpu_friendly:app",
        host="0.0.0.0",
        port=config.SERVICE_PORT,
        reload=True
    )
