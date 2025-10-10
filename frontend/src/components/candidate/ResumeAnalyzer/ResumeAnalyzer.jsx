// frontend/src/components/candidate/ResumeAnalyzer/ResumeAnalyzer.jsx

import React, { useState } from 'react';
import { useResumeAnalysis } from '../../../hooks/useResumeAnalysis';
import FileUpload from './FileUpload';
import SkillSelectionModal from './SkillSelectionModal';
import DiffViewer from './DiffViewer';

export default function ResumeAnalyzer() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);

  const {
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

    // Methods
    analyzeInitial,
    generateOptimized,
    toggleSkill,
    selectAllSkills,
    deselectAllSkills,
    startOver,

    // Computed
    selectedSkillsCount,
    totalSkillsCount
  } = useResumeAnalysis();

  // ============================================
  // FILE HANDLERS
  // ============================================

  const handleFilesSelected = (type, file) => {
    if (type === 'resume') {
      setResumeFile(file);
    } else if (type === 'jd') {
      setJdFile(file);
    }
  };

  // ============================================
  // TEST CONNECTION HANDLER
  // ============================================

  const handleTestConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      formData.append('resume', resumeFile);
      formData.append('jobDescription', jdFile);

      const response = await fetch('http://localhost:5000/api/resume/test-upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          `✅ Connection Test Successful!\n\nResume: ${data.resumeName} (${(data.resumeSize / 1024).toFixed(1)} KB)\nJD: ${data.jdName} (${(data.jdSize / 1024).toFixed(1)} KB)`
        );
      } else {
        alert('❌ Connection test failed: ' + (data.msg || 'Unknown error'));
      }
    } catch (err) {
      alert(
        '❌ Cannot reach backend!\n\nError: ' +
          err.message +
          '\n\nMake sure:\n1. Backend is running (npm start)\n2. AI service is running (uvicorn app:app --reload)\n3. Port 5000 is accessible'
      );
    }
  };

  // ============================================
  // ANALYZE HANDLER
  // ============================================

  const handleAnalyze = async () => {
    const result = await analyzeInitial(resumeFile, jdFile);
    if (result) {
      console.log('Analysis complete:', result);
    }
  };

  // ============================================
  // SKILL SELECTION HANDLERS
  // ============================================

  const handleContinueWithSkills = async () => {
    const result = await generateOptimized();
    if (result) {
      console.log('Optimization complete:', result);
    }
  };

  const handleCancelSkillSelection = () => {
    startOver();
    setResumeFile(null);
    setJdFile(null);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>📄 Resume Analyzer</h1>
        <p style={styles.description}>
          Upload your resume and job description to get personalized optimization suggestions
        </p>
      </div>

      {/* STEP 1: UPLOAD */}
      {currentStep === 'upload' && (
        <>
          <FileUpload
            onFilesSelected={handleFilesSelected}
            resumeFile={resumeFile}
            jdFile={jdFile}
            disabled={loading}
          />

          {uploadStatus && (
            <div style={styles.statusBox}>
              <p style={styles.statusText}>{uploadStatus}</p>
            </div>
          )}

          {error && (
            <div style={styles.errorBox}>
              <p style={styles.errorText}>❌ {error}</p>
            </div>
          )}

          <div style={styles.buttonContainer}>
            <button
              onClick={handleTestConnection}
              disabled={!resumeFile || !jdFile || loading}
              style={{
                ...styles.button,
                ...styles.secondaryButton,
                opacity: (!resumeFile || !jdFile || loading) ? 0.5 : 1,
                cursor: (!resumeFile || !jdFile || loading) ? 'not-allowed' : 'pointer'
              }}
            >
              🔌 Test Connection
            </button>

            <button
              onClick={handleAnalyze}
              disabled={!resumeFile || !jdFile || loading}
              style={{
                ...styles.button,
                ...styles.primaryButton,
                opacity: (!resumeFile || !jdFile || loading) ? 0.5 : 1,
                cursor: (!resumeFile || !jdFile || loading) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <>
                  <span style={styles.spinner}>⏳</span> Analyzing...
                </>
              ) : (
                <>🔍 Analyze Resume</>
              )}
            </button>
          </div>

          <div style={styles.instructions}>
            <h3 style={styles.instructionsTitle}>How it works:</h3>
            <ol style={styles.instructionsList}>
              <li>Upload your current resume (PDF)</li>
              <li>Upload the job description you're targeting (PDF)</li>
              <li>
                <strong>Test Connection</strong> (optional) - Verify backend connectivity
              </li>
              <li>
                <strong>Analyze Resume</strong> - AI identifies missing skills
              </li>
              <li>Select which skills you want to add</li>
              <li>Get your optimized resume instantly!</li>
            </ol>
          </div>
        </>
      )}

      {/* STEP 2: SKILL SELECTION */}
      {currentStep === 'skillSelection' && (
        <SkillSelectionModal
          missingSkills={missingSkills}
          selectedSkills={selectedSkills}
          onToggleSkill={toggleSkill}
          onSelectAll={selectAllSkills}
          onDeselectAll={deselectAllSkills}
          onContinue={handleContinueWithSkills}
          onCancel={handleCancelSkillSelection}
          loading={loading}
        />
      )}

      {/* STEP 3: RESULTS */}
      {currentStep === 'results' && (
        <div style={styles.resultsContainer}>
          <div style={styles.resultsHeader}>
            <h2 style={styles.resultsTitle}>✅ Resume Optimized!</h2>
            <p style={styles.resultsSubtitle}>
              Successfully added {selectedSkillsCount} skill
              {selectedSkillsCount !== 1 ? 's' : ''} to your resume
            </p>
          </div>

          {originalResume && optimizedResume && (
            <DiffViewer
              originalText={originalResume}
              optimizedText={optimizedResume}
              addedSkills={selectedSkills}
            />
          )}

          {improvementTips.length > 0 && (
            <div style={styles.tipsSection}>
              <h3 style={styles.sectionTitle}>💡 Improvement Tips</h3>
              <ul style={styles.tipsList}>
                {improvementTips.map((tip, index) => (
                  <li key={index} style={styles.tipItem}>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={styles.resumeSection}>
            <h3 style={styles.sectionTitle}>📄 Your Optimized Resume</h3>
            <div style={styles.resumePreview}>
              <pre style={styles.resumeText}>{optimizedResume}</pre>
            </div>
          </div>

          <div style={styles.resultsActions}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(optimizedResume);
                alert('✅ Copied to clipboard!');
              }}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              📋 Copy to Clipboard
            </button>

            <button
              onClick={() => {
                const blob = new Blob([optimizedResume], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'optimized_resume.txt';
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={{ ...styles.button, ...styles.secondaryButton }}
            >
              💾 Download Resume
            </button>

            <button
              onClick={() => {
                startOver();
                setResumeFile(null);
                setJdFile(null);
              }}
              style={{ ...styles.button, ...styles.primaryButton }}
            >
              🔄 Start New Analysis
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// STYLES
// ============================================

const styles = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: 40
  },
  header: {
    textAlign: 'center',
    marginBottom: 40
  },
  title: {
    fontSize: 36,
    fontWeight: 700,
    color: '#333',
    margin: '0 0 10px'
  },
  description: {
    fontSize: 18,
    color: '#666',
    margin: 0
  },
  statusBox: {
    padding: 20,
    backgroundColor: '#e7f3ff',
    borderRadius: 8,
    marginTop: 20,
    border: '1px solid #2196F3'
  },
  statusText: {
    margin: 0,
    fontSize: 16,
    color: '#1565c0'
  },
  errorBox: {
    padding: 20,
    backgroundColor: '#ffe7e7',
    borderRadius: 8,
    marginTop: 20,
    border: '1px solid #f44336'
  },
  errorText: {
    margin: 0,
    fontSize: 16,
    color: '#c62828'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: 15,
    flexWrap: 'wrap',
    marginTop: 30
  },
  button: {
    padding: '14px 32px',
    borderRadius: 8,
    fontSize: 18,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 10
  },
  primaryButton: {
    backgroundColor: '#28a745',
    color: 'white'
  },
  secondaryButton: {
    backgroundColor: 'white',
    color: '#28a745',
    border: '2px solid #28a745'
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite'
  },
  instructions: {
    marginTop: 50,
    padding: 30,
    backgroundColor: '#f8f9fa',
    borderRadius: 8
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 15,
    color: '#333'
  },
  instructionsList: {
    fontSize: 16,
    lineHeight: 1.8,
    color: '#555',
    paddingLeft: 20
  },
  resultsContainer: {
    marginTop: 20
  },
  resultsHeader: {
    textAlign: 'center',
    marginBottom: 40,
    padding: 30,
    backgroundColor: '#d4edda',
    borderRadius: 8
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: 700,
    color: '#155724',
    margin: '0 0 10px'
  },
  resultsSubtitle: {
    fontSize: 18,
    color: '#155724',
    margin: 0
  },
  tipsSection: {
    marginBottom: 30,
    padding: 25,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    border: '1px solid #ffc107'
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 15,
    color: '#333'
  },
  tipsList: {
    margin: 0,
    paddingLeft: 20,
    fontSize: 16,
    lineHeight: 1.8,
    color: '#555'
  },
  tipItem: {
    marginBottom: 8
  },
  resumeSection: {
    marginBottom: 30
  },
  resumePreview: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: 8,
    padding: 20,
    maxHeight: 500,
    overflowY: 'auto'
  },
  resumeText: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.6,
    color: '#333',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word'
  },
  resultsActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: 15,
    flexWrap: 'wrap'
  }
};
