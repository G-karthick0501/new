import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MODEL_NAME = os.getenv("MODEL_NAME", "ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition")
    MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 10485760))  # 10MB
    ALLOWED_EXTENSIONS = os.getenv("ALLOWED_EXTENSIONS", "wav,mp3,flac,ogg").split(",")
    SERVICE_PORT = int(os.getenv("SERVICE_PORT", 8001))
    
    # Emotion labels mapping
    EMOTION_LABELS = {
        0: "neutral",
        1: "calm",
        2: "happy",
        3: "sad",
        4: "angry",
        5: "fearful",
        6: "disgust",
        7: "surprised"
    }

config = Config()
