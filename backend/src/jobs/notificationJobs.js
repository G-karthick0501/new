// backend/src/jobs/notificationJobs.js
const cron = require('node-cron');
const User = require('../models/User');
const JobPost = require('../models/JobPost');
const Application = require('../models/Application');
const {
  notifyJobDeadlineApproaching,
  notifyProfileIncomplete,
  sendWeeklyDigest,
  sendHRDailyDigest
} = require('../services/notificationService');

/**
 * Check for jobs with approaching deadlines (runs daily at 9 AM)
 */
function scheduleJobDeadlineReminders() {
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running job deadline reminder check...');
    
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      // Find jobs with deadlines in 3 days
      const jobs = await JobPost.find({
        status: 'active',
        deadline: {
          $gte: now,
          $lte: threeDaysFromNow
        }
      });

      for (const job of jobs) {
        // Find candidates who haven't applied yet
        const appliedCandidates = await Application.find({ jobId: job._id })
          .distinct('candidateId');
        
        // Get all candidates (you can add skill matching here)
        const candidates = await User.find({
          role: 'candidate',
          _id: { $nin: appliedCandidates }
        });

        const daysLeft = Math.ceil((job.deadline - now) / (24 * 60 * 60 * 1000));

        // Notify each candidate
        for (const candidate of candidates) {
          await notifyJobDeadlineApproaching(
            candidate._id,
            job.title,
            daysLeft,
            job._id
          );
        }
      }

      console.log(`✅ Sent deadline reminders for ${jobs.length} jobs`);
    } catch (error) {
      console.error('❌ Job deadline reminder error:', error);
    }
  });
}

/**
 * Check for incomplete profiles and send reminders (runs weekly on Monday at 10 AM)
 */
function scheduleProfileCompletionReminders() {
  cron.schedule('0 10 * * 1', async () => {
    console.log('📝 Running profile completion check...');
    
    try {
      const candidates = await User.find({ role: 'candidate' });

      for (const candidate of candidates) {
        const missingFields = [];
        
        if (!candidate.profile?.resume) missingFields.push('resume');
        if (!candidate.profile?.skills?.length) missingFields.push('skills');
        if (!candidate.profile?.experience) missingFields.push('experience');

        // Only notify if profile is incomplete
        if (missingFields.length > 0) {
          await notifyProfileIncomplete(candidate._id, missingFields);
        }
      }

      console.log('✅ Profile completion reminders sent');
    } catch (error) {
      console.error('❌ Profile completion reminder error:', error);
    }
  });
}

/**
 * Send weekly digest to candidates (runs Sunday at 8 PM)
 */
function scheduleWeeklyDigest() {
  cron.schedule('0 20 * * 0', async () => {
    console.log('📊 Generating weekly digests...');
    
    try {
      const candidates = await User.find({ role: 'candidate' });
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      for (const candidate of candidates) {
        // Calculate stats for the week
        const applications = await Application.countDocuments({
          candidateId: candidate._id,
          createdAt: { $gte: oneWeekAgo }
        });

        const newJobs = await JobPost.countDocuments({
          status: 'active',
          createdAt: { $gte: oneWeekAgo }
        });

        const stats = {
          applications,
          profileViews: 0, // Implement profile view tracking later
          newJobs
        };

        await sendWeeklyDigest(candidate._id, stats);
      }

      console.log('✅ Weekly digests sent');
    } catch (error) {
      console.error('❌ Weekly digest error:', error);
    }
  });
}

/**
 * Send daily digest to HR (runs every day at 9 AM)
 */
function scheduleHRDailyDigest() {
  cron.schedule('0 9 * * *', async () => {
    console.log('📈 Generating HR daily digests...');
    
    try {
      const hrUsers = await User.find({ role: 'hr' });
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      for (const hr of hrUsers) {
        // Get HR's jobs
        const hrJobs = await JobPost.find({ hrId: hr._id });
        const jobIds = hrJobs.map(j => j._id);

        // Calculate stats
        const newApplications = await Application.countDocuments({
          jobId: { $in: jobIds },
          createdAt: { $gte: yesterday }
        });

        const pendingReviews = await Application.countDocuments({
          jobId: { $in: jobIds },
          status: 'pending'
        });

        const activeJobs = await JobPost.countDocuments({
          hrId: hr._id,
          status: 'active'
        });

        const stats = {
          newApplications,
          pendingReviews,
          activeJobs
        };

        await sendHRDailyDigest(hr._id, stats);
      }

      console.log('✅ HR daily digests sent');
    } catch (error) {
      console.error('❌ HR daily digest error:', error);
    }
  });
}

/**
 * Check for profile milestones (runs daily at 11 AM)
 */
function scheduleProfileMilestoneCheck() {
  cron.schedule('0 11 * * *', async () => {
    console.log('🎯 Checking profile milestones...');
    
    try {
      const candidates = await User.find({ role: 'candidate' });
      const { notifyProfileMilestone } = require('../services/notificationService');

      for (const candidate of candidates) {
        let completionScore = 0;
        const totalFields = 4; // name, email, resume, skills, experience

        if (candidate.name) completionScore += 25;
        if (candidate.email) completionScore += 25;
        if (candidate.profile?.resume) completionScore += 25;
        if (candidate.profile?.skills?.length) completionScore += 15;
        if (candidate.profile?.experience) completionScore += 10;

        // Send notifications at milestones
        if (completionScore === 50 || completionScore === 75 || completionScore === 100) {
          await notifyProfileMilestone(candidate._id, completionScore.toString());
        }
      }

      console.log('✅ Profile milestone check completed');
    } catch (error) {
      console.error('❌ Profile milestone check error:', error);
    }
  });
}

/**
 * Initialize all scheduled jobs
 */
function initializeScheduledJobs() {
  console.log('🚀 Initializing scheduled notification jobs...');
  
  scheduleJobDeadlineReminders();
  scheduleProfileCompletionReminders();
  scheduleWeeklyDigest();
  scheduleHRDailyDigest();
  scheduleProfileMilestoneCheck();
  
  console.log('✅ All scheduled jobs initialized');
}

module.exports = { initializeScheduledJobs };

// ===================================================
// INSTALLATION REQUIRED:
// npm install node-cron
// 
// Then add to server.js:
// const { initializeScheduledJobs } = require('./src/jobs/notificationJobs');
// 
// After mongoose.connect, add:
// initializeScheduledJobs();
// ===================================================