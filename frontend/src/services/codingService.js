// frontend/src/services/codingService.js
const API_BASE = "http://localhost:5000/api";

export const codingService = {
  async submitCode(sourceCode, languageId, stdin = '') {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/coding/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ sourceCode, languageId, stdin })
    });
    return await response.json();
  },

  async getSubmissionResults(token) {
    const authToken = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/coding/submission/${token}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return await response.json();
  }
};