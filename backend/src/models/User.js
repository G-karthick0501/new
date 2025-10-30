const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: function() { return this.authProvider === 'local'; } },
  role: { 
    type: String, 
    enum: ['candidate', 'hr', 'admin'], 
    default: 'candidate' 
  },
  profile: {
    // For candidates
    resume: { type: String }, // File path or URL
    skills: [String],
    experience: Number,
    // For HR
    company: { type: String },
    department: { type: String }
  },
  googleId: { type: String, unique: true, sparse: true },
  avatar: { type: String },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);