import cv2
import numpy as np
from typing import Dict, Any
from fastapi import UploadFile, HTTPException
from deepface import DeepFace

class EmotionAnalyzer:
    def __init__(self):
        """Initialize emotion analyzer with DeepFace"""
        self.emotion_boost_factors = {
            "sad": 2.0,
            "happy": 2.0,
            "surprise": 1.5,
            "angry": 1.5,
            "disgust": 1.5,
            "fear": 1.5,
            "neutral": 0.75  # Reduce neutral weight
        }
        print("✅ Emotion Analyzer initialized")
    
    def apply_emotion_boost(self, emotions: Dict[str, float]) -> Dict[str, float]:
        """
        Apply boost factors to prioritize non-neutral emotions
        
        Args:
            emotions: Dictionary of emotion scores
            
        Returns:
            Dictionary of boosted emotion scores
        """
        boosted_emotions = {}
        for emotion, score in emotions.items():
            boost = self.emotion_boost_factors.get(emotion, 1.0)
            boosted_emotions[emotion] = score * boost
        
        return boosted_emotions
    
    async def analyze_frame(self, image_file: UploadFile) -> Dict[str, Any]:
        """
        Analyze a single frame for emotions
        
        Args:
            image_file: Uploaded image file from frontend
            
        Returns:
            Dictionary containing emotion analysis results
        """
        try:
            print(f"📸 Analyzing frame: {image_file.filename}")
            
            # Read image bytes
            image_bytes = await image_file.read()
            print(f"📦 Image size: {len(image_bytes)} bytes")
            
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is None:
                print("❌ Could not decode image")
                raise ValueError("Could not decode image")
            
            print(f"🖼️ Frame shape: {frame.shape}")
            
            # Convert BGR to RGB (DeepFace expects RGB)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            print("🔍 Running DeepFace analysis...")
            # Analyze with DeepFace
            result = DeepFace.analyze(
                rgb_frame, 
                actions=['emotion'], 
                enforce_detection=False,
                detector_backend='opencv'  # Fast detector
            )
            print(f"✅ DeepFace result: {type(result)}")
            
            if not result:
                print("⚠️ No face detected in frame")
                return {
                    "success": False,
                    "error": "No face detected",
                    "dominant_emotion": "unknown",
                    "confidence": 0,
                    "all_emotions": {}
                }
            
            # Extract emotions from result
            if isinstance(result, list):
                emotions = result[0]['emotion']
            else:
                emotions = result['emotion']
            print(f"😊 Raw emotions: {emotions}")
            
            # Convert numpy types to Python float for JSON serialization
            emotions = {k: float(v) for k, v in emotions.items()}
            
            # Apply emotion boosting
            boosted_emotions = self.apply_emotion_boost(emotions)
            print(f"⚡ Boosted emotions: {boosted_emotions}")
            
            # Find dominant emotion
            dominant_emotion = max(boosted_emotions, key=boosted_emotions.get)
            confidence = boosted_emotions[dominant_emotion]
            
            print(f"🎯 Dominant emotion: {dominant_emotion} ({confidence:.2f})")
            
            return {
                "success": True,
                "dominant_emotion": dominant_emotion,
                "confidence": round(float(confidence), 2),
                "all_emotions": {k: round(float(v), 2) for k, v in emotions.items()},
                "boosted_emotions": {k: round(float(v), 2) for k, v in boosted_emotions.items()}
            }
            
        except Exception as e:
            import traceback
            print(f"❌ Error analyzing emotion: {str(e)}")
            print(f"📋 Traceback: {traceback.format_exc()}")
            return {
                "success": False,
                "error": str(e),
                "dominant_emotion": "unknown",
                "confidence": 0,
                "all_emotions": {}
            }
    
    def get_emotion_summary(self, emotion_history: list) -> Dict[str, Any]:
        """
        Generate summary statistics from emotion history
        
        Args:
            emotion_history: List of emotion records
            
        Returns:
            Dictionary with emotion summary
        """
        if not emotion_history:
            return {
                "dominant_emotion": "unknown",
                "avg_confidence": 0,
                "emotion_distribution": {},
                "total_frames": 0
            }
        
        # Count emotions
        emotion_counts = {}
        total_confidence = 0
        
        for record in emotion_history:
            emotion = record.get('dominant_emotion', 'unknown')
            confidence = record.get('confidence', 0)
            
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
            total_confidence += confidence
        
        # Calculate percentages
        total_frames = len(emotion_history)
        emotion_distribution = {
            emotion: round((count / total_frames) * 100, 2)
            for emotion, count in emotion_counts.items()
        }
        
        # Find dominant emotion
        dominant_emotion = max(emotion_counts, key=emotion_counts.get)
        avg_confidence = round(total_confidence / total_frames, 2)
        
        return {
            "dominant_emotion": dominant_emotion,
            "avg_confidence": avg_confidence,
            "emotion_distribution": emotion_distribution,
            "total_frames": total_frames
        }
