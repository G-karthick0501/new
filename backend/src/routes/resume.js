const express = require("express");
const multer = require("multer");
const auth = require("../middleware/auth");
const axios = require("axios");
const FormData = require("form-data");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ============================================
// 🆕 SESSION STORAGE (In-Memory)
// ============================================
const sessionStore = new Map();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Helper: Generate unique session ID
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Save session data
function saveSession(sessionId, data) {
  sessionStore.set(sessionId, {
    ...data,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TIMEOUT
  });
  console.log(`✅ Session saved: ${sessionId}`);
}

// Helper: Get session data
function getSession(sessionId) {
  const session = sessionStore.get(sessionId);
  
  if (!session) {
    console.log(`❌ Session not found: ${sessionId}`);
    return null;
  }
  
  // Check if expired
  if (Date.now() > session.expiresAt) {
    console.log(`⏰ Session expired: ${sessionId}`);
    sessionStore.delete(sessionId);
    return null;
  }
  
  console.log(`✅ Session retrieved: ${sessionId}`);
  return session;
}

// Helper: Clean expired sessions (run periodically)
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [sessionId, session] of sessionStore.entries()) {
    if (now > session.expiresAt) {
      sessionStore.delete(sessionId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} expired sessions`);
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

// ============================================
// END SESSION STORAGE
// ============================================
// Test endpoint (keep working)



// ============================================
// 🆕 ANALYZE INITIAL - Get missing skills only
// ============================================
router.post("/analyze-initial", auth, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'jobDescription', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log("🎯 Analyze-initial endpoint called!");
    
    const resume = req.files.resume?.[0];
    const jd = req.files.jobDescription?.[0];
    
    if (!resume || !jd) {
      return res.status(400).json({ msg: "Both files required" });
    }

    console.log("📁 Files received for initial analysis:");
    console.log("Resume:", resume.originalname, resume.size);
    console.log("JD:", jd.originalname, jd.size);

    // Generate session ID
    const sessionId = generateSessionId();

    console.log("🤖 Calling AI service for skill analysis...");

    const formData = new FormData();
    formData.append('resume_file', resume.buffer, {
      filename: resume.originalname,
      contentType: resume.mimetype
    });
    formData.append('jd_file', jd.buffer, {
      filename: jd.originalname,
      contentType: jd.mimetype
    });

    // Call NEW AI service endpoint (analyze-skills only)
    const aiResponse = await axios.post('http://localhost:8000/analyze-skills', formData, {
      headers: formData.getHeaders(),
      timeout: 120000
    });

    console.log("✅ AI service responded with skill analysis");

    // Extract analysis data (NO optimized resume yet!)
    const missingSkills = aiResponse.data.missing_skills || [];
    const improvementTips = aiResponse.data.improvement_tips || [];
    const beforeMissingChunks = aiResponse.data.before_missing_chunks || [];
    const originalResumeText = aiResponse.data.original_resume_text || '';

    console.log(`📊 Analysis results:`);
    console.log(`- Missing Skills: ${missingSkills.length}`);
    console.log(`- Improvement Tips: ${improvementTips.length}`);
    console.log(`- Before Missing Chunks: ${beforeMissingChunks.length}`);
    console.log(`- Original Resume: ${originalResumeText.length} chars`);



    // Save session data for later optimization
    saveSession(sessionId, {
      resumeBuffer: resume.buffer,
      resumeFilename: resume.originalname,
      resumeMimetype: resume.mimetype,
      jdBuffer: jd.buffer,
      jdFilename: jd.originalname,
      jdMimetype: jd.mimetype,
      originalResumeText: originalResumeText,
      analysisData: {
        missingSkills,
        improvementTips,
        beforeMissingChunks
      }
    });

    // Return ONLY analysis data (no optimized resume!)
    res.json({
      success: true,
      sessionId: sessionId,  // ← Client needs this for next step
      analysis: {
        missingSkillsCount: missingSkills.length,
        improvementTipsCount: improvementTips.length,
        
        // Skills for user to select
        missingSkills: missingSkills,
        improvementTips: improvementTips,

        originalResumeText: originalResumeText,
        
        // Metadata
        analysisDate: new Date(),
        resumeFileName: resume.originalname,
        jdFileName: jd.originalname,
        
        // Debug info
        debug: {
          beforeChunks: beforeMissingChunks.length,
          sessionId: sessionId
        }
      }
    });

  } catch (error) {
    console.error("❌ Analyze-initial error:", error.message);
    
    // Check if it's an axios error (AI service not responding)
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        msg: "AI service unavailable", 
        details: "Make sure the AI service is running on http://localhost:8000",
        hint: "Run: cd ai_services4/resume-analyzer && uvicorn app:app --reload"
      });
    }
    
    res.status(500).json({ 
      msg: "Analysis failed", 
      details: error.message,
      hint: "Check backend and AI service logs for details"
    });
  }
});

// ============================================
// 🆕 GENERATE OPTIMIZED - Create resume with selected skills
// ============================================
router.post("/generate-optimized", auth, async (req, res) => {
  try {
    console.log("🎯 Generate-optimized endpoint called!");
    
    const { sessionId, selectedSkills } = req.body;
    
    // Validate input
    if (!sessionId) {
      return res.status(400).json({ msg: "Session ID required" });
    }
    
    if (!selectedSkills || !Array.isArray(selectedSkills)) {
      return res.status(400).json({ msg: "selectedSkills must be an array" });
    }

    console.log(`📂 Session ID: ${sessionId}`);
    console.log(`✅ Selected Skills (${selectedSkills.length}):`, selectedSkills);

    // Retrieve session data
    const session = getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ 
        msg: "Session not found or expired",
        hint: "Please re-upload your files and analyze again"
      });
    }

    console.log("✅ Session retrieved successfully");
    console.log(`📄 Resume: ${session.resumeFilename}`);
    console.log(`📄 JD: ${session.jdFilename}`);

    // Prepare form data for AI service
    const formData = new FormData();
    formData.append('resume_file', session.resumeBuffer, {
      filename: session.resumeFilename,
      contentType: session.resumeMimetype
    });
    formData.append('jd_file', session.jdBuffer, {
      filename: session.jdFilename,
      contentType: session.jdMimetype
    });
    
    // Send selected skills as JSON string
    formData.append('selected_skills', JSON.stringify(selectedSkills));

    console.log("🤖 Calling AI service for optimization...");

    // Call NEW AI service endpoint (optimize with selected skills)
    const aiResponse = await axios.post('http://localhost:8000/optimize-with-skills', formData, {
      headers: formData.getHeaders(),
      timeout: 120000
    });

    console.log("✅ AI service responded with optimized resume");

    // Extract optimization results
    const optimizedResume = aiResponse.data.optimized_resume_text || '';
    const afterMissingChunks = aiResponse.data.after_missing_chunks || [];
    const addedSkills = aiResponse.data.added_skills || selectedSkills;

    console.log(`📊 Optimization results:`);
    console.log(`- Optimized Resume: ${optimizedResume.length} characters`);
    console.log(`- After Missing Chunks: ${afterMissingChunks.length}`);
    console.log(`- Skills Added: ${addedSkills.length}`);

    // Return optimized resume
    res.json({
      success: true,
      sessionId: sessionId,
      optimization: {
        optimizedResume: optimizedResume,
        addedSkills: addedSkills,
        selectedSkillsCount: selectedSkills.length,
        
        // Metadata
        optimizationDate: new Date(),
        resumeFileName: session.resumeFilename,
        jdFileName: session.jdFilename,
        
        // Metrics (before vs after)
        metrics: {
          beforeMissingChunks: session.analysisData.beforeMissingChunks.length,
          afterMissingChunks: afterMissingChunks.length,
          improvement: session.analysisData.beforeMissingChunks.length - afterMissingChunks.length
        },
        
        // Debug info
        debug: {
          sessionId: sessionId,
          afterChunks: afterMissingChunks.length
        }
      }
    });

    console.log("✅ Optimization response sent successfully");

  } catch (error) {
    console.error("❌ Generate-optimized error:", error.message);
    
    // Check if it's an axios error (AI service not responding)
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        msg: "AI service unavailable", 
        details: "Make sure the AI service is running on http://localhost:8000",
        hint: "Run: cd ai_services4/resume-analyzer && uvicorn app:app --reload"
      });
    }
    
    res.status(500).json({ 
      msg: "Optimization failed", 
      details: error.message,
      hint: "Check backend and AI service logs for details"
    });
  }
});

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

    // Extract actual data without artificial scoring
    const missingSkills = aiResponse.data.missing_skills || [];
    const improvementTips = aiResponse.data.improvement_tips || [];
    const optimizedResume = aiResponse.data.optimized_resume_text || '';

    console.log(`📊 Raw analysis results:`);
    console.log(`- Missing Skills: ${missingSkills.length}`);
    console.log(`- Improvement Tips: ${improvementTips.length}`);
    console.log(`- Optimized Resume: ${optimizedResume.length} characters`);

    // Return simple, honest response
    res.json({
      success: true,
      analysis: {
        // Raw counts
        missingSkillsCount: missingSkills.length,
        improvementTipsCount: improvementTips.length,
        
        // Actual data
        missingSkills: missingSkills,
        improvementTips: improvementTips,
        optimizedResume: optimizedResume,
        
        // Metadata
        analysisDate: new Date(),
        resumeFileName: resume.originalname,
        jdFileName: jd.originalname,
        
        // Raw AI response for debugging (optional)
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

router.post("/download-pdf", auth, async (req, res) => {
  try {
    const { sessionId, selectedSkills } = req.body;
    
    console.log("📥 PDF download requested");
    
    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ msg: "Session expired or not found" });
    }
    
    // Prepare FormData
    const formData = new FormData();
    formData.append('resume_file', session.resumeBuffer, {
      filename: session.resumeFilename,
      contentType: session.resumeMimetype
    });
    formData.append('jd_file', session.jdBuffer, {
      filename: session.jdFilename,
      contentType: session.jdMimetype
    });
    formData.append('selected_skills', JSON.stringify(selectedSkills));
    
    console.log("🤖 Calling AI service for PDF generation...");
    
    // Call Python PDF endpoint
    const response = await axios.post(
      'http://localhost:8000/optimize-with-skills-pdf',
      formData,
      {
        headers: formData.getHeaders(),
        responseType: 'arraybuffer', // CRITICAL: Get binary PDF data
        timeout: 120000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    
    console.log(`✅ PDF received: ${response.data.length} bytes`);
    
    // Send PDF to frontend
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=optimized_resume.pdf',
      'Content-Length': response.data.length
    });
    
    res.send(Buffer.from(response.data));
    
  } catch (error) {
    console.error("❌ PDF download error:", error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        msg: "AI service unavailable",
        hint: "Ensure Python service is running on http://localhost:8000"
      });
    }
    
    res.status(500).json({ 
      msg: "PDF generation failed", 
      error: error.message 
    });
  }
});

// ============================================
// 🆕 DOWNLOAD LATEX PDF
// ============================================
// backend/src/routes/resume.js

// Add this route AFTER the existing routes

// 🆕 LATEX PDF DOWNLOAD
router.post("/download-latex-pdf", auth, async (req, res) => {
  try {
    const { sessionId, selectedSkills } = req.body;
    
    console.log("📥 LaTeX PDF download requested");
    
    const session = getSession(sessionId);
    if (!session) {
      return res.status(404).json({ msg: "Session expired or not found" });
    }
    
    // Prepare FormData
    const formData = new FormData();
    formData.append('resume_file', session.resumeBuffer, {
      filename: session.resumeFilename,
      contentType: session.resumeMimetype
    });
    formData.append('jd_file', session.jdBuffer, {
      filename: session.jdFilename,
      contentType: session.jdMimetype
    });
    formData.append('selected_skills', JSON.stringify(selectedSkills));
    
    console.log("🤖 Calling AI service for LaTeX PDF generation...");
    
    // Call Python LaTeX PDF endpoint
    const response = await axios.post(
      'http://localhost:8000/optimize-with-skills-latex-pdf',
      formData,
      {
        headers: formData.getHeaders(),
        responseType: 'arraybuffer',
        timeout: 120000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );
    
    console.log(`✅ LaTeX PDF received: ${response.data.length} bytes`);
    
    // Send PDF to frontend
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=optimized_resume_latex.pdf',
      'Content-Length': response.data.length
    });
    
    res.send(Buffer.from(response.data));
    
  } catch (error) {
    console.error("❌ LaTeX PDF download error:", error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        msg: "AI service unavailable",
        hint: "Ensure Python service is running on http://localhost:8000"
      });
    }
    
    res.status(500).json({ 
      msg: "LaTeX PDF generation failed", 
      error: error.message 
    });
  }
});

module.exports = router;