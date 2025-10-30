from dotenv import load_dotenv
import os
from pathlib import Path

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).parent / '.env')

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "150"))
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.6"))

# Validate required environment variables
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found. Please set it in your .env file")

print(f"✅ Configuration loaded successfully")
print(f"📊 Embedding model: {EMBEDDING_MODEL}")
print(f"🔢 Chunk size: {CHUNK_SIZE}")
print(f"📈 Similarity threshold: {SIMILARITY_THRESHOLD}")