const mongoose = require("mongoose");

const resumeScoreSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cvHash: { type: String, required: true },
  jdHash: { type: String, required: true },
  score: { type: Number, required: true, min: 0, max: 1 },
  missingSkills: [String],
  method: { type: String, default: 'cosine_v0' },
  embeddingModel: { type: String, default: 'all-MiniLM-L6-v2' },
  subscores: {
    semantic: Number,
    keyword: Number
  },
  missingChunksCount: Number,
  totalChunksCount: Number
}, { timestamps: true });

// Index for quick lookups
resumeScoreSchema.index({ cvHash: 1, jdHash: 1 });
resumeScoreSchema.index({ user: 1 });

module.exports = mongoose.model("ResumeScore", resumeScoreSchema);