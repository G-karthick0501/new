# ai_services4/audio-emotion/emotion_analyzer.py
import torch
import librosa
import numpy as np
from transformers import Wav2Vec2ForSequenceClassification, Wav2Vec2Processor
from config import config
import logging
import subprocess
import tempfile
import os

logger = logging.getLogger(__name__)

class EmotionAnalyzer:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")
        
        logger.info(f"Loading model: {config.MODEL_NAME}")
        self.model = Wav2Vec2ForSequenceClassification.from_pretrained(config.MODEL_NAME).to(self.device)
        self.processor = Wav2Vec2Processor.from_pretrained(config.MODEL_NAME)
        
        self.id2label = self.model.config.id2label
        logger.info(f"Model loaded successfully with emotions: {list(self.id2label.values())}")
    
    def load_audio(self, audio_path, target_sr=16000):
        """
        Load audio file with ffmpeg fallback for WebM and other formats
        """
        try:
            # Try librosa first
            audio, sr = librosa.load(audio_path, sr=target_sr, mono=True)
            return audio, sr
            
        except Exception as librosa_error:
            logger.warning(f"librosa failed: {librosa_error}. Trying ffmpeg...")
            
            try:
                # Use ffmpeg to convert to WAV first
                temp_wav = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
                temp_wav.close()
                
                # Convert using ffmpeg
                cmd = [
                    'ffmpeg',
                    '-i', audio_path,
                    '-ar', str(target_sr),  # Sample rate
                    '-ac', '1',              # Mono
                    '-f', 'wav',             # WAV format
                    '-y',                    # Overwrite
                    temp_wav.name
                ]
                
                result = subprocess.run(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=30
                )
                
                if result.returncode != 0:
                    raise RuntimeError(f"ffmpeg failed: {result.stderr.decode()}")
                
                # Load the converted file
                audio, sr = librosa.load(temp_wav.name, sr=target_sr, mono=True)
                
                # Clean up
                os.unlink(temp_wav.name)
                
                logger.info(f"Audio loaded successfully via ffmpeg: {audio.shape}")
                return audio, sr
                
            except FileNotFoundError:
                logger.error("ffmpeg not found. Install ffmpeg: https://ffmpeg.org/download.html")
                raise RuntimeError(
                    "ffmpeg is required to process WebM files. "
                    "Please install ffmpeg: https://ffmpeg.org/download.html"
                )
            except Exception as ffmpeg_error:
                logger.error(f"ffmpeg conversion failed: {ffmpeg_error}")
                raise RuntimeError(f"Could not load audio file: {ffmpeg_error}")
    
    def analyze_emotion(self, audio_path):
        """
        Analyze emotion from audio file (basic analysis)
        """
        try:
            # Load audio
            audio, sr = self.load_audio(audio_path)
            
            # Preprocess
            inputs = self.processor(
                audio,
                sampling_rate=sr,
                return_tensors="pt",
                padding=True
            )
            
            # Move to device
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Predict
            with torch.no_grad():
                logits = self.model(**inputs).logits
            
            # Get predictions
            probs = torch.nn.functional.softmax(logits, dim=-1)[0]
            predicted_id = torch.argmax(probs).item()
            
            # Create result
            result = {
                "emotion": self.id2label[predicted_id],
                "confidence": float(probs[predicted_id]),
                "all_scores": {
                    self.id2label[i]: float(probs[i])
                    for i in range(len(probs))
                }
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error in emotion analysis: {e}", exc_info=True)
            raise
    
    def analyze_emotion_with_chunks(self, audio_path, remove_silence=True):
        """
        Analyze emotion from long audio with chunking
        """
        try:
            # Load audio
            audio, sr = self.load_audio(audio_path)
            
            if remove_silence:
                audio = self._remove_silence(audio, sr)
            
            # Split into chunks
            chunk_duration = 5  # seconds
            chunk_samples = chunk_duration * sr
            chunks = []
            
            for i in range(0, len(audio), chunk_samples):
                chunk = audio[i:i + chunk_samples]
                if len(chunk) > sr:  # At least 1 second
                    chunks.append(chunk)
            
            if not chunks:
                return self.analyze_emotion(audio_path)
            
            # Analyze each chunk
            chunk_results = []
            emotion_counts = {}
            
            for idx, chunk in enumerate(chunks):
                try:
                    inputs = self.processor(
                        chunk,
                        sampling_rate=sr,
                        return_tensors="pt",
                        padding=True
                    )
                    inputs = {k: v.to(self.device) for k, v in inputs.items()}
                    
                    with torch.no_grad():
                        logits = self.model(**inputs).logits
                    
                    probs = torch.nn.functional.softmax(logits, dim=-1)[0]
                    predicted_id = torch.argmax(probs).item()
                    emotion = self.id2label[predicted_id]
                    confidence = float(probs[predicted_id])
                    
                    chunk_results.append({
                        "start": idx * chunk_duration,
                        "end": (idx + 1) * chunk_duration,
                        "emotion": emotion,
                        "confidence": confidence
                    })
                    
                    emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
                    
                except Exception as e:
                    logger.warning(f"Error processing chunk {idx}: {e}")
                    continue
            
            # Aggregate results
            if emotion_counts:
                dominant_emotion = max(emotion_counts, key=emotion_counts.get)
                avg_confidence = np.mean([c["confidence"] for c in chunk_results])
            else:
                dominant_emotion = "neutral"
                avg_confidence = 0.0
            
            return {
                "emotion": dominant_emotion,
                "confidence": float(avg_confidence),
                "all_scores": emotion_counts,
                "chunks": chunk_results,
                "total_chunks": len(chunks)
            }
            
        except Exception as e:
            logger.error(f"Error in chunked analysis: {e}", exc_info=True)
            raise
    
    def analyze_emotion_with_metrics(self, audio_path, remove_silence=True):
        """
        Complete analysis: emotion + audio metrics
        """
        try:
            # Get chunked emotion analysis
            emotion_result = self.analyze_emotion_with_chunks(audio_path, remove_silence)
            
            # Load audio for metrics
            audio, sr = self.load_audio(audio_path)
            
            # Calculate audio metrics
            duration = len(audio) / sr
            
            # Estimate speech metrics
            if remove_silence:
                audio_clean = self._remove_silence(audio, sr)
                speech_duration = len(audio_clean) / sr
            else:
                speech_duration = duration
            
            silence_duration = duration - speech_duration
            
            # Estimate speech rate (rough approximation)
            # Assuming ~150 words per minute on average
            estimated_words = (speech_duration / 60) * 150
            speech_rate = estimated_words / (duration / 60) if duration > 0 else 0
            
            # Count pauses (silence segments > 0.5s)
            pause_count = self._count_pauses(audio, sr)
            avg_pause_duration = silence_duration / pause_count if pause_count > 0 else 0
            
            audio_metrics = {
                "duration": round(duration, 2),
                "speech_duration": round(speech_duration, 2),
                "silence_duration": round(silence_duration, 2),
                "speech_rate": round(speech_rate, 2),
                "pause_count": pause_count,
                "avg_pause_duration": round(avg_pause_duration, 2)
            }
            
            # Generate interpretation
            interpretation = self._generate_interpretation(emotion_result, audio_metrics)
            
            return {
                **emotion_result,
                "audio_metrics": audio_metrics,
                "interpretation": interpretation
            }
            
        except Exception as e:
            logger.error(f"Error in complete analysis: {e}", exc_info=True)
            raise
    
    def _remove_silence(self, audio, sr, threshold=0.02):
        """Remove silent parts from audio"""
        try:
            # Use librosa's built-in silence removal
            audio_clean, _ = librosa.effects.trim(audio, top_db=20)
            return audio_clean
        except:
            return audio
    
    def _count_pauses(self, audio, sr, min_silence_duration=0.5):
        """Count pauses in audio"""
        try:
            # Simple pause detection
            frame_length = int(0.1 * sr)  # 100ms frames
            hop_length = frame_length // 2
            
            # Calculate energy
            energy = np.array([
                np.sum(audio[i:i+frame_length]**2)
                for i in range(0, len(audio) - frame_length, hop_length)
            ])
            
            # Threshold
            threshold = np.mean(energy) * 0.1
            is_silence = energy < threshold
            
            # Count transitions from sound to silence
            pauses = 0
            in_silence = False
            silence_frames = 0
            min_silence_frames = int(min_silence_duration * sr / hop_length)
            
            for silent in is_silence:
                if silent:
                    silence_frames += 1
                else:
                    if silence_frames >= min_silence_frames:
                        pauses += 1
                    silence_frames = 0
            
            return pauses
        except:
            return 0
    
    def _generate_interpretation(self, emotion_result, audio_metrics):
        """Generate human-readable interpretation"""
        emotion = emotion_result.get("emotion", "neutral")
        confidence = emotion_result.get("confidence", 0)
        speech_rate = audio_metrics.get("speech_rate", 0)
        pause_count = audio_metrics.get("pause_count", 0)
        
        interpretation = []
        
        # Emotion interpretation
        if confidence > 0.7:
            interpretation.append(f"Speaker shows strong {emotion} emotion.")
        elif confidence > 0.5:
            interpretation.append(f"Speaker displays moderate {emotion} emotion.")
        else:
            interpretation.append(f"Emotion is subtle, leaning towards {emotion}.")
        
        # Speech rate interpretation
        if speech_rate > 160:
            interpretation.append("Speech rate is fast.")
        elif speech_rate > 120:
            interpretation.append("Speech rate is moderate.")
        else:
            interpretation.append("Speech rate is slow and deliberate.")
        
        # Pause interpretation
        if pause_count > 5:
            interpretation.append("Multiple pauses suggest thoughtful consideration.")
        elif pause_count > 2:
            interpretation.append("Natural pauses in speech.")
        else:
            interpretation.append("Continuous speech with minimal pauses.")
        
        return " ".join(interpretation)


# Singleton instance
_analyzer = None

def get_analyzer():
    """Get or create analyzer instance"""
    global _analyzer
    if _analyzer is None:
        _analyzer = EmotionAnalyzer()
    return _analyzer