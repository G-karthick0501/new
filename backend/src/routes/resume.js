// routes/resume.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const OpenAI = require("openai");
const auth = require("../middleware/auth");
const axios = require("axios");
const FormData = require("form-data");
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ========================= RESUME ROUTES =========================

// Test endpoint for resume upload
router.post("/test-upload", auth, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'jobDescription', maxCount: 1 }
]), (req, res) => {
  try {
    const resume = req.files.resume?.[0];
    const jd = req.files.jobDescription?.[0];

    if (!resume || !jd) {
      return res.status(400).json({ msg: "Both files required" });
    }

    console.log("Resume file:", resume.originalname, resume.size);
    console.log("JD file:", jd.originalname, jd.size);

    res.json({
      success: true,
      resumeSize: resume.size,
      jdSize: jd.size,
      resumeName: resume.originalname,
      jdName: jd.originalname,
      message: "Files received successfully"
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ msg: "Upload failed" });
  }
});

// Analyze endpoint
router.post("/analyze", auth, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'jobDescription', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log("🎯 Analyze endpoint called!");

    const resume = req.files.resume?.[0];
    const jd = req.files.jobDescription?.[0];

    if (!resume || !jd) {
      return res.status(400).json({ msg: "Both files required" });
    }

    console.log("📁 Files received for analysis:");
    console.log("Resume:", resume.originalname, resume.size);
    console.log("JD:", jd.originalname, jd.size);

    console.log("🤖 Calling AI service...");

    const formData = new FormData();
    formData.append('resume_file', resume.buffer, {
      filename: resume.originalname,
      contentType: resume.mimetype
    });
    formData.append('jd_file', jd.buffer, {
      filename: jd.originalname,
      contentType: jd.mimetype
    });

    // Call AI service
    const aiResponse = await axios.post('http://localhost:8000/analyze', formData, {
      headers: formData.getHeaders(),
      timeout: 120000
    });

    console.log("✅ AI service responded successfully");

    const missingSkills = aiResponse.data.missing_skills || [];
    const improvementTips = aiResponse.data.improvement_tips || [];
    const optimizedResume = aiResponse.data.optimized_resume_text || '';

    res.json({
      success: true,
      analysis: {
        missingSkillsCount: missingSkills.length,
        improvementTipsCount: improvementTips.length,
        missingSkills,
        improvementTips,
        optimizedResume,
        analysisDate: new Date(),
        resumeFileName: resume.originalname,
        jdFileName: jd.originalname,
        debug: {
          beforeChunks: aiResponse.data.before_missing_chunks?.length || 0,
          afterChunks: aiResponse.data.after_missing_chunks?.length || 0
        }
      }
    });

  } catch (error) {
    console.error("❌ Analyze error:", error.message);

    res.status(500).json({
      msg: "Analysis failed",
      details: error.message,
      hint: "Check backend and AI service logs for details"
    });
  }
});

// ========================= TRANSCRIBE ROUTES =========================


// POST /api/resume/transcribe
router.post("/transcribe", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No audio file uploaded" });

    const formData = new FormData();
    formData.append("file", req.file.buffer, "response.webm");

    const response = await axios.post("http://localhost:8000/transcribe", formData, {
      headers: formData.getHeaders(),
    });

    res.json({ text: response.data.text });
  } catch (err) {
    console.error("Transcription error:", err.message);
    res.status(500).json({ error: "Transcription failed", details: err.message });
  }
});

// GET test endpoint for transcribe
router.get("/transcribe/test", (req, res) => {
  res.json({ message: "Transcribe route works" });
});

module.exports = router;
