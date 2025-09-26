
const mongoose = require("mongoose");

const interviewSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  interviewType: { type: String, enum: ['technical', 'behavioral'], required: true },
  
  // ✅ ENHANCEMENT: Add questionCount tracking
  questionCount: { type: Number, default: 5 },
  
  // ✅ ENHANCEMENT: Enhanced questions array with AI analysis
  questions: [{
    questionText: String,
    questionId: Number,
    category: String,
    userResponse: String,
    timeSpent: Number, // seconds
    
    // ✅ NEW: AI analysis for each question
    analysis: {
      objective: {
        word_count: Number,
        sentence_count: Number,
        avg_sentence_length: Number,
        lexical_diversity: Number,
        pos_diversity: Number,
        syntactic_complexity: Number
      },
      semantic: {
        relevance_score: Number,
        topic_coherence: Number
      },
      llm_feedback: {
        strengths: [String],
        weaknesses: [String], 
        improvement_tips: [String]
      }
    }
  }],
  
  // ✅ KEEP: Basic scoring (for backward compatibility)
  overallScore: { type: Number, default: 0 },
  feedback: [String],
  
  // ✅ NEW: AI-powered overall analysis
  overallAnalysis: {
    strengths: [String],
    weaknesses: [String],
    improvement_tips: [String],
    interview_coherence: Number,
    recommendation: String
  },
  
  // ✅ NEW: AI service metadata
  aiAnalysis: {
    processed: { type: Boolean, default: false },
    processingTime: Number, // milliseconds
    aiServiceVersion: String,
    processedAt: Date,
    errorMessage: String // if AI analysis failed
  },
  
  status: { type: String, enum: ['in_progress', 'completed', 'ai_processing'], default: 'in_progress' },
  completedAt: Date
}, { timestamps: true });

// ✅ NEW: Add helper methods
interviewSessionSchema.methods.hasAIAnalysis = function() {
  return this.aiAnalysis && this.aiAnalysis.processed;
};

interviewSessionSchema.methods.getQuestionsWithAnalysis = function() {
  return this.questions.filter(q => q.analysis && Object.keys(q.analysis).length > 0);
};

interviewSessionSchema.methods.getAnalysisSummary = function() {
  const totalQuestions = this.questions.length;
  const answeredQuestions = this.questions.filter(q => q.userResponse && q.userResponse.trim().length > 0).length;
  const analyzedQuestions = this.getQuestionsWithAnalysis().length;
  
  return {
    totalQuestions,
    answeredQuestions, 
    analyzedQuestions,
    completionRate: totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0,
    analysisRate: totalQuestions > 0 ? (analyzedQuestions / totalQuestions) * 100 : 0,
    hasOverallAnalysis: !!(this.overallAnalysis && Object.keys(this.overallAnalysis).length > 0)
  };
};

module.exports = mongoose.model("InterviewSession", interviewSessionSchema);