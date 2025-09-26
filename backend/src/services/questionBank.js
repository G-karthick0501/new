// backend/src/services/questionBank.js
const QUESTION_BANK = {
  technical: [
    "Explain the difference between let, const, and var in JavaScript.",
    "What is the time complexity of binary search?", 
    "How would you implement a REST API for a todo application?",
    "Explain the concept of closure in programming.",
    "What are the advantages of using a database index?",
    // ADD MORE TECHNICAL QUESTIONS (to support up to 10)
    "Describe the differences between SQL and NoSQL databases.",
    "How would you optimize a slow-running query?",
    "Explain the concept of microservices architecture.",
    "What are the principles of object-oriented programming?",
    "How do you handle error handling in asynchronous operations?"
  ],
  behavioral: [
    "Tell me about a time you faced a challenging problem at work.",
    "Describe a situation where you had to work with a difficult team member.",
    "Give an example of a time you had to learn something new quickly.", 
    "Tell me about a time you made a mistake and how you handled it.",
    "Describe a project you're particularly proud of.",
    // ADD MORE BEHAVIORAL QUESTIONS (to support up to 10)
    "Tell me about a time you had to meet a tight deadline.",
    "Describe a situation where you had to convince someone to change their mind.",
    "Give an example of when you went above and beyond for a customer or colleague.",
    "Tell me about a time you had to work with limited resources.",
    "Describe a situation where you had to adapt to a significant change."
  ]
};

function getQuestions(type, count = 5) {
  const questions = QUESTION_BANK[type] || [];
  
  // ✅ ENHANCEMENT: Support user-defined count with validation
  const validCounts = [3, 5, 7, 10];
  const requestedCount = validCounts.includes(count) ? count : 5;
  const actualCount = Math.min(requestedCount, questions.length);
  
  // ✅ ENHANCEMENT: Add debug info (optional)
  console.log(`📋 Generating ${actualCount} ${type} questions (requested: ${count})`);
  
  return questions.slice(0, actualCount).map((q, index) => ({
    id: index + 1,
    text: q,
    category: type
  }));
}


function validateQuestionRequest(type, count) {
  const validTypes = ['technical', 'behavioral'];
  const validCounts = [3, 5, 7, 10];
  
  const errors = [];
  
  if (!validTypes.includes(type)) {
    errors.push(`Invalid interview type: ${type}. Must be 'technical' or 'behavioral'`);
  }
  
  if (!validCounts.includes(count)) {
    errors.push(`Invalid question count: ${count}. Must be 3, 5, 7, or 10`);
  }
  
  if (type && QUESTION_BANK[type] && count > QUESTION_BANK[type].length) {
    errors.push(`Not enough ${type} questions available. Max: ${QUESTION_BANK[type].length}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = { getQuestions,validateQuestionRequest };