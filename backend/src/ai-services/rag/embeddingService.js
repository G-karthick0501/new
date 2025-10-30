// services/ai-services/rag/embeddingService.js
const axios = require('axios');
require('dotenv').config();

const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8000';

class EmbeddingService {
    async embedText(text) {
        try {
            const response = await axios.post(`${EMBEDDING_SERVICE_URL}/embed`, { text });
            return response.data.embedding;
        } catch (error) {
            console.error('Text embedding failed:', error.response?.data || error.message);
            throw error;
        }
    }

    async calculateSimilarity(embedding1, embedding2) {
        try {
            const response = await axios.post(`${EMBEDDING_SERVICE_URL}/similarity`, {
                embedding1,
                embedding2
            });
            return response.data.similarity;
        } catch (error) {
            console.error('Similarity calculation failed:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = new EmbeddingService();
