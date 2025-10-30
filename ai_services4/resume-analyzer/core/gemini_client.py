import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found. Check your .env file.")

def call_gemini_ai(prompt: str) -> str:
    """Send prompt to Gemini REST API and return plain text output."""
    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }

    headers = {"Content-Type": "application/json"}

    resp = requests.post(f"{API_URL}?key={API_KEY}", headers=headers, json=payload)

    if resp.status_code == 200:
        try:
            candidates = resp.json().get("candidates", [])
            if candidates:
                text_out = candidates[0]["content"]["parts"][0]["text"]
                return text_out.strip()
            return ""
        except Exception as e:
            print("Error parsing Gemini response:", e)
            return ""
    else:
        print("Gemini API error:", resp.status_code, resp.text)
        return ""
