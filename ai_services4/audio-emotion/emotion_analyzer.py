import torch
import librosa
import numpy as np
import logging
import math
from typing import Dict, Tuple, List
from transformers import Wav2Vec2FeatureExtractor, Wav2Vec2ForSequenceClassification
from audio_processor import AudioPreprocessor
from audio_metrics import AudioMetricsExtractor

logger = logging.getLogger(__name__)

class EmotionAnalyzer:
    """
    Audio emotion analyzer using HuggingFace Wav2Vec2 model
    """
    
    def __init__(self):
        """Initialize the model, feature extractor, and metrics extractor"""
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")
        
        model_name = "superb/wav2vec2-base-superb-er"
        try:
            logger.info(f"Loading model: {model_name}")
            self.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(model_name)
            self.model = Wav2Vec2ForSequenceClassification.from_pretrained(model_name)
            self.model.to(self.device)
            self.model.eval()
            
            self.id2label = self.model.config.id2label
            logger.info(f"Model loaded successfully with emotions: {list(self.id2label.values())}")
            
            # Initialize preprocessor and metrics extractor
            self.preprocessor = AudioPreprocessor(chunk_duration=5, overlap=0.5)
            self.metrics_extractor = AudioMetricsExtractor()
            
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise

    # ------------------- Audio Loading -------------------
    def load_audio(self, audio_path: str, target_sr: int = 16000) -> Tuple[np.ndarray, int]:
        try:
            audio, sr = librosa.load(audio_path, sr=target_sr, mono=True)
            logger.info(f"Loaded audio: duration={len(audio)/sr:.2f}s, sr={sr}Hz")
            return audio, sr
        except Exception as e:
            logger.error(f"Error loading audio: {str(e)}")
            raise

    # ------------------- Single Prediction -------------------
    def predict_emotion(self, audio: np.ndarray, sample_rate: int) -> Dict:
        try:
            inputs = self.feature_extractor(
                audio,
                sampling_rate=sample_rate,
                return_tensors="pt",
                padding=True
            )
            input_values = inputs.input_values.to(self.device)
            with torch.no_grad():
                logits = self.model(input_values).logits

            probs = torch.nn.functional.softmax(logits, dim=-1).cpu().numpy()[0]
            predicted_id = int(np.argmax(probs))
            confidence = float(probs[predicted_id])
            predicted_emotion = self.id2label[predicted_id]
            
            all_scores = {self.id2label[i]: float(probs[i]) for i in range(len(probs))}
            
            return {
                "emotion": predicted_emotion,
                "confidence": confidence,
                "all_scores": all_scores
            }
        except Exception as e:
            logger.error(f"Error predicting emotion: {str(e)}")
            raise

    # ------------------- Chunked Analysis -------------------
    def analyze_emotion_with_chunks(self, audio_path: str, remove_silence: bool = True) -> Dict:
        audio, sr = self.load_audio(audio_path)
        if len(audio) == 0:
            raise ValueError("Audio file is empty or corrupted")
        
        chunks = self.preprocessor.preprocess(audio, sr, remove_silence)
        logger.info(f"Processing {len(chunks)} chunks...")
        
        chunk_results = []
        for i, (chunk_audio, start_time) in enumerate(chunks):
            result = self.predict_emotion(chunk_audio, sr)
            result.update({
                "chunk_index": i,
                "start_time": start_time,
                "chunk_duration": len(chunk_audio)/sr
            })
            chunk_results.append(result)
        
        aggregated = self._aggregate_chunk_results(chunk_results)
        aggregated.update({
            "total_duration": len(audio)/sr,
            "sample_rate": sr,
            "num_chunks": len(chunks),
            "chunk_results": chunk_results
        })
        logger.info(f"Analysis complete: {aggregated['dominant_emotion']} ({aggregated['avg_confidence']:.2%})")
        return aggregated

    # ------------------- Aggregate Chunks -------------------
    def _aggregate_chunk_results(self, chunk_results: List[Dict]) -> Dict:
        emotion_weights = {}
        total_confidence = 0

        for r in chunk_results:
            e = r["emotion"]
            c = r["confidence"]
            emotion_weights[e] = emotion_weights.get(e, 0) + c
            total_confidence += c

        emotion_percentages = {e: (w/total_confidence)*100 for e, w in emotion_weights.items()}
        dominant_emotion = max(emotion_weights, key=emotion_weights.get)
        dominant_confidences = [r["confidence"] for r in chunk_results if r["emotion"] == dominant_emotion]
        avg_confidence = float(np.mean(dominant_confidences)) if dominant_confidences else 0

        return {
            "dominant_emotion": dominant_emotion,
            "avg_confidence": avg_confidence,
            "emotion_distribution": emotion_percentages,
            "emotion_timeline": [
                {"time": r["start_time"], "emotion": r["emotion"], "confidence": r["confidence"]}
                for r in chunk_results
            ]
        }

    # ------------------- Complete Analysis with Metrics -------------------
    def analyze_emotion_with_metrics(self, audio_path: str, remove_silence: bool = True) -> Dict:
        try:
            # Emotion analysis
            emotion_result = self.analyze_emotion_with_chunks(audio_path, remove_silence)
            
            # Audio metrics (on original audio without silence removal)
            audio, sr = self.load_audio(audio_path)
            audio_metrics = self.metrics_extractor.extract_all_metrics(audio, sr)
            
            # Add objective emotion metrics to emotion_result
            emotion_result = self._add_objective_emotion_metrics(emotion_result)
            
            # Interpretation
            interpretation = self._interpret_metrics(emotion_result, audio_metrics)
            
            return {
                "emotion_analysis": emotion_result,
                "audio_metrics": audio_metrics,
                "interpretation": interpretation
            }
        except Exception as e:
            logger.error(f"Error in complete analysis: {str(e)}")
            raise

    # ------------------- Objective Emotion Metrics -------------------
    def _add_objective_emotion_metrics(self, emotion_result: Dict) -> Dict:
        """Add computed objective metrics about emotion stability"""
        try:
            timeline = emotion_result.get("emotion_timeline", [])
            confidences = [x["confidence"] for x in timeline]
            emotions = [x["emotion"] for x in timeline]
            
            if len(emotions) < 2:
                emotion_result["objective_emotion_metrics"] = {
                    "emotion_stability": 1.0,
                    "confidence_std_dev": 0.0,
                    "emotion_entropy_bits": 0.0,
                    "dominant_emotion_ratio": 1.0,
                    "peak_confidence": confidences[0] if confidences else 0.0,
                    "emotional_shift_duration_sec": 0.0
                }
                return emotion_result

            # Emotion switches (how often emotion changes)
            emotion_switches = sum(1 for i in range(1, len(emotions)) if emotions[i] != emotions[i-1])
            stability_index = 1 - (emotion_switches / (len(emotions)-1))
            
            # Confidence statistics
            avg_confidence = sum(confidences)/len(confidences)
            confidence_std = (sum((c - avg_confidence)**2 for c in confidences)/len(confidences))**0.5
            
            # Emotion entropy (diversity of emotions)
            probs = [p/100 for p in emotion_result.get("emotion_distribution", {}).values() if p > 0]
            entropy = -sum(p*math.log2(p) for p in probs if p > 0)
            
            # Dominant emotion ratio
            dominant = emotion_result.get("dominant_emotion", "unknown")
            dominant_ratio = sum(1 for e in emotions if e==dominant)/len(emotions)
            
            # Peak confidence
            peak_confidence = max(confidences)
            
            # Duration of emotional shift (time from first non-dominant to last)
            shift_chunks = [t for t in timeline if t["emotion"] != dominant]
            if len(shift_chunks) >= 2:
                shift_duration = shift_chunks[-1]["time"] - shift_chunks[0]["time"] + 2.5
            else:
                shift_duration = 0.0

            emotion_result["objective_emotion_metrics"] = {
                "emotion_stability": round(stability_index, 3),
                "confidence_std_dev": round(confidence_std, 3),
                "emotion_entropy_bits": round(entropy, 3),
                "dominant_emotion_ratio": round(dominant_ratio, 3),
                "peak_confidence": round(peak_confidence, 3),
                "emotional_shift_duration_sec": round(shift_duration, 2)
            }
            
            return emotion_result
            
        except Exception as e:
            logger.error(f"Error computing objective emotion metrics: {str(e)}")
            return emotion_result

    # ------------------- Interpretation -------------------
    def _interpret_metrics(self, emotion_result: Dict, audio_metrics: Dict) -> Dict:
        try:
            interpretation = {}
            
            # Get dominant emotion info
            dominant = emotion_result.get("dominant_emotion", "unknown")
            avg_confidence = emotion_result.get("avg_confidence", 0)

            # ------------------- Audio signal interpretation -------------------
            mean_pitch = audio_metrics.get("mean_pitch_hz", 0)
            if mean_pitch > 0:
                if mean_pitch < 85:
                    interpretation["pitch"] = "Very low pitch (bass voice)"
                elif mean_pitch < 165:
                    interpretation["pitch"] = "Low pitch (typical male voice)"
                elif mean_pitch < 255:
                    interpretation["pitch"] = "Medium pitch (typical female/high male voice)"
                else:
                    interpretation["pitch"] = "High pitch"
            else:
                interpretation["pitch"] = "Unable to detect pitch"

            wpm = audio_metrics.get("estimated_wpm", 0)
            if wpm < 100:
                interpretation["speaking_rate"] = "Slow pace (deliberate/cautious)"
            elif wpm < 150:
                interpretation["speaking_rate"] = "Normal pace"
            elif wpm < 180:
                interpretation["speaking_rate"] = "Fast pace (confident/excited)"
            else:
                interpretation["speaking_rate"] = "Very fast pace (rushed/anxious)"

            mean_energy = audio_metrics.get("mean_energy_db", -60)
            if mean_energy > -20:
                interpretation["volume"] = "Loud/energetic"
            elif mean_energy > -30:
                interpretation["volume"] = "Normal volume"
            else:
                interpretation["volume"] = "Quiet/soft-spoken"

            speech_ratio = audio_metrics.get("speech_ratio", 0)
            if speech_ratio > 0.8:
                interpretation["fluency"] = "High fluency (minimal pauses)"
            elif speech_ratio > 0.6:
                interpretation["fluency"] = "Good fluency"
            else:
                interpretation["fluency"] = "Many pauses/hesitations"

            # ------------------- Objective emotion metrics interpretation -------------------
            obj_metrics = emotion_result.get("objective_emotion_metrics", {})
            
            stability = obj_metrics.get("emotion_stability", 0)
            if stability > 0.8:
                interpretation["emotion_consistency"] = "Very stable emotions"
            elif stability > 0.6:
                interpretation["emotion_consistency"] = "Moderately stable"
            else:
                interpretation["emotion_consistency"] = "Variable emotions (multiple shifts)"
            
            entropy = obj_metrics.get("emotion_entropy_bits", 0)
            if entropy < 0.5:
                interpretation["emotion_diversity"] = "Single dominant emotion"
            elif entropy < 1.0:
                interpretation["emotion_diversity"] = "Low diversity (2 emotions mainly)"
            else:
                interpretation["emotion_diversity"] = "High diversity (mixed emotions)"

            # ------------------- Overall summary -------------------
            interpretation["overall_summary"] = (
                f"Primarily {dominant} emotion ({avg_confidence:.1%} confidence), "
                f"{interpretation.get('speaking_rate', 'normal pace')}, "
                f"{interpretation.get('volume', 'normal volume')}, "
                f"{interpretation.get('emotion_consistency', 'stable')}"
            )

            return interpretation

        except Exception as e:
            logger.error(f"Error interpreting metrics: {str(e)}")
            return {"overall_summary": "Unable to interpret metrics"}


# ------------------- Singleton -------------------
_analyzer_instance = None

def get_analyzer() -> EmotionAnalyzer:
    global _analyzer_instance
    if _analyzer_instance is None:
        _analyzer_instance = EmotionAnalyzer()
    return _analyzer_instance