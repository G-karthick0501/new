// frontend/src/services/api/resumeAnalysisApi.js - UPDATED for two-step flow

const API_BASE = "http://localhost:5000/api";

export const resumeAnalysisService = {
  // File validation
  validateFile(file) {
    const errors = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf'];

    if (!file) {
      errors.push('File is required');
      return errors;
    }

    if (file.size > maxSize) {
      errors.push(`File size must be less than ${this.formatFileSize(maxSize)}`);
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push('Only PDF files are allowed');
    }

    return errors;
  },

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Test file upload
  async testUpload(resumeFile, jdFile) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    formData.append('resume', resumeFile);
    formData.append('jobDescription', jdFile);

    const response = await fetch(`${API_BASE}/resume/test-upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();
    
    return {
      success: response.ok,
      ...data
    };
  },

  // ============================================
  // 🆕 STEP 1: Analyze Initial (Get Missing Skills)
  // ============================================
  async analyzeInitial(resumeFile, jdFile) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    formData.append('resume', resumeFile);
    formData.append('jobDescription', jdFile);

    const response = await fetch(`${API_BASE}/resume/analyze-initial`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.msg || data.details || 'Analysis failed');
    }
    
    return {
      success: response.ok,
      sessionId: data.sessionId,
      analysis: data.analysis,
      ...data
    };
  },

  // ============================================
  // 🆕 STEP 2: Generate Optimized Resume (With Selected Skills)
  // ============================================
  async generateOptimized(sessionId, selectedSkills) {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE}/resume/generate-optimized`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        selectedSkills
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.msg || data.details || 'Optimization failed');
    }
    
    return {
      success: response.ok,
      optimization: data.optimization,
      ...data
    };
  },

  // ============================================
  // 🔧 LEGACY: Old analyze method (kept for backward compatibility)
  // ============================================
  async analyzeResume(resumeFile, jdFile) {
    console.warn('⚠️  analyzeResume() is deprecated. Use analyzeInitial() + generateOptimized() instead.');
    
    // For now, just call analyzeInitial
    return this.analyzeInitial(resumeFile, jdFile);
  }
};