// frontend/src/hooks/useResumeAnalysis.js - UPDATED for two-step flow

import { useState, useEffect } from 'react';
import { resumeAnalysisService } from '../services/api/resumeAnalysisApi';

const STORAGE_KEY = 'resumeAnalysisState';

export function useResumeAnalysis() {
  const [sessionId, setSessionId] = useState(null);
  const [missingSkills, setMissingSkills] = useState([]);
  const [improvementTips, setImprovementTips] = useState([]);
  const [optimizedResume, setOptimizedResume] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');

  const [currentStep, setCurrentStep] = useState('upload'); // upload, skillSelection, results

  const [originalResume, setOriginalResume] = useState(''); // 🆕 ADD THIS
  const [resumeFileName, setResumeFileName] = useState(''); // 🆕 ADD THIS
  const [jdFileName, setJdFileName] = useState(''); // 🆕 ADD THIS

  // Load saved state on component mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const savedState = JSON.parse(saved);
        
        // Only restore if it's recent (within 1 hour)
        const savedTime = new Date(savedState.timestamp);
        const now = new Date();
        const hoursSinceAnalysis = (now - savedTime) / (1000 * 60 * 60);
        
        if (hoursSinceAnalysis < 1) {
          if (savedState.sessionId) setSessionId(savedState.sessionId);
          if (savedState.missingSkills) setMissingSkills(savedState.missingSkills);
          if (savedState.improvementTips) setImprovementTips(savedState.improvementTips);
          if (savedState.optimizedResume) setOptimizedResume(savedState.optimizedResume);
          if (savedState.selectedSkills) setSelectedSkills(savedState.selectedSkills);
          if (savedState.currentStep) setCurrentStep(savedState.currentStep);
          
          setUploadStatus('✅ Session restored from previous session');
        } else {
          // Clear old data
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (err) {
      console.error('Error loading saved state:', err);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (sessionId || missingSkills.length > 0) {
      const stateToSave = {
        sessionId,
        missingSkills,
        improvementTips,
        optimizedResume,
        selectedSkills,
        currentStep,
        uploadStatus,
        timestamp: new Date().toISOString()
      };
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (err) {
        console.error('Error saving state:', err);
      }
    }
  }, [sessionId, missingSkills, improvementTips, optimizedResume, selectedSkills, currentStep, uploadStatus]);

  // ============================================
  // 🆕 STEP 1: Analyze Initial (Get Missing Skills)
  // ============================================
  const analyzeInitial = async (resumeFile, jdFile) => {
    if (!resumeFile || !jdFile) {
      setError('Please select both resume and job description files');
      return false;
    }

    // Validate files
    const resumeErrors = resumeAnalysisService.validateFile(resumeFile);
    const jdErrors = resumeAnalysisService.validateFile(jdFile);
    
    if (resumeErrors.length > 0 || jdErrors.length > 0) {
      setError([...resumeErrors, ...jdErrors].join(', '));
      return false;
    }

    setLoading(true);
    setError(null);
    setUploadStatus('📤 Uploading files and analyzing...');
    setCurrentStep('upload');

    try {
      const result = await resumeAnalysisService.analyzeInitial(resumeFile, jdFile);
      
      if (result.success) {


        setSessionId(result.sessionId);
        setMissingSkills(result.analysis.missingSkills || []);
        setImprovementTips(result.analysis.improvementTips || []);
        
        // 🆕 ADD THESE LINES - Store file names for later
        setResumeFileName(result.analysis.resumeFileName || '');
        setJdFileName(result.analysis.jdFileName || '');
        
        // 🆕 ADD THIS - Store original resume text (we'll extract it from AI service response)
        setOriginalResume(result.analysis.originalResumeText || '');
        
        // Pre-select all skills by default
        setSelectedSkills(result.analysis.missingSkills || []);
        
        // Move to skill selection step
        setCurrentStep('skillSelection');

        // Store analysis results
        setSessionId(result.sessionId);
        setMissingSkills(result.analysis.missingSkills || []);
        setImprovementTips(result.analysis.improvementTips || []);
        
        // Pre-select all skills by default
        setSelectedSkills(result.analysis.missingSkills || []);
        
        // Move to skill selection step
        setCurrentStep('skillSelection');
        
        const successMessage = `✅ Analysis complete! Found ${result.analysis.missingSkillsCount} missing skills.`;
        setUploadStatus(successMessage);
        
        return result.analysis;
      } else {
        setError('Analysis failed: ' + result.msg);
        setUploadStatus('❌ Analysis failed');
        return false;
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Analysis error: ' + err.message);
      setUploadStatus('❌ Network error - make sure both backend and AI service are running');
      
      if (err.message.includes('AI service unavailable')) {
        setError('AI service is not running. Please start it with: uvicorn app:app --reload');
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 🆕 STEP 2: Generate Optimized Resume (With Selected Skills)
  // ============================================
  const generateOptimized = async () => {
    if (!sessionId) {
      setError('No session found. Please analyze your resume first.');
      return false;
    }

    if (!selectedSkills || selectedSkills.length === 0) {
      setError('Please select at least one skill to add.');
      return false;
    }

    setLoading(true);
    setError(null);
    setUploadStatus(`🔧 Generating optimized resume with ${selectedSkills.length} selected skills...`);

    try {
      const result = await resumeAnalysisService.generateOptimized(sessionId, selectedSkills);
      
      if (result.success) {
        // Store optimization results
        setOptimizedResume(result.optimization.optimizedResume);
        
        // Move to results step
        setCurrentStep('results');
        
        const successMessage = `✅ Resume optimized! Added ${result.optimization.addedSkills.length} skills.`;
        setUploadStatus(successMessage);
        
        return result.optimization;
      } else {
        setError('Optimization failed: ' + result.msg);
        setUploadStatus('❌ Optimization failed');
        return false;
      }
    } catch (err) {
      console.error('Optimization error:', err);
      setError('Optimization error: ' + err.message);
      setUploadStatus('❌ Failed to generate optimized resume');
      
      if (err.message.includes('Session not found')) {
        setError('Session expired. Please re-upload your files and try again.');
        setCurrentStep('upload');
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 🔧 Skill Selection Helpers
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

  const isSkillSelected = (skill) => {
    return selectedSkills.includes(skill);
  };

  // ============================================
  // 🔧 Navigation & State Management
  // ============================================
  const goBackToSkillSelection = () => {
    setCurrentStep('skillSelection');
    setOptimizedResume(null);
  };

  const startOver = () => {
    setSessionId(null);
    setMissingSkills([]);
    setImprovementTips([]);
    setOptimizedResume(null);
    setSelectedSkills([]);
    setCurrentStep('upload');
    setError(null);
    setUploadStatus('');
    
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Error clearing storage:', err);
    }
  };

  // ============================================
  // 🔧 LEGACY: Old methods (backward compatibility)
  // ============================================
  const testUpload = async (resumeFile, jdFile) => {
    console.warn('⚠️  testUpload() is deprecated. Use analyzeInitial() instead.');
    return analyzeInitial(resumeFile, jdFile);
  };

  const analyzeResume = async (resumeFile, jdFile) => {
    console.warn('⚠️  analyzeResume() is deprecated. Use analyzeInitial() + generateOptimized() instead.');
    return analyzeInitial(resumeFile, jdFile);
  };

  const clearAnalysis = () => {
    startOver();
  };

  const reset = () => {
    startOver();
  };

  return {
    // State
    sessionId,
    missingSkills,
    improvementTips,
    optimizedResume,
    selectedSkills,
    loading,
    error,
    uploadStatus,
    currentStep,
    originalResume,  // 🆕 ADD THIS
    resumeFileName,  // 🆕 ADD THIS
    jdFileName,      // 🆕 ADD THIS
    selectedSkills,
    
    // Step 1: Analysis
    analyzeInitial,
    
    // Step 2: Optimization
    generateOptimized,
    
    // Skill Selection
    toggleSkill,
    selectAllSkills,
    deselectAllSkills,
    isSkillSelected,
    
    // Navigation
    goBackToSkillSelection,
    startOver,
    
    // Legacy methods (for backward compatibility)
    testUpload,
    analyzeResume,
    clearAnalysis,
    reset,
    
    // Computed values
    hasSession: !!sessionId,
    hasMissingSkills: missingSkills.length > 0,
    hasOptimizedResume: !!optimizedResume,
    selectedSkillsCount: selectedSkills.length,
    totalSkillsCount: missingSkills.length,
    isProcessing: loading
  };
}