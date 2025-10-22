import librosa
import numpy as np
from typing import Dict
import logging

logger = logging.getLogger(__name__)

class AudioMetricsExtractor:
    """
    Extract objective audio metrics from speech
    """
    
    def __init__(self):
        pass
    
    def extract_pitch_features(self, audio: np.ndarray, sr: int) -> Dict:
        """
        Extract pitch (F0) features
        
        Args:
            audio: Audio array
            sr: Sample rate
        
        Returns:
            Dictionary with pitch statistics
        """
        try:
            # Extract pitch using librosa
            pitches, magnitudes = librosa.piptrack(y=audio, sr=sr)
            
            # Get pitch values (select pitch with highest magnitude at each time)
            pitch_values = []
            for t in range(pitches.shape[1]):
                index = magnitudes[:, t].argmax()
                pitch = pitches[index, t]
                if pitch > 0:  # Only non-zero pitches
                    pitch_values.append(pitch)
            
            if len(pitch_values) == 0:
                return {
                    "mean_pitch_hz": 0.0,
                    "std_pitch_hz": 0.0,
                    "min_pitch_hz": 0.0,
                    "max_pitch_hz": 0.0,
                    "pitch_range_hz": 0.0
                }
            
            pitch_values = np.array(pitch_values)
            
            return {
                "mean_pitch_hz": float(np.mean(pitch_values)),
                "std_pitch_hz": float(np.std(pitch_values)),
                "min_pitch_hz": float(np.min(pitch_values)),
                "max_pitch_hz": float(np.max(pitch_values)),
                "pitch_range_hz": float(np.max(pitch_values) - np.min(pitch_values))
            }
            
        except Exception as e:
            logger.error(f"Error extracting pitch: {str(e)}")
            return {
                "mean_pitch_hz": 0.0,
                "std_pitch_hz": 0.0,
                "min_pitch_hz": 0.0,
                "max_pitch_hz": 0.0,
                "pitch_range_hz": 0.0
            }
    
    def extract_energy_features(self, audio: np.ndarray, sr: int) -> Dict:
        """
        Extract energy/volume features
        
        Args:
            audio: Audio array
            sr: Sample rate
        
        Returns:
            Dictionary with energy statistics
        """
        try:
            # Calculate RMS energy
            rms = librosa.feature.rms(y=audio)[0]
            
            # Convert to decibels
            rms_db = librosa.amplitude_to_db(rms)
            
            return {
                "mean_energy_db": float(np.mean(rms_db)),
                "std_energy_db": float(np.std(rms_db)),
                "min_energy_db": float(np.min(rms_db)),
                "max_energy_db": float(np.max(rms_db)),
                "energy_range_db": float(np.max(rms_db) - np.min(rms_db))
            }
            
        except Exception as e:
            logger.error(f"Error extracting energy: {str(e)}")
            return {
                "mean_energy_db": 0.0,
                "std_energy_db": 0.0,
                "min_energy_db": 0.0,
                "max_energy_db": 0.0,
                "energy_range_db": 0.0
            }
    
    def extract_spectral_features(self, audio: np.ndarray, sr: int) -> Dict:
        """
        Extract spectral features (voice quality)
        
        Args:
            audio: Audio array
            sr: Sample rate
        
        Returns:
            Dictionary with spectral features
        """
        try:
            # Spectral centroid (brightness)
            spectral_centroids = librosa.feature.spectral_centroid(y=audio, sr=sr)[0]
            
            # Spectral rolloff (frequency below which 85% of energy is contained)
            spectral_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=sr)[0]
            
            # Zero crossing rate (voice texture)
            zcr = librosa.feature.zero_crossing_rate(audio)[0]
            
            return {
                "mean_spectral_centroid_hz": float(np.mean(spectral_centroids)),
                "std_spectral_centroid_hz": float(np.std(spectral_centroids)),
                "mean_spectral_rolloff_hz": float(np.mean(spectral_rolloff)),
                "mean_zero_crossing_rate": float(np.mean(zcr)),
                "std_zero_crossing_rate": float(np.std(zcr))
            }
            
        except Exception as e:
            logger.error(f"Error extracting spectral features: {str(e)}")
            return {
                "mean_spectral_centroid_hz": 0.0,
                "std_spectral_centroid_hz": 0.0,
                "mean_spectral_rolloff_hz": 0.0,
                "mean_zero_crossing_rate": 0.0,
                "std_zero_crossing_rate": 0.0
            }
    
    def extract_speaking_rate(self, audio: np.ndarray, sr: int) -> Dict:
        """
        Estimate speaking rate
        
        Args:
            audio: Audio array
            sr: Sample rate
        
        Returns:
            Dictionary with speaking rate metrics
        """
        try:
            # Detect onset (syllables/words start)
            onset_env = librosa.onset.onset_strength(y=audio, sr=sr)
            onsets = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)
            
            # Calculate speaking rate (onsets per second as proxy)
            duration = len(audio) / sr
            onsets_per_second = len(onsets) / duration if duration > 0 else 0
            
            # Approximate words per minute (rough estimate: 1 onset ≈ 0.5-0.7 words)
            estimated_wpm = onsets_per_second * 60 * 0.6
            
            return {
                "onsets_per_second": float(onsets_per_second),
                "estimated_wpm": float(estimated_wpm),
                "total_onsets": int(len(onsets))
            }
            
        except Exception as e:
            logger.error(f"Error extracting speaking rate: {str(e)}")
            return {
                "onsets_per_second": 0.0,
                "estimated_wpm": 0.0,
                "total_onsets": 0
            }
    
    def extract_silence_ratio(self, audio: np.ndarray, sr: int, top_db: int = 30) -> Dict:
        """
        Calculate speech vs silence ratio
        
        Args:
            audio: Audio array
            sr: Sample rate
            top_db: Threshold for silence detection
        
        Returns:
            Dictionary with silence metrics
        """
        try:
            # Detect non-silent intervals
            non_silent_intervals = librosa.effects.split(audio, top_db=top_db)
            
            # Calculate total non-silent duration
            non_silent_duration = sum(
                (end - start) / sr 
                for start, end in non_silent_intervals
            )
            
            total_duration = len(audio) / sr
            silent_duration = total_duration - non_silent_duration
            
            speech_ratio = non_silent_duration / total_duration if total_duration > 0 else 0
            silence_ratio = silent_duration / total_duration if total_duration > 0 else 0
            
            return {
                "speech_duration_sec": float(non_silent_duration),
                "silence_duration_sec": float(silent_duration),
                "speech_ratio": float(speech_ratio),
                "silence_ratio": float(silence_ratio),
                "num_speech_segments": int(len(non_silent_intervals))
            }
            
        except Exception as e:
            logger.error(f"Error extracting silence ratio: {str(e)}")
            return {
                "speech_duration_sec": 0.0,
                "silence_duration_sec": 0.0,
                "speech_ratio": 0.0,
                "silence_ratio": 0.0,
                "num_speech_segments": 0
            }
    
    def extract_all_metrics(self, audio: np.ndarray, sr: int) -> Dict:
        """
        Extract all audio metrics
        
        Args:
            audio: Audio array
            sr: Sample rate
        
        Returns:
            Dictionary with all metrics
        """
        logger.info("Extracting audio metrics...")
        
        metrics = {
            "duration_sec": float(len(audio) / sr),
            "sample_rate_hz": int(sr),
        }
        
        # Extract all feature groups
        metrics.update(self.extract_pitch_features(audio, sr))
        metrics.update(self.extract_energy_features(audio, sr))
        metrics.update(self.extract_spectral_features(audio, sr))
        metrics.update(self.extract_speaking_rate(audio, sr))
        metrics.update(self.extract_silence_ratio(audio, sr))
        
        logger.info("Audio metrics extraction complete")
        
        return metrics