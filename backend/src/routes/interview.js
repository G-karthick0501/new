// backend/src/routes/interview.js - COMPLETE FILE WITH FIXES
const express = require("express");
const auth = require("../middleware/auth");
const InterviewSession = require("../models/InterviewSession");
const { getQuestions,validateQuestionRequest } = require("../services/questionBank");

const axios = require('axios');

const router = express.Router();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const AI_SERVICE_TIMEOUT = 180000; // 180 seconds

// Start new interview
router.post("/start", auth, async (req, res) => {
  try {
    const { interviewType, questionCount = 5 } = req.body;
    
    console.log(`🎤 Starting ${interviewType} interview with ${questionCount} questions for user ${req.user.uid}`);
    
    // ✅ ENHANCEMENT: Validate request parameters
    const validation = validateQuestionRequest(interviewType, questionCount);
    if (!validation.valid) {
      return res.status(400).json({ 
        msg: "Invalid interview parameters", 
        errors: validation.errors 
      });
    }
    
    // ✅ ENHANCEMENT: Get questions with requested count
    const questions = getQuestions(interviewType, questionCount);
    
    if (!questions || questions.length === 0) {
      return res.status(400).json({ 
        msg: `No questions available for interview type: ${interviewType}` 
      });
    }
    
    // ✅ ENHANCEMENT: Create session with question count tracking
    const session = new InterviewSession({
      userId: req.user.uid,
      interviewType,
      questionCount: questions.length,  // ADD THIS FIELD
      questions: questions.map(q => ({ 
        questionText: q.text,
        questionId: q.id,
        category: q.category
      }))
    });
    
    await session.save();
    
    console.log(`✅ Interview session created: ${session._id}`);
    
    res.json({
      sessionId: session._id,
      interviewType,
      questionCount: questions.length,
      questions: questions.map(q => ({ 
        id: q.id, 
        text: q.text, 
        category: q.category 
      }))
    });
    
  } catch (error) {
    console.error("❌ Failed to start interview:", error);
    res.status(500).json({ msg: "Failed to start interview" });
  }
}); 

// Submit response
router.post("/response", auth, async (req, res) => {
  try {
    const { sessionId, questionIndex, response, timeSpent } = req.body;
    
    const session = await InterviewSession.findById(sessionId);
    if (!session) return res.status(404).json({ msg: "Session not found" });
    
    session.questions[questionIndex].userResponse = response;
    session.questions[questionIndex].timeSpent = timeSpent;
    await session.save();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ msg: "Failed to save response" });
  }
});

// Complete interview and get results
async function analyzeInterviewWithAI(questions) {
  try {
    console.log(`🤖 Calling AI service for analysis of ${questions.length} questions`);
    
    // Prepare data for AI service
    const aiRequest = {
      items: questions.map(q => ({
        question_text: q.questionText || '',
        response_text: q.userResponse || ''
      }))
    };
    
    console.log('📤 Sending to AI service:', JSON.stringify(aiRequest, null, 2));
    
    const response = await axios.post(`${AI_SERVICE_URL}/analyze`, aiRequest, {
      timeout: AI_SERVICE_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📥 AI service response received');
    return response.data;
    
  } catch (error) {
    console.error('❌ AI service error:', error.message);
    throw error;
  }
}

// ✅ NEW: Helper function to process AI results
function processAIResults(aiResponse) {
  try {
    const analysisResults = aiResponse.analysis || [];
    
    const processedQuestions = [];
    const overallStrengths = [];
    const overallWeaknesses = [];
    const overallTips = [];
    
    // Process individual question analysis
    analysisResults.forEach((result, index) => {
      const questionAnalysis = {
        objective: result.objective || {},
        semantic: result.semantic || {},
        llm_feedback: result.llm_feedback || {
          strengths: [],
          weaknesses: [],
          improvement_tips: []
        }
      };
      
      processedQuestions.push(questionAnalysis);
      
      // Collect for overall analysis
      if (result.llm_feedback) {
        overallStrengths.push(...(result.llm_feedback.strengths || []));
        overallWeaknesses.push(...(result.llm_feedback.weaknesses || []));
        overallTips.push(...(result.llm_feedback.improvement_tips || []));
      }
    });
    
    // Create overall analysis
    const overallAnalysis = {
      strengths: [...new Set(overallStrengths)].slice(0, 5), // Top 5 unique strengths
      weaknesses: [...new Set(overallWeaknesses)].slice(0, 5), // Top 5 unique weaknesses  
      improvement_tips: [...new Set(overallTips)].slice(0, 7), // Top 7 unique tips
      interview_coherence: 0.8, // Default value, could be enhanced later
      recommendation: generateOverallRecommendation(overallStrengths, overallWeaknesses)
    };
    
    return {
      questionsAnalysis: processedQuestions,
      overallAnalysis
    };
    
  } catch (error) {
    console.error('❌ Error processing AI results:', error);
    throw error;
  }
}

// ✅ NEW: Helper function to generate overall recommendation
function generateOverallRecommendation(strengths, weaknesses) {
  const strengthCount = strengths.length;
  const weaknessCount = weaknesses.length;
  
  if (strengthCount > weaknessCount * 2) {
    return "Strong interview performance with clear communication and good examples. Ready for similar roles.";
  } else if (strengthCount > weaknessCount) {
    return "Good interview performance with some areas for improvement. Practice recommended examples for better results.";
  } else if (weaknessCount > strengthCount) {
    return "Interview shows potential but needs focused improvement on communication and example quality.";
  } else {
    return "Balanced interview performance. Focus on strengthening examples and addressing identified areas.";
  }
}

// ✅ ENHANCED: /complete route with AI integration
router.post("/complete", auth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    console.log(`🏁 Completing interview session: ${sessionId}`);
    
    const session = await InterviewSession.findById(sessionId);
    if (!session) return res.status(404).json({ msg: "Session not found" });
    
    // Validate session has responses
    const answeredQuestions = session.questions.filter(q => q.userResponse && q.userResponse.trim().length > 0);
    if (answeredQuestions.length === 0) {
      return res.status(400).json({ msg: "No responses found to analyze" });
    }
    
    console.log(`📊 Analyzing ${answeredQuestions.length} answered questions`);
    
    // ✅ ENHANCEMENT: Update status to processing
    session.status = 'ai_processing';
    await session.save();
    
    let aiAnalysisResults = null;
    let processingTime = 0;
    const startTime = Date.now();
    
    try {
      // ✅ ENHANCEMENT: Call AI service
      console.log('🤖 Starting AI analysis...');
      const aiResponse = await analyzeInterviewWithAI(answeredQuestions);
      processingTime = Date.now() - startTime;
      
      // ✅ ENHANCEMENT: Process AI results
      aiAnalysisResults = processAIResults(aiResponse);
      console.log(`✅ AI analysis completed in ${processingTime}ms`);
      
      // ✅ ENHANCEMENT: Update session with AI results
      session.questions.forEach((question, index) => {
        if (question.userResponse && aiAnalysisResults.questionsAnalysis[index]) {
          question.analysis = aiAnalysisResults.questionsAnalysis[index];
        }
      });
      
      session.overallAnalysis = aiAnalysisResults.overallAnalysis;
      session.aiAnalysis = {
        processed: true,
        processingTime,
        aiServiceVersion: '1.0.0',
        processedAt: new Date()
      };
      
    } catch (aiError) {
      console.error('❌ AI analysis failed, falling back to basic scoring:', aiError.message);
      
      // ✅ FALLBACK: Basic scoring when AI fails
      const score = (answeredQuestions.length / session.questions.length) * 100;
      const basicFeedback = [];
      if (score >= 80) basicFeedback.push("Great job! You answered most questions thoroughly.");
      if (score < 80) basicFeedback.push("Try to provide more detailed responses.");
      basicFeedback.push("Keep practicing to improve your interview skills.");
      
      session.feedback = basicFeedback;
      session.overallScore = score;
      session.aiAnalysis = {
        processed: false,
        processingTime: Date.now() - startTime,
        errorMessage: aiError.message,
        processedAt: new Date()
      };
    }
    
    // ✅ FINAL: Update session status
    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();
    
    console.log('✅ Interview session completed successfully');
    
    // ✅ FIXED: Return data in format frontend expects
    if (aiAnalysisResults) {
      // Return AI-powered results - FIXED FORMAT
      const detailedAnalysis = answeredQuestions.map((q, index) => ({
        questionText: q.questionText,
        userResponse: q.userResponse,
        timeSpent: q.timeSpent,
        objective: aiAnalysisResults.questionsAnalysis[index]?.objective || {},
        semantic: aiAnalysisResults.questionsAnalysis[index]?.semantic || {},
        llmFeedback: aiAnalysisResults.questionsAnalysis[index]?.llm_feedback || {
          strengths: [],
          weaknesses: [],
          improvement_tips: []
        }
      }));

      // Calculate a score based on AI analysis quality
      const aiScore = Math.min(100, Math.max(60, 
        (aiAnalysisResults.overallAnalysis.strengths.length * 15) + 
        (answeredQuestions.length / session.questions.length * 40)
      ));

      res.json({
        // Basic fields frontend expects
        score: Math.round(aiScore),
        feedback: aiAnalysisResults.overallAnalysis.improvement_tips.slice(0, 3),
        questionsAnswered: answeredQuestions.length,
        totalQuestions: session.questions.length,
        
        // AI analysis fields
        detailedAnalysis: detailedAnalysis,
        hasAiAnalysis: true,
        
        // Additional metadata
        analysisType: 'ai_powered',
        overallAnalysis: aiAnalysisResults.overallAnalysis,
        completedAt: session.completedAt
      });
    } else {
      // Return basic results (fallback)
      res.json({
        success: true,
        analysisType: 'basic_fallback',
        score: session.overallScore || 0,
        feedback: session.feedback || ["Please try again to get detailed feedback"],
        questionsAnswered: answeredQuestions.length,
        totalQuestions: session.questions.length,
        hasAiAnalysis: false,
        detailedAnalysis: [],
        error: session.aiAnalysis?.errorMessage
      });
    }
    
  } catch (error) {
    console.error("❌ Failed to complete interview:", error);
    res.status(500).json({ msg: "Failed to complete interview" });
  }
});
  
module.exports = router;