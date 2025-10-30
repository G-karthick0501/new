// services/resume/resumeService.js
const pdfUtils = require('./pdfUtils');
const textProcessor = require('./textProcessor');
const geminiService = require('../../ai-services/llm/geminiService'); // ✅ FIXED
const embeddingService = require('../../ai-services/rag/embeddingService');

class ResumeService {
    constructor() {
        this.sections = ['Education', 'Experience', 'Skills', 'Projects', 'Achievements', 'Personal Details'];
    }

    async optimizeResume(pdfBuffer, jobDescription) {
        try {
            // 1. Extract text
            const resumeText = await pdfUtils.extractTextFromPDF(pdfBuffer);
            if (!resumeText) throw new Error('Failed to extract text from PDF');

            // 2. Sectioning
            const resumeJson = this.sectionResume(resumeText);

            // 3. Job keywords
            const jobKeywords = textProcessor.extractJobKeywords(jobDescription);

            // 4. Rank sections
            const sectionScores = await this.rankResumeSections(resumeJson, jobKeywords);

            // 5. Generate optimized resume
            const { generatedText, tailoredSections } = await this.generateOptimizedResume(
                resumeJson,
                jobDescription,
                jobKeywords,
                sectionScores
            );

            // 6. Metrics
            const metrics = await this.calculateMetrics(generatedText, resumeText, jobDescription);

            return {
                content: {
                    text: generatedText,
                    sections: tailoredSections,
                    format: 'text'
                },
                metrics
            };
        } catch (error) {
            console.error('Resume optimization failed:', error);
            throw error;
        }
    }

    // sectionResume ✅ (your version is fine)

    async rankResumeSections(resumeJson, jobKeywords) {
        const scores = {};
        const jobEmbedding = await embeddingService.embedText(jobKeywords.join(' '));
        for (const [section, text] of Object.entries(resumeJson)) {
            const sectionEmbedding = await embeddingService.embedText(text);
            scores[section] = await embeddingService.calculateSimilarity(sectionEmbedding, jobEmbedding);
        }
        return scores;
    }

    async generateOptimizedResume(resumeJson, jobDescription, jobKeywords, sectionScores) {
        const tailoredSections = {};
        for (const [section, text] of Object.entries(resumeJson)) {
            if (sectionScores[section] > 0.2) {
                const prompt = this.createOptimizationPrompt(section, text, jobDescription, jobKeywords);
                const optimizedText = await geminiService.generateContent(prompt); // ✅ FIXED
                tailoredSections[section] = optimizedText;
            } else {
                tailoredSections[section] = text;
            }
        }
        const generatedText = Object.entries(tailoredSections)
            .map(([section, text]) => `\n\n${section}\n${'-'.repeat(section.length)}\n${text}`)
            .join('');
        return { generatedText, tailoredSections };
    }

    // createOptimizationPrompt ✅ unchanged

    async calculateMetrics(generatedText, originalText, jobDescription) {
        const jobAlignmentScore = await embeddingService.calculateSimilarity(
            await embeddingService.embedText(generatedText),
            await embeddingService.embedText(jobDescription)
        );
        const preservationScore = await embeddingService.calculateSimilarity(
            await embeddingService.embedText(generatedText),
            await embeddingService.embedText(originalText)
        );
        return { jobAlignment: jobAlignmentScore, contentPreservation: preservationScore };
    }
}

module.exports = new ResumeService();
