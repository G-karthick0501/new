const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendEmail } = require("./emailService");

async function createNotification(userId, { type, title, message, link, sendEmailNotification = true }) {
  try {
    // Save to database
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      link
    });

    // Send email if requested
    if (sendEmailNotification) {
      const user = await User.findById(userId);
      if (user && user.email) {
        const emailSent = await sendEmail({
          to: user.email,
          subject: title,
          text: message,
          html: `<h2>${title}</h2><p>${message}</p>${link ? `<a href="${link}">View Details</a>` : ''}`
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

module.exports = { createNotification };