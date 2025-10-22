import torch
import librosa
import numpy as np
from transformers import Wav2Vec2FeatureExtractor, Wav2Vec2ForSequenceClassification
from config import config
import logging
from typing import Dict, Tuple

logger = logging.getLogger(__name__)

class EmotionAnalyzer:
    """
    Audio emotion analyzer using HuggingFace Wav2Vec2 model
    """
    
    def __init__(self):
        """Initialize the model and feature extractor"""
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")
        
        # Use a more reliable model
        model_name = "superb/wav2vec2-base-superb-er"
        
        try:
            logger.info(f"Loading model: {model_name}")
            self.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(model_name)
            self.model = Wav2Vec2ForSequenceClassification.from_pretrained(model_name)
            self.model.to(self.device)
            self.model.eval()
            
            # Get emotion labels from model config
            self.id2label = self.model.config.id2label
            logger.info(f"Model loaded successfully with {len(self.id2label)} emotions: {list(self.id2label.values())}")
            
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise
    
    def load_audio(self, audio_path: str, target_sr: int = 16000) -> Tuple[np.ndarray, int]:
        """
        Load audio file and resample to target sample rate
        
        Args:
            audio_path: Path to audio file
            target_sr: Target sample rate (default: 16000 Hz)
        
        Returns:
            Tuple of (audio_array, sample_rate)
        """
        try:
            # Load audio file
            audio, sr = librosa.load(audio_path, sr=target_sr, mono=True)
            logger.info(f"Loaded audio: duration={len(audio)/sr:.2f}s, sr={sr}Hz")
            return audio, sr
        except Exception as e:
            logger.error(f"Error loading audio: {str(e)}")
            raise
    
    def predict_emotion(self, audio: np.ndarray, sample_rate: int) -> Dict:
        """
        Predict emotion from audio array
        
        Args:
            audio: Audio array
            sample_rate: Sample rate of audio
        
        Returns:
            Dictionary with emotion predictions
        """
        try:
            # Extract features
            inputs = self.feature_extractor(
                audio,
                sampling_rate=sample_rate,
                return_tensors="pt",
                padding=True
            )
            
            # Move inputs to device
            input_values = inputs.input_values.to(self.device)
            
            # Get predictions
            with torch.no_grad():
                outputs = self.model(input_values)
                logits = outputs.logits
            
            # Apply softmax to get probabilities
            probs = torch.nn.functional.softmax(logits, dim=-1)
            probs = probs.cpu().numpy()[0]
            
            # Get predicted emotion
            predicted_id = np.argmax(probs)
            confidence = float(probs[predicted_id])
            predicted_emotion = self.id2label[predicted_id]
            
            # Create scores dictionary for all emotions
            all_scores = {
                self.id2label[i]: float(probs[i]) 
                for i in range(len(probs))
            }
            
            return {
                "emotion": predicted_emotion,
                "confidence": confidence,
                "all_scores": all_scores
            }
            
        except Exception as e:
            logger.error(f"Error predicting emotion: {str(e)}")
            raise
    
    def analyze_emotion(self, audio_path: str) -> Dict:
        """
        Main method to analyze emotion from audio file
        
        Args:
            audio_path: Path to audio file
        
        Returns:
            Dictionary with emotion analysis results
        """
        try:
            # Load audio
            audio, sr = self.load_audio(audio_path)
            
            # Check if audio is not empty
            if len(audio) == 0:
                raise ValueError("Audio file is empty or corrupted")
            
            # Check minimum duration (at least 0.5 seconds)
            min_duration = 0.5
            if len(audio) / sr < min_duration:
                raise ValueError(f"Audio too short. Minimum duration: {min_duration}s")
            
            # Predict emotion
            result = self.predict_emotion(audio, sr)
            
            # Add metadata
            result["duration"] = len(audio) / sr
            result["sample_rate"] = sr
            
            logger.info(f"Analysis complete: {result['emotion']} ({result['confidence']:.2%})")
            
            return result
            
        except Exception as e:
            logger.error(f"Error in emotion analysis: {str(e)}")
            raise

# Singleton instance (loaded once when service starts)
_analyzer_instance = None

def get_analyzer() -> EmotionAnalyzer:
    """Get or create emotion analyzer instance"""
    global _analyzer_instance
    if _analyzer_instance is None:
        _analyzer_instance = EmotionAnalyzer()
    return _analyzer_instance