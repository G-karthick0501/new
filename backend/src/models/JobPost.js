const mongoose = require("mongoose");

const jobPostSchema = new mongoose.Schema({
  // ... your existing fields ...
  title: { type: String, required: true },
  description: { type: String, required: true },
  requirements: { type: String },
  skills: [String],
  location: { type: String },
  salary: { type: String },
  deadline: { type: Date },
  jdFileName: { type: String },
  jdFileBuffer: { type: String },
  hrId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'closed', 'draft'], default: 'active' },
  
  // ============================================
  // 🆕 ADD THESE NEW FIELDS
  // ============================================
  filteredJdHash: {
    type: String,
    default: null
  },
  jdPreprocessedAt: {
    type: Date,
    default: null
  },
  jdFilteringStage: {
    type: String,
    enum: ['not_processed', 'stage1', 'stage2', 'stage3_needed'],
    default: 'not_processed'
  },
  jdPreprocessingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  }
  
}, { timestamps: true });

module.exports = mongoose.model("JobPost", jobPostSchema);