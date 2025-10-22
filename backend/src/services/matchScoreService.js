const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');
const ResumeScore = require('../models/ResumeScore');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

function generateHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function calculateMatchScore(userId, resumeBuffer, jdBuffer) {
  try {
    const cvHash = generateHash(resumeBuffer);
    const jdHash = generateHash(jdBuffer);

    const cached = await ResumeScore.findOne({ cvHash, jdHash });
    if (cached) {
      console.log('✅ Using cached score:', Math.round(cached.score * 100) + '%');
      return {
        score: Math.round(cached.score * 100),
        missingSkills: cached.missingSkills || [],
        fromCache: true,
        scoreId: cached._id
      };
    }

    const formData = new FormData();
    formData.append('resume_file', resumeBuffer, { filename: 'resume.pdf' });
    formData.append('jd_file', jdBuffer, { filename: 'jd.pdf' });

    const response = await axios.post(`${AI_SERVICE_URL}/analyze-skills`, formData, {
      headers: formData.getHeaders(),
      timeout: 180000  // 2 minutes
    });

    if (!response.data.success) {
      throw new Error('AI service analysis failed');
    }

    const missingSkills = response.data.missing_skills || [];
    const totalJDChunks = response.data.total_jd_chunks || 0;
    const missingChunksCount = response.data.missing_chunks_count || 0;
    const aiScore = response.data.match_score || 0;

    const scoreDoc = await ResumeScore.create({
      user: userId,
      cvHash,
      jdHash,
      score: aiScore,
      missingSkills,
      method: 'cosine_v0',
      embeddingModel: 'all-MiniLM-L6-v2',
      missingChunksCount,
      totalChunksCount: totalJDChunks
    });

    console.log(`✅ Real cosine score: ${Math.round(aiScore * 100)}% (${missingChunksCount}/${totalJDChunks} missing chunks)`);
    
    return {
      score: Math.round(aiScore * 100),
      missingSkills,
      fromCache: false,
      scoreId: scoreDoc._id
    };

  } catch (error) {
    console.error('❌ Match score calculation failed:', error.message);
    return { score: 0, missingSkills: [], fromCache: false };
  }
}

module.exports = { calculateMatchScore };