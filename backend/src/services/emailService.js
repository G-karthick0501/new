// backend/src/services/emailService.js
const nodemailer = require("nodemailer");

// --- Enhanced transporter configuration ---
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  connectionTimeout: 20000,  // 20 seconds
  greetingTimeout: 20000,    // 20 seconds
  socketTimeout: 30000       // 30 seconds
});

// --- Helper: retry logic on transient failures ---
async function sendEmailWithRetry(mailOptions, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${mailOptions.to} (attempt ${attempt})`);
      return true;
    } catch (error) {
      console.warn(`❌ Email attempt ${attempt} failed: ${error.code || error.message}`);
      if (attempt < retries && error.code === 'ETIMEDOUT') {
        console.log('⏳ Retrying in 3 seconds...');
        await new Promise(r => setTimeout(r, 3000));
      } else {
        console.error('🚫 Giving up after failed attempts.');
        return false;
      }
    }
  }
}

// --- Wrapper for notification service ---
async function sendEmail({ to, subject, text, html }) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html
  };
  return await sendEmailWithRetry(mailOptions);
}

module.exports = { sendEmail };
