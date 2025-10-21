const express = require("express");
const auth = require("../middleware/auth");
const JobPost = require("../models/JobPost");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Create job (HR only) with JD file
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
    
    const job = await JobPost.create(jobData);
    res.status(201).json(job);
  } catch (error) {
    console.error('Job creation error:', error);
    res.status(500).json({ msg: "Failed to create job" });
  }
});

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