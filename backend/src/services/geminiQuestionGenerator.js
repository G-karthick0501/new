// backend/src/services/geminiQuestionGenerator.js
const geminiService = require('../ai-services/llm/geminiService');

class GeminiQuestionGenerator {
  
  /**
   * Generate interview questions based on resume and optional JD
   * @param {string} resumeText - Resume content
   * @param {string} jdText - Job description (optional)
   * @param {string} interviewType - 'technical' or 'behavioral'
   * @param {number} questionCount - Number of questions (3, 5, 7, or 10)
   */
  async generateQuestions(resumeText, jdText, interviewType, questionCount) {
    try {
      console.log(`🤖 Generating ${questionCount} ${interviewType} questions`);
      console.log(`   Resume: ${resumeText.length} chars, JD: ${jdText?.length || 0} chars`);

      const prompt = this._buildPrompt(resumeText, jdText, interviewType, questionCount);
      
      console.log('📤 Calling Gemini...');
      const response = await geminiService.generateContent(prompt);
      
      const questions = this._parseResponse(response, interviewType);
      
      console.log(`✅ Generated ${questions.length} questions`);
      return questions;

    } catch (error) {
      console.error('❌ Gemini generation failed:', error.message);
      throw error;
    }
  }

  _buildPrompt(resumeText, jdText, interviewType, questionCount) {
    const typeLabel = interviewType === 'technical' 
      ? 'Technical Questions' 
      : 'Behavioral Questions';
    
    const typeGuidance = interviewType === 'technical'
      ? 'Focus on programming, system design, algorithms, and technical skills mentioned in the resume/JD.'
      : 'Focus on past experiences, teamwork, problem-solving, and behavioral competencies using STAR format.';

    let prompt = `Generate exactly ${questionCount} interview questions for a candidate.

Interview Type: ${interviewType.toUpperCase()}

Format strictly:
### ${typeLabel}
1. [Question 1]
2. [Question 2]
...

RESUME:
${resumeText.substring(0, 3000)}
`;

    if (jdText) {
      prompt += `\nJOB DESCRIPTION:
${jdText.substring(0, 2000)}

IMPORTANT: Tailor questions to match BOTH the resume skills AND job requirements.
`;
    } else {
      prompt += `\nIMPORTANT: Tailor questions based on the candidate's resume skills and experience.
`;
    }

    prompt += `\nGUIDELINES:
- ${typeGuidance}
- Questions must be clear, professional, and relevant
- Number each question starting from 1
- Generate EXACTLY ${questionCount} questions, no more, no less
- Do NOT add explanations or extra text outside the format
- Use the exact header: "### ${typeLabel}"`;

    return prompt;
  }

  _parseResponse(responseText, interviewType) {
    const questions = [];
    const lines = responseText.split('\n');
    let inQuestionSection = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Detect section header
      if (trimmed.match(/^###\s*(Technical|Behavioral)\s*Questions?/i)) {
        inQuestionSection = true;
        continue;
      }

      // Parse numbered questions
      if (inQuestionSection) {
        const match = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (match) {
          const questionText = match[2].trim();
          questions.push({
            id: questions.length + 1,
            text: questionText,
            category: interviewType
          });
        }
      }
    }

    if (questions.length === 0) {
      throw new Error('Failed to parse questions from Gemini response');
    }

    return questions;
  }

  // Fallback to hardcoded questions
  getFallbackQuestions(interviewType, count) {
    console.log('⚠️  Using fallback hardcoded questions');
    const { getQuestions } = require('./questionBank');
    return getQuestions(interviewType, count);
  }
}

module.exports = new GeminiQuestionGenerator();
