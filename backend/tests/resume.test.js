const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');
const app = require('../app'); // Your Express app
const resumeService = require('../services/resume/resumeService');

describe('Resume Optimization Service', () => {
    const testPdfPath = path.join(__dirname, 'fixtures', 'test-resume.pdf');
    const testJobDescription = `
        Senior Software Engineer Position
        Requirements:
        - 5+ years of experience in JavaScript/Node.js
        - Experience with REST APIs
        - Strong problem-solving skills
        Skills:
        - Node.js, Express.js
        - Database design
        - Cloud services
    `;

    // Test the API endpoint
    describe('POST /api/resume/optimize', () => {
        it('should optimize resume successfully', async () => {
            const pdfBuffer = await fs.readFile(testPdfPath);
            
            const response = await request(app)
                .post('/api/resume/optimize')
                .attach('resume', pdfBuffer, 'resume.pdf')
                .field('jobDescription', testJobDescription);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('pdf');
            expect(response.body).toHaveProperty('metrics');
            expect(response.body.metrics).toHaveProperty('jobAlignment');
            expect(response.body.metrics).toHaveProperty('contentPreservation');
        });

        it('should return 400 if no resume is provided', async () => {
            const response = await request(app)
                .post('/api/resume/optimize')
                .field('jobDescription', testJobDescription);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should return 400 if no job description is provided', async () => {
            const pdfBuffer = await fs.readFile(testPdfPath);
            
            const response = await request(app)
                .post('/api/resume/optimize')
                .attach('resume', pdfBuffer, 'resume.pdf');

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    // Test individual components
    describe('ResumeService', () => {
        describe('sectionResume', () => {
            it('should correctly section resume text', () => {
                const testText = `
                    Education
                    Bachelor's in Computer Science
                    
                    Experience
                    Software Engineer at Tech Corp
                    
                    Skills
                    JavaScript, Python
                `;

                const result = resumeService.sectionResume(testText);
                
                expect(result).toHaveProperty('Education');
                expect(result).toHaveProperty('Experience');
                expect(result).toHaveProperty('Skills');
            });
        });

        describe('extractJobKeywords', () => {
            it('should extract relevant keywords from job description', () => {
                const keywords = resumeService.textProcessor.extractJobKeywords(testJobDescription);
                
                expect(keywords).toContain('javascript');
                expect(keywords).toContain('nodejs');
                expect(keywords).toContain('express');
            });
        });
    });
});
