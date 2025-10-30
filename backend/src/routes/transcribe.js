// backend/src/routes/transcribe.js - Lightweight transcription using OpenAI Whisper API
const express = require("express");
const router = express.Router();
const multer = require("multer");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const os = require("os");

// Setup multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// Initialize OpenAI client (only if API key exists)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log("✅ OpenAI Whisper API configured for transcription");
} else {
  console.warn("⚠️  OPENAI_API_KEY not found - transcription will return empty results");
}

// POST /api/transcribe
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No audio file uploaded"
      });
    }

    console.log(`🎙️ Transcribing audio: ${req.file.originalname} (${req.file.size} bytes)`);

    // Check if OpenAI API key is configured
    if (!openai) {
      console.warn("⚠️ OpenAI API key not configured, returning empty transcription");
      return res.json({
        success: true,
        transcription: {
          raw_text: "",
          cleaned_text: ""
        },
        warning: "OpenAI API key not configured. Please add OPENAI_API_KEY to .env"
      });
    }

    // Write buffer to temporary file (OpenAI requires file path)
    const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.webm`);
    fs.writeFileSync(tempFilePath, req.file.buffer);

    try {
      // Call OpenAI Whisper API
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: "whisper-1",
        language: "en", // Specify language for better accuracy
        response_format: "text"
      });

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      const transcribedText = transcription.trim();
      
      console.log(`✅ Transcription complete: "${transcribedText.substring(0, 50)}..."`);

      res.json({
        success: true,
        transcription: {
          raw_text: transcribedText,
          cleaned_text: transcribedText
        },
        language: "en"
      });

    } catch (apiError) {
      // Clean up temp file on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw apiError;
    }

  } catch (error) {
    console.error("❌ Transcription error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message || "Transcription failed",
      transcription: {
        raw_text: "",
        cleaned_text: ""
      }
    });
  }
});

// GET test endpoint
router.get("/test", (req, res) => {
  res.json({
    service: "Transcription Service",
    status: "ready",
    provider: "OpenAI Whisper API",
    apiKeyConfigured: !!openai
  });
});

module.exports = router;
