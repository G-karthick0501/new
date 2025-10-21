const express = require("express");
const auth = require("../middleware/auth");
const Application = require("../models/Application");
const JobPost = require("../models/JobPost");
const { createNotification } = require("../services/notificationService");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Apply to job with resume upload
router.post("/:jobId/apply", auth, upload.single('resume'), async (req, res) => {
  try {
    if (req.user.role !== 'candidate') {
      return res.status(403).json({ msg: "Only candidates can apply" });
    }

    const existing = await Application.findOne({
      candidateId: req.user.uid,
      jobId: req.params.jobId
    });
    
    if (existing) {
      return res.status(400).json({ msg: "Already applied to this job" });
    }

    const appData = {
      candidateId: req.user.uid,
      jobId: req.params.jobId,
      coverLetter: req.body.coverLetter
    };

    // Save resume file
    if (req.file) {
      appData.resumeFileName = req.file.originalname;
      appData.resumeFileBuffer = req.file.buffer.toString('base64');
      appData.resumeFile = req.file.originalname;
    }

    const application = await Application.create(appData);

    await createNotification(req.user.uid, {
      type: 'success',
      title: 'Application Submitted',
      message: 'Your application has been submitted successfully!',
      link: `/candidate-dashboard?tab=jobs`
    });

    res.status(201).json(application);
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ msg: "Failed to apply" });
  }
});
// Download resume
// Download resume
router.get("/download-resume/:id", auth, async (req, res) => {
  console.log('📥 Download route hit!');
  console.log('ID:', req.params.id);
  console.log('User:', req.user.uid);
  
  try {
    const application = await Application.findById(req.params.id);
    console.log('Application found:', !!application);
    console.log('Has buffer:', !!application?.resumeFileBuffer);
    
    if (!application || !application.resumeFileBuffer) {
      console.log('❌ File not found');
      return res.status(404).json({ msg: "File not found" });
    }
    
    console.log('✅ Sending file:', application.resumeFileName);
    const buffer = Buffer.from(application.resumeFileBuffer, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${application.resumeFileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({ msg: "Download failed" });
  }
});

// Get applications (role-based)
router.get("/", auth, async (req, res) => {
  try {
    let filter = {};
    
    if (req.user.role === 'candidate') {
      filter.candidateId = req.user.uid;
    } else if (req.user.role === 'hr') {
      // Get applications for HR's jobs
      const hrJobs = await JobPost.find({ hrId: req.user.uid });
      const jobIds = hrJobs.map(j => j._id);
      filter.jobId = { $in: jobIds };
    }

    const applications = await Application.find(filter)
      .populate('candidateId', 'name email')
      .populate('jobId', 'title')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ msg: "Failed to fetch applications" });
  }
});

// Update application status (HR only)
router.patch("/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== 'hr') {
      return res.status(403).json({ msg: "Only HR can update status" });
    }

    const { status } = req.body;
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ msg: "Application not found" });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ msg: "Failed to update status" });
  }
});


// Delete application (Candidate can delete own, HR can delete for their jobs)
router.delete("/:id", auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('jobId');
    
    if (!application) {
      return res.status(404).json({ msg: "Application not found" });
    }

    // Check permissions
    const isOwner = application.candidateId.toString() === req.user.uid.toString();
    const isHR = req.user.role === 'hr' && application.jobId.hrId.toString() === req.user.uid.toString();
    
    if (!isOwner && !isHR) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    await Application.findByIdAndDelete(req.params.id);
    res.json({ success: true, msg: "Application deleted" });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ msg: "Failed to delete" });
  }
});

module.exports = router;