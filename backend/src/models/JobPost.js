const mongoose = require("mongoose");

const jobPostSchema = new mongoose.Schema({
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
  status: { type: String, enum: ['active', 'closed', 'draft'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model("JobPost", jobPostSchema);