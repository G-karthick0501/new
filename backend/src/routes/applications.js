const express = require("express");
const auth = require("../middleware/auth");
const Application = require("../models/Application");
const JobPost = require("../models/JobPost");
const { createNotification } = require("../services/notificationService");
const { calculateMatchScore } = require("../services/matchScoreService");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();





// Apply to job with resume upload + MATCH SCORE
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

    const job = await JobPost.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ msg: "Job not found" });
    }

    const appData = {
      candidateId: req.user.uid,
      jobId: req.params.jobId,
      coverLetter: req.body.coverLetter,
      matchScore: 0 // default
    };

    if (req.file) {
      appData.resumeFileName = req.file.originalname;
      appData.resumeFileBuffer = req.file.buffer.toString('base64');
      appData.resumeFile = req.file.originalname;
    }

    // ✅ CREATE APPLICATION FIRST
    const application = await Application.create(appData);

    // ✅ NOW START BACKGROUND SCORE CALCULATION (after creation)
    if (req.file && job.jdFileBuffer) {
      console.log('📊 Calculating match score in background...');
      const resumeBuffer = req.file.buffer;
      const jdBuffer = Buffer.from(job.jdFileBuffer, 'base64');

      calculateMatchScore(req.user.uid, resumeBuffer, jdBuffer)
        .then(({ score, fromCache }) => {
          console.log(`✅ Match Score: ${score}%${fromCache ? ' (cached)' : ''}`);
          Application.findByIdAndUpdate(application._id, { matchScore: score }).catch(console.error);
        })
        .catch(err => {
          console.error('❌ Match score failed:', err.message);
        });
    }

    await createNotification(req.user.uid, {
      type: 'success',
      title: 'Application Submitted',
      message: `Your application has been submitted successfully! Match Score: ${appData.matchScore || 0}%`,
      link: `/candidate-dashboard?tab=jobs`
    });

    res.status(201).json(application);

  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ msg: "Failed to apply" });
  }
});


// Download resume
router.get("/download-resume/:id", auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    
    if (!application || !application.resumeFileBuffer) {
      return res.status(404).json({ msg: "File not found" });
    }
    
    const buffer = Buffer.from(application.resumeFileBuffer, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${application.resumeFileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Download error:', error);
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

// Update application status (HR only) WITH NOTIFICATIONS
router.patch("/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== 'hr') {
      return res.status(403).json({ msg: "Only HR can update status" });
    }

    const { status } = req.body;
    
    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'rejected', 'test_sent'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: "Invalid status value" });
    }

    const application = await Application.findById(req.params.id)
      .populate('candidateId', 'name email')
      .populate('jobId', 'title');

    if (!application) {
      return res.status(404).json({ msg: "Application not found" });
    }

    const oldStatus = application.status;
    application.status = status;
    await application.save();

    if (oldStatus !== status) {
      const notificationConfig = getNotificationConfig(status, application);
      
      await createNotification(application.candidateId._id, {
        type: notificationConfig.type,
        title: notificationConfig.title,
        message: notificationConfig.message,
        link: `/candidate-dashboard?tab=jobs`,
        sendEmailNotification: true
      });

      console.log(`✅ Notification sent to ${application.candidateId.email} for status: ${status}`);
    }

    res.json(application);
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ msg: "Failed to update status" });
  }
});

function getNotificationConfig(status, application) {
  const jobTitle = application.jobId?.title || "the position";
  const candidateName = application.candidateId?.name || "there";

  const configs = {
    'reviewed': {
      type: 'info',
      title: '👀 Application Under Review',
      message: `Hi ${candidateName}! Your application for "${jobTitle}" is now being reviewed by our HR team. We'll update you soon!`
    },
    'shortlisted': {
      type: 'success',
      title: '🎉 Congratulations! You\'ve Been Shortlisted',
      message: `Great news ${candidateName}! You've been shortlisted for "${jobTitle}". Our team will contact you shortly with next steps.`
    },
    'rejected': {
      type: 'warning',
      title: 'Application Status Update',
      message: `Hi ${candidateName}, thank you for your interest in "${jobTitle}". After careful consideration, we've decided to move forward with other candidates. We encourage you to apply for other opportunities!`
    },
    'test_sent': {
      type: 'info',
      title: '📝 Coding Test Assigned',
      message: `Hi ${candidateName}! You've been assigned a coding assessment for "${jobTitle}". Please complete it within the given timeframe. Good luck!`
    },
    'pending': {
      type: 'info',
      title: 'Application Status Updated',
      message: `Your application for "${jobTitle}" status has been updated to pending.`
    }
  };

  return configs[status] || {
    type: 'info',
    title: 'Application Status Updated',
    message: `Your application for "${jobTitle}" has been updated.`
  };
}

// Delete application
router.delete("/:id", auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate('jobId');
    
    if (!application) {
      return res.status(404).json({ msg: "Application not found" });
    }

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