import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MODEL_NAME = os.getenv("MODEL_NAME", "superb/wav2vec2-base-superb-er")
    MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 10485760))
    
    # ✅ MUST have webm here!
    ALLOWED_EXTENSIONS = ["wav", "mp3", "flac", "ogg", "webm", "m4a"]
    
    SERVICE_PORT = int(os.getenv("SERVICE_PORT", 8002))
    
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

# This print will show what formats are allowed
print(f"✅ Allowed formats: {', '.join(config.ALLOWED_EXTENSIONS)}")