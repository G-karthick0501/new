const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPost', required: true },
  resumeFile: { type: String },
  resumeFileName: { type: String },
  resumeFileBuffer: { type: String },
  coverLetter: { type: String },
  matchScore: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'test_sent'],
    default: 'pending' 
  }
}, { timestamps: true });

module.exports = mongoose.model("Application", applicationSchema);

