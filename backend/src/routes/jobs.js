const express = require("express");
const auth = require("../middleware/auth");
const JobPost = require("../models/JobPost");
const multer = require("multer");
const axios = require("axios"); // 🆕 ADD THIS
const FormData = require("form-data"); // 🆕 ADD THIS
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// 🆕 AI Service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// Create job (HR only) with JD file + preprocessing
router.post("/", auth, upload.single('jdFile'), async (req, res) => {
  try {
    if (req.user.role !== 'hr') {
      return res.status(403).json({ msg: "Only HR can create jobs" });
    }
    
    const jobData = {
      ...req.body,
      hrId: req.user.uid
    };
    
    // If JD file uploaded, save filename
    if (req.file) {
      jobData.jdFileName = req.file.originalname;
      jobData.jdFileBuffer = req.file.buffer.toString('base64');
    }
    
    // Create job first
    const job = await JobPost.create(jobData);
    
    // 🆕 PREPROCESS JD IF FILE EXISTS
    if (req.file) {
      console.log(`🎯 Preprocessing JD for job ${job._id}`);
      
      // Update status to processing
      job.jdPreprocessingStatus = 'processing';
      await job.save();
      
      // Call Python preprocessing service in background
      preprocessJdInBackground(job._id, req.file);
    }
    
    res.status(201).json(job);
    
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({ msg: "Failed to create job" });
  }
});

// 🆕 BACKGROUND PREPROCESSING FUNCTION
async function preprocessJdInBackground(jobId, file) {
  try {
    console.log(`📤 Sending JD to preprocessing service for job ${jobId}`);
    
    // Create form data with the file
    const formData = new FormData();
    formData.append('jd_file', Buffer.from(file.buffer), {
      filename: file.originalname,
      contentType: file.mimetype
    });
    
    // Call Python service
    const response = await axios.post(
      `${AI_SERVICE_URL}/preprocess-jd`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000 // 30 second timeout
      }
    );
    
    console.log(`✅ Preprocessing complete for job ${jobId}`);
    console.log('Response:', response.data);
    
    // Update job with preprocessing results
    if (response.data.success) {
      await JobPost.findByIdAndUpdate(jobId, {
        filteredJdHash: response.data.jd_hash,
        jdPreprocessedAt: new Date(),
        jdFilteringStage: response.data.stage_used,
        jdPreprocessingStatus: 'completed'
      });
      console.log(`💾 Updated job ${jobId} with hash: ${response.data.jd_hash}`);
    } else {
      throw new Error(response.data.error || 'Preprocessing failed');
    }
    
  } catch (error) {
    console.error(`❌ Preprocessing failed for job ${jobId}:`, error.message);
    
    // Update job status to failed
    await JobPost.findByIdAndUpdate(jobId, {
      jdPreprocessingStatus: 'failed'
    });
  }
}

// Download JD file
router.get("/:id/download-jd", async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id);
    if (!job || !job.jdFileBuffer) {
      return res.status(404).json({ msg: "File not found" });
    }
    
    const buffer = Buffer.from(job.jdFileBuffer, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${job.jdFileName}"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ msg: "Download failed" });
  }
});

// Get all jobs
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : { status: 'active' };
    
    const jobs = await JobPost.find(filter)
      .populate('hrId', 'name company')
      .sort({ createdAt: -1 });
    
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ msg: "Failed to fetch jobs" });
  }
});

// Get single job
router.get("/:id", async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id)
      .populate('hrId', 'name email company');
    
    if (!job) return res.status(404).json({ msg: "Job not found" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ msg: "Failed to fetch job" });
  }
});

// 🆕 GET PREPROCESSING STATUS (for polling)
router.get("/:id/preprocessing-status", async (req, res) => {
  try {
    const job = await JobPost.findById(req.params.id)
      .select('jdPreprocessingStatus jdFilteringStage filteredJdHash jdPreprocessedAt');
    
    if (!job) {
      return res.status(404).json({ msg: "Job not found" });
    }
    
    res.json({
      status: job.jdPreprocessingStatus || 'pending',
      stage: job.jdFilteringStage || 'not_processed',
      hash: job.filteredJdHash,
      completedAt: job.jdPreprocessedAt
    });
  } catch (error) {
    res.status(500).json({ msg: "Failed to get status" });
  }
});

// Update job (HR only, own jobs)
router.patch("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== 'hr') {
      return res.status(403).json({ msg: "Only HR can update jobs" });
    }
    
    const job = await JobPost.findOneAndUpdate(
      { _id: req.params.id, hrId: req.user.uid },
      req.body,
      { new: true }
    );
    
    if (!job) return res.status(404).json({ msg: "Job not found" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ msg: "Failed to update job" });
  }
});

// Delete job (HR only, own jobs)
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== 'hr') {
      return res.status(403).json({ msg: "Only HR can delete jobs" });
    }
    
    const job = await JobPost.findOneAndDelete({ 
      _id: req.params.id, 
      hrId: req.user.uid 
    });
    
    if (!job) return res.status(404).json({ msg: "Job not found" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ msg: "Failed to delete job" });
  }
});

module.exports = router;