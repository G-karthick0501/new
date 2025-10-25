import wave
import tempfile
import os
from typing import Dict
from fastapi import UploadFile, HTTPException

class TranscriptionService:
    def __init__(self):
        self.transcription_config = self._setup_transcription()
    
    def _setup_transcription(self):
        """Setup transcription with multiple fallback options"""
        # Option 1: Faster-Whisper (most efficient)
        try:
            from faster_whisper import WhisperModel
            model = WhisperModel("base", device="cpu", compute_type="int8")
            return {"method": "faster_whisper", "model": model}
        except ImportError:
            pass
        
        # Option 2: Vosk (lightweight, offline)
        try:
            import vosk
            model_path = self._ensure_vosk_model()
            if model_path:
                vosk_model = vosk.Model(model_path)
                return {"method": "vosk", "model": vosk_model}
        except ImportError:
            pass
        
        # Option 3: OpenAI Whisper (original)
        try:
            import whisper
            model = whisper.load_model("base")
            return {"method": "openai_whisper", "model": model}
        except ImportError:
            pass
        
        # Option 4: SpeechRecognition with Google (requires internet)
        try:
            import speech_recognition as sr
            recognizer = sr.Recognizer()
            return {"method": "speech_recognition", "model": recognizer}
        except ImportError:
            pass
        
        # Fallback: Mock transcription
        return {"method": "mock", "model": None}
    
    def _ensure_vosk_model(self):
        """Download Vosk model if not present"""
        # Implement model download logic if needed
        return None
    
    async def transcribe_audio(self, audio_file: UploadFile) -> Dict[str, str]:
        """Transcribe audio using available transcription method"""
        try:
            # Read audio file
            audio_bytes = await audio_file.read()
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
                tmp_file.write(audio_bytes)
                tmp_path = tmp_file.name
            
            method = self.transcription_config["method"]
            model = self.transcription_config["model"]
            
            raw_transcription = ""
            
            if method == "faster_whisper":
                raw_transcription = await self._transcribe_faster_whisper(model, tmp_path)
            elif method == "vosk":
                raw_transcription = await self._transcribe_vosk(model, tmp_path)
            elif method == "openai_whisper":
                raw_transcription = await self._transcribe_openai_whisper(model, tmp_path)
            elif method == "speech_recognition":
                raw_transcription = await self._transcribe_speech_recognition(model, tmp_path)
            else:
                raw_transcription = "Mock transcription - please install a transcription library"
            
            # Clean up temporary file
            try:
                os.unlink(tmp_path)
            except:
                pass
            
            return {
                "raw_text": raw_transcription,
                "cleaned_text": await self._clean_transcription(raw_transcription)
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    
    async def _transcribe_faster_whisper(self, model, audio_path):
        """Transcribe using Faster-Whisper"""
        segments, info = model.transcribe(audio_path, beam_size=5)
        return " ".join([segment.text for segment in segments])
    
    async def _transcribe_vosk(self, model, audio_path):
        """Transcribe using Vosk"""
        import vosk
        import json
        
        wf = wave.open(audio_path, 'rb')
        rec = vosk.KaldiRecognizer(model, wf.getframerate())
        
        results = []
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if rec.AcceptWaveform(data):
                result = json.loads(rec.Result())
                results.append(result.get('text', ''))
        
        final_result = json.loads(rec.FinalResult())
        results.append(final_result.get('text', ''))
        
        return " ".join(results).strip()
    
    async def _transcribe_openai_whisper(self, model, audio_path):
        """Transcribe using OpenAI Whisper"""
        result = model.transcribe(audio_path)
        return result["text"]
    
    async def _transcribe_speech_recognition(self, recognizer, audio_path):
        """Transcribe using SpeechRecognition"""
        import speech_recognition as sr
        
        with sr.AudioFile(audio_path) as source:
            audio = recognizer.record(source)
        
        return recognizer.recognize_google(audio)
    
    async def _clean_transcription(self, text: str) -> str:
        """Clean and format transcription text"""
        # Basic cleaning
        cleaned = text.strip()
        # Add more cleaning logic as needed
        return cleaned
