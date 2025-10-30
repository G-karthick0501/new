// services/ai-services/llm/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class GeminiService {
    constructor() {
        if (!process.env.GOOGLE_API_KEY) {
            throw new Error('GOOGLE_API_KEY environment variable is not set');
        }
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // or gemini-1.5-pro if enabled
    }

    async generateContent(prompt) {
        try {
            if (!this.model) throw new Error('Gemini model not initialized');
            const result = await this.model.generateContent(prompt);
            return result.response.text(); // ✅ FIXED
        } catch (error) {
            console.error('Gemini content generation failed:', error);
            throw error;
        }
    }
}

module.exports = new GeminiService(); // ✅ Export instance
