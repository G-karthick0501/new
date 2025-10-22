// backend/src/services/notificationService.js
const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendEmail } = require("./emailService");

/**
 * Core notification creation function
 */
async function createNotification(userId, { type, title, message, link, sendEmailNotification = true }) {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      link
    });

    if (sendEmailNotification) {
      const user = await User.findById(userId);
      if (user && user.email) {
        const emailSent = await sendEmail({
          to: user.email,
          subject: title,
          text: message,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">${title}</h2>
              <p style="font-size: 16px; line-height: 1.5;">${message}</p>
              ${link ? `<a href="${link}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Details</a>` : ''}
            </div>
          `
        });
        notification.emailSent = emailSent;
        await notification.save();
      }
    }

    return notification;
  } catch (error) {
    console.error("❌ Notification creation failed:", error.message);
    throw error;
  }
}

/**
 * Application-related notifications
 */
async function notifyApplicationStatusChange(candidateId, jobTitle, oldStatus, newStatus) {
  const statusMessages = {
    reviewed: {
      title: '📋 Application Reviewed',
      message: `Your application for "${jobTitle}" has been reviewed by the HR team.`,
      type: 'info'
    },
    shortlisted: {
      title: '🎉 You\'re Shortlisted!',
      message: `Congratulations! You've been shortlisted for "${jobTitle}". The HR team will contact you soon.`,
      type: 'success'
    },
    test_sent: {
      title: '💻 Coding Test Assigned',
      message: `A coding test has been assigned for "${jobTitle}". Please complete it before the deadline.`,
      type: 'info'
    },
    rejected: {
      title: '😔 Application Update',
      message: `Thank you for your interest in "${jobTitle}". Unfortunately, we're moving forward with other candidates.`,
      type: 'warning'
    }
  };

  const statusInfo = statusMessages[newStatus];
  if (statusInfo) {
    await createNotification(candidateId, {
      ...statusInfo,
      link: '/candidate-dashboard?tab=applications'
    });
  }
}

async function notifyNewApplication(hrId, candidateName, jobTitle, applicationId) {
  await createNotification(hrId, {
    type: 'info',
    title: '📨 New Application Received',
    message: `${candidateName} has applied for "${jobTitle}". Review their application now.`,
    link: `/hr-dashboard?tab=applications&highlight=${applicationId}`
  });
}

/**
 * Job-related notifications
 */
async function notifyNewJobPosted(candidateIds, jobTitle, jobId) {
  const notifications = candidateIds.map(candidateId => 
    createNotification(candidateId, {
      type: 'info',
      title: '🆕 New Job Opportunity',
      message: `A new job "${jobTitle}" matching your skills has been posted. Apply now!`,
      link: `/jobs/${jobId}`
    })
  );
  await Promise.all(notifications);
}

async function notifyJobDeadlineApproaching(candidateId, jobTitle, daysLeft, jobId) {
  await createNotification(candidateId, {
    type: 'warning',
    title: '⏰ Application Deadline Approaching',
    message: `Only ${daysLeft} days left to apply for "${jobTitle}". Don't miss out!`,
    link: `/jobs/${jobId}`
  });
}

async function notifyJobClosed(candidateId, jobTitle) {
  await createNotification(candidateId, {
    type: 'info',
    title: '🔒 Job Position Filled',
    message: `The position for "${jobTitle}" has been closed. Check out other opportunities!`,
    link: '/jobs',
    sendEmailNotification: false
  });
}

/**
 * Profile-related notifications
 */
async function notifyProfileIncomplete(candidateId, missingFields) {
  const fieldsList = missingFields.join(', ');
  await createNotification(candidateId, {
    type: 'info',
    title: '👤 Complete Your Profile',
    message: `Your profile is incomplete. Add ${fieldsList} to increase your chances of getting hired!`,
    link: '/profile'
  });
}

async function notifyProfileMilestone(candidateId, milestone) {
  const messages = {
    '50': 'You\'re halfway there! Complete your profile to unlock better job matches.',
    '75': 'Almost done! Just a few more details to reach 100% profile completion.',
    '100': '🎉 Congratulations! Your profile is 100% complete. You\'re ready to apply for jobs!'
  };

  await createNotification(candidateId, {
    type: milestone === '100' ? 'success' : 'info',
    title: `Profile ${milestone}% Complete`,
    message: messages[milestone],
    link: '/profile'
  });
}

/**
 * Welcome and authentication notifications
 */
async function notifyWelcome(userId, userName, role) {
  const roleMessages = {
    candidate: 'Start by completing your profile and exploring job opportunities!',
    hr: 'You can now post jobs and manage applications from your dashboard.'
  };

  await createNotification(userId, {
    type: 'success',
    title: `👋 Welcome to AI Recruitment Platform, ${userName}!`,
    message: roleMessages[role] || 'Welcome aboard!',
    link: role === 'candidate' ? '/candidate-dashboard' : '/hr-dashboard'
  });
}

async function notifyPasswordChange(userId) {
  await createNotification(userId, {
    type: 'warning',
    title: '🔐 Password Changed',
    message: 'Your password was successfully changed. If you didn\'t make this change, contact support immediately.',
    link: '/profile/security'
  });
}

async function notifyLoginFromNewDevice(userId, deviceInfo) {
  await createNotification(userId, {
    type: 'warning',
    title: '🔔 New Login Detected',
    message: `A login was detected from ${deviceInfo}. If this wasn't you, secure your account immediately.`,
    link: '/profile/security',
    sendEmailNotification: true
  });
}

/**
 * Digest and summary notifications
 */
async function sendWeeklyDigest(userId, stats) {
  await createNotification(userId, {
    type: 'info',
    title: '📊 Your Weekly Summary',
    message: `This week: ${stats.applications || 0} applications, ${stats.profileViews || 0} profile views, ${stats.newJobs || 0} new matching jobs.`,
    link: '/dashboard'
  });
}

async function sendHRDailyDigest(hrId, stats) {
  await createNotification(hrId, {
    type: 'info',
    title: '📈 Daily Recruitment Summary',
    message: `Today: ${stats.newApplications || 0} new applications, ${stats.pendingReviews || 0} pending reviews, ${stats.activeJobs || 0} active jobs.`,
    link: '/hr-dashboard'
  });
}

module.exports = {
  createNotification,
  notifyApplicationStatusChange,
  notifyNewApplication,
  notifyNewJobPosted,
  notifyJobDeadlineApproaching,
  notifyJobClosed,
  notifyProfileIncomplete,
  notifyProfileMilestone,
  notifyWelcome,
  notifyPasswordChange,
  notifyLoginFromNewDevice,
  sendWeeklyDigest,
  sendHRDailyDigest
};