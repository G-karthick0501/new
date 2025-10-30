// backend/src/models/Submission.js
const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sourceCode: { type: String, required: true },
  languageId: { type: Number, required: true },
  judge0Token: { type: String, required: true },
  status: { type: String, default: 'pending' },
  output: { type: String },
  executionTime: { type: Number },
  memory: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model("Submission", submissionSchema);