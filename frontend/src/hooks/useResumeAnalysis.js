// frontend/src/hooks/useResumeAnalysis.js - COMPLETE with PDF Generation

import { useState, useEffect } from 'react';
import { resumeAnalysisService } from '../services/api/resumeAnalysisApi';

const STORAGE_KEY = 'resumeAnalysisState';
const AI_SERVICE_BASE = import.meta.env.VITE_RESUME_ANALYZER_URL; // FastAPI AI service

export function useResumeAnalysis() {
  const [sessionId, setSessionId] = useState(null);
  const [missingSkills, setMissingSkills] = useState([]);
  const [improvementTips, setImprovementTips] = useState([]);
  const [optimizedResume, setOptimizedResume] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  // ✅ FIX: Always start with 'upload' step - don't restore from localStorage
  const [currentStep, setCurrentStep] = useState('upload'); // upload, skillSelection, results

  const [originalResume, setOriginalResume] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [jdFileName, setJdFileName] = useState('');
  
  // Store files for PDF generation
  const [resumeFile, setResumeFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);

  // ✅ FIX: Clear localStorage on mount to prevent modal bug
  useEffect(() => {
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (sessionId) {
      const stateToSave = {
        sessionId,
        missingSkills,
        improvementTips,
        optimizedResume,
        selectedSkills,
        originalResume,
        currentStep,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [sessionId, missingSkills, improvementTips, optimizedResume, selectedSkills, originalResume, currentStep]);

  // ============================================
  // ANALYZE RESUME (Step 1)
  // ============================================
  const analyzeResume = async (resumeFileArg, jdFileArg) => {
    setLoading(true);
    setError(null);
    setUploadStatus('📤 Uploading files to AI service...');

    try {
      // Store files for later PDF generation
      setResumeFile(resumeFileArg);
      setJdFile(jdFileArg);
      setResumeFileName(resumeFileArg.name);
      setJdFileName(jdFileArg.name);

      // Call AI service directly (original approach)
      const formData = new FormData();
      formData.append('resume_file', resumeFileArg);
      formData.append('jd_file', jdFileArg);

      const response = await fetch(`${AI_SERVICE_BASE}/analyze-skills`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      setUploadStatus('✅ Analysis complete!');
      setMissingSkills(data.missing_skills || []);
      setImprovementTips(data.improvement_tips || []);
      setOriginalResume(data.original_resume_text || '');
      
      // Move to skill selection step
      setCurrentStep('skillSelection');

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze resume');
      setUploadStatus('');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // GENERATE OPTIMIZED RESUME (Step 2)
  // ============================================
  const generateOptimized = async (resumeFileArg, jdFileArg) => {
    if (selectedSkills.length === 0) {
      setError('Please select at least one skill');
      return;
    }

    setLoading(true);
    setError(null);
    setUploadStatus('🤖 AI is optimizing your resume...');

    try {
      const formData = new FormData();
      formData.append('resume_file', resumeFileArg);
      formData.append('jd_file', jdFileArg);
      formData.append('selected_skills', JSON.stringify(selectedSkills));

      const response = await fetch(`${AI_SERVICE_BASE}/optimize-with-skills`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Optimization failed');
      }

      setUploadStatus('✅ Resume optimized!');
      setOptimizedResume(data.optimized_resume_text || '');
      
      // Move to results step
      setCurrentStep('results');

    } catch (err) {
      console.error('Optimization error:', err);
      setError(err.message || 'Failed to optimize resume');
      setUploadStatus('');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // GENERATE PDF (Step 3)
  // ============================================
  const generatePDF = async () => {
    if (!resumeFile || !jdFile || selectedSkills.length === 0) {
      setError('Missing required data for PDF generation');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('resume_file', resumeFile);
      formData.append('jd_file', jdFile);
      formData.append('selected_skills', JSON.stringify(selectedSkills));

      const response = await fetch(`${AI_SERVICE_BASE}/generate-pdf`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PDF generation failed');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'optimized_resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;

    } catch (err) {
      console.error('PDF generation error:', err);
      setError(err.message || 'Failed to generate PDF');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SKILL SELECTION HANDLERS
  // ============================================
  const toggleSkill = (skill) => {
    setSelectedSkills(prev => {
      if (prev.includes(skill)) {
        return prev.filter(s => s !== skill);
      } else {
        return [...prev, skill];
      }
    });
  };

  const selectAllSkills = () => {
    setSelectedSkills([...missingSkills]);
  };

  const deselectAllSkills = () => {
    setSelectedSkills([]);
  };

  const handleCancelSkillSelection = () => {
    setCurrentStep('upload');
    setSelectedSkills([]);
  };

  // ============================================
  // RESET/START OVER
  // ============================================
  const startOver = () => {
    setSessionId(null);
    setMissingSkills([]);
    setImprovementTips([]);
    setOptimizedResume(null);
    setSelectedSkills([]);
    setOriginalResume('');
    setResumeFileName('');
    setJdFileName('');
    setResumeFile(null);
    setJdFile(null);
    setCurrentStep('upload');
    setError(null);
    setUploadStatus('');
    localStorage.removeItem(STORAGE_KEY);
  };

  // ============================================
  // RETURN VALUES
  // ============================================
  return {
    // State
    sessionId,
    missingSkills,
    improvementTips,
    optimizedResume,
    selectedSkills,
    originalResume,
    loading,
    error,
    uploadStatus,
    currentStep,
    resumeFileName,
    jdFileName,

    // Methods
    analyzeResume,
    generateOptimized,
    generatePDF, // ✅ NEW: PDF generation function
    toggleSkill,
    selectAllSkills,
    deselectAllSkills,
    handleCancelSkillSelection,
    startOver,

    // Computed
    selectedSkillsCount: selectedSkills.length,
    totalSkillsCount: missingSkills.length,
    hasSession: !!sessionId,
    hasMissingSkills: missingSkills.length > 0,
    hasOptimizedResume: !!optimizedResume,
    isProcessing: loading
  };
}