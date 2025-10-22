import librosa
import numpy as np
from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)

class AudioPreprocessor:
    """
    Preprocess audio for emotion analysis:
    - Chunk long audio
    - Remove silence
    - Normalize audio
    """
    
    def __init__(self, chunk_duration: int = 5, overlap: float = 0.5):
        """
        Args:
            chunk_duration: Duration of each chunk in seconds
            overlap: Overlap between chunks (0.0 to 1.0)
        """
        self.chunk_duration = chunk_duration
        self.overlap = overlap
    
    def remove_silence(self, audio: np.ndarray, sr: int, top_db: int = 30) -> np.ndarray:
        """
        Remove silent parts from audio
        
        Args:
            audio: Audio array
            sr: Sample rate
            top_db: Threshold in decibels below reference to consider as silence
        
        Returns:
            Audio with silence removed
        """
        try:
            # Split audio where silence is detected
            non_silent_intervals = librosa.effects.split(audio, top_db=top_db)
            
            # Concatenate non-silent parts
            if len(non_silent_intervals) > 0:
                non_silent_audio = np.concatenate([
                    audio[start:end] for start, end in non_silent_intervals
                ])
                logger.info(f"Removed silence: {len(audio)/sr:.2f}s -> {len(non_silent_audio)/sr:.2f}s")
                return non_silent_audio
            else:
                logger.warning("No non-silent audio detected, returning original")
                return audio
                
        except Exception as e:
            logger.error(f"Error removing silence: {str(e)}")
            return audio
    
    def normalize_audio(self, audio: np.ndarray) -> np.ndarray:
        """
        Normalize audio amplitude
        
        Args:
            audio: Audio array
        
        Returns:
            Normalized audio
        """
        try:
            # Normalize to [-1, 1] range
            max_val = np.abs(audio).max()
            if max_val > 0:
                audio = audio / max_val
            return audio
        except Exception as e:
            logger.error(f"Error normalizing audio: {str(e)}")
            return audio
    
    def chunk_audio(self, audio: np.ndarray, sr: int) -> List[Tuple[np.ndarray, float]]:
        """
        Split audio into overlapping chunks
        
        Args:
            audio: Audio array
            sr: Sample rate
        
        Returns:
            List of (chunk_audio, chunk_start_time) tuples
        """
        try:
            chunk_samples = int(self.chunk_duration * sr)
            hop_samples = int(chunk_samples * (1 - self.overlap))
            
            chunks = []
            start = 0
            
            while start < len(audio):
                end = min(start + chunk_samples, len(audio))
                chunk = audio[start:end]
                
                # Only keep chunks that are at least 1 second
                if len(chunk) >= sr:
                    start_time = start / sr
                    chunks.append((chunk, start_time))
                
                start += hop_samples
                
                # Break if we've reached the end
                if end >= len(audio):
                    break
            
            logger.info(f"Created {len(chunks)} chunks from audio")
            return chunks
            
        except Exception as e:
            logger.error(f"Error chunking audio: {str(e)}")
            return [(audio, 0.0)]
    
    def preprocess(self, audio: np.ndarray, sr: int, remove_silence: bool = True) -> List[Tuple[np.ndarray, float]]:
        """
        Complete preprocessing pipeline
        
        Args:
            audio: Audio array
            sr: Sample rate
            remove_silence: Whether to remove silent parts
        
        Returns:
            List of preprocessed audio chunks with timestamps
        """
        try:
            # Normalize
            audio = self.normalize_audio(audio)
            
            # Remove silence if requested
            if remove_silence and len(audio) > sr:  # Only for audio > 1 second
                audio = self.remove_silence(audio, sr)
            
            # Check if audio is too short after preprocessing
            if len(audio) < sr * 0.5:
                raise ValueError("Audio too short after preprocessing (< 0.5s)")
            
            # Chunk if longer than chunk_duration
            if len(audio) > self.chunk_duration * sr:
                chunks = self.chunk_audio(audio, sr)
            else:
                chunks = [(audio, 0.0)]
            
            return chunks
            
        except Exception as e:
            logger.error(f"Error in preprocessing: {str(e)}")
            raise