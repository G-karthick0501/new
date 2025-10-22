# ai_services4/resume-analyzer/core/jd_cache.py

import hashlib
import json
import os
from datetime import datetime

# Cache directory path
CACHE_DIR = os.path.join(os.path.dirname(__file__), "..", "jd_cache")

# Ensure cache directory exists
os.makedirs(CACHE_DIR, exist_ok=True)


def generate_jd_hash(jd_text):
    """
    Generate a unique hash for a JD based on its content.
    Same JD content = same hash = cache hit.
    """
    # Use SHA-256 hash of the text content
    text_bytes = jd_text.encode('utf-8')
    hash_object = hashlib.sha256(text_bytes)
    jd_hash = hash_object.hexdigest()[:16]  # Use first 16 chars for shorter hash
    
    return jd_hash


def get_cache_filepath(jd_hash):
    """
    Get the file path for a given JD hash.
    """
    return os.path.join(CACHE_DIR, f"{jd_hash}.json")


def get_from_cache(jd_hash):
    """
    Retrieve filtered JD from cache if it exists.
    Returns None if not found.
    """
    cache_file = get_cache_filepath(jd_hash)
    
    if not os.path.exists(cache_file):
        print(f"❌ Cache miss for hash: {jd_hash}")
        return None
    
    try:
        with open(cache_file, 'r', encoding='utf-8') as f:
            cached_data = json.load(f)
        
        print(f"✅ Cache hit for hash: {jd_hash}")
        return cached_data
        
    except Exception as e:
        print(f"⚠️ Error reading cache for {jd_hash}: {str(e)}")
        return None

def save_to_cache(jd_hash, filter_result):
    """
    Save filtered JD result to cache.
    
    Args:
        jd_hash: The hash of the JD
        filter_result: Dict containing filtered_text, stage_used, stats, etc.
    """
    cache_file = get_cache_filepath(jd_hash)
    
    # Prepare data to cache
    cache_data = {
        "jd_hash": jd_hash,
        "filtered_text": filter_result["filtered_text"],
        "stage_used": filter_result["stage_used"],
        "original_length": filter_result["stats"]["original_words"],
        "filtered_length": filter_result["stats"]["after_stage2"],
        "reduction_percent": filter_result["stats"]["reduction_percentage"],
        "cached_at": datetime.now().isoformat()
    }
    
    try:
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Saved to cache: {cache_file}")
        return True
        
    except Exception as e:
        print(f"❌ Error saving to cache: {str(e)}")
        return False
    
def clear_cache():
    """
    Clear all cached JD files.
    Useful for testing or periodic cleanup.
    """
    try:
        files = os.listdir(CACHE_DIR)
        json_files = [f for f in files if f.endswith('.json')]
        
        for file in json_files:
            os.remove(os.path.join(CACHE_DIR, file))
        
        print(f"🗑️ Cleared {len(json_files)} cached files")
        return len(json_files)
        
    except Exception as e:
        print(f"❌ Error clearing cache: {str(e)}")
        return 0


def get_cache_stats():
    """
    Get statistics about the cache.
    Returns dict with cache info.
    """
    try:
        files = os.listdir(CACHE_DIR)
        json_files = [f for f in files if f.endswith('.json')]
        
        total_size = 0
        for file in json_files:
            file_path = os.path.join(CACHE_DIR, file)
            total_size += os.path.getsize(file_path)
        
        return {
            "total_cached_jds": len(json_files),
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "cache_directory": CACHE_DIR
        }
        
    except Exception as e:
        print(f"❌ Error getting cache stats: {str(e)}")
        return {
            "total_cached_jds": 0,
            "total_size_bytes": 0,
            "total_size_mb": 0,
            "cache_directory": CACHE_DIR,
            "error": str(e)
        }