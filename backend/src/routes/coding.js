// backend/src/routes/coding.js
const express = require("express");
const auth = require("../middleware/auth");
const judge0Service = require("../services/judge0Service");
const Submission = require("../models/Submission");

const router = express.Router();

// Submit code for execution
router.post("/submit", auth, async (req, res) => {
  try {
    const { sourceCode, languageId, stdin } = req.body;
    
    if (!sourceCode || !languageId) {
      return res.status(400).json({ msg: "Source code and language ID required" });
    }

    // Submit to Judge0
    const judge0Response = await judge0Service.submitCode(sourceCode, languageId, stdin);
    
    // Save submission to database
    const submission = await Submission.create({
      userId: req.user.uid,
      sourceCode,
      languageId,
      judge0Token: judge0Response.token
    });

    res.json({ token: judge0Response.token, submissionId: submission._id });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ msg: "Submission failed" });
  }
});

// Get execution results
router.get("/submission/:token", auth, async (req, res) => {
  try {
    const { token } = req.params;
    
    // Get results from Judge0
    const results = await judge0Service.getSubmission(token);
    
    // Update database with results
    await Submission.findOneAndUpdate(
      { judge0Token: token },
      { 
        status: results.status.description,
        output: results.stdout || results.stderr || results.compile_output,
        executionTime: results.time,
        memory: results.memory
      }
    );

    res.json(results);
  } catch (error) {
    console.error('Results fetch error:', error);
    res.status(500).json({ msg: "Failed to fetch results" });
  }
});

module.exports = router;