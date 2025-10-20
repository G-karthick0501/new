// frontend/src/components/candidate/ResumeAnalyzer/ResumeAnalyzer.jsx
import { useState } from 'react';
import FileUpload from './FileUpload';
import SkillSelectionModal from './SkillSelectionModal';
import DiffViewer from './DiffViewer';
import { useResumeAnalysis } from '../../../hooks/useResumeAnalysis';

export default function ResumeAnalyzer() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);

  const {
    analyzeResume,
    generateOptimized,
    generatePDF,
    toggleSkill,
    selectAllSkills,
    deselectAllSkills,
    handleCancelSkillSelection,
    currentStep,
    missingSkills,
    selectedSkills,
    improvementTips,
    optimizedResume,
    originalResume, // ✅ ADD THIS
    loading,
    error,
    uploadStatus,
    selectedSkillsCount
  } = useResumeAnalysis();

  const handleAnalyze = async () => {
    if (!resumeFile || !jdFile) {
      alert('Please upload both files');
      return;
    }
    await analyzeResume(resumeFile, jdFile);
  };

  const handleContinueWithSkills = async () => {
    await generateOptimized(resumeFile, jdFile);
  };

  const handleDownload = () => {
    if (!optimizedResume) return;
    
    const blob = new Blob([optimizedResume], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'optimized_resume.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleTestConnection = async () => {
    try {
      const response = await fetch('http://localhost:8000/docs');
      if (response.ok) {
        alert('✅ Connection successful! AI service is running.');
      } else {
        alert('⚠️ AI service responded but with an error.');
      }
    } catch (err) {
      alert('❌ Cannot connect to AI service. Make sure it\'s running on port 8000.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>AI Resume Analyzer & Optimizer</h2>
        <p style={styles.description}>
          Upload your resume and a job description to get AI-powered optimization suggestions
        </p>

        {/* STEP 1: FILE UPLOAD */}
        {currentStep === 'upload' && (
          <>
            <FileUpload
              resumeFile={resumeFile}
              jdFile={jdFile}
              onFilesSelected={(type, file) => {
                if (type === 'resume') setResumeFile(file);
                else if (type === 'jd') setJdFile(file);
              }}
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
                style={{
                  ...styles.button,
                  ...styles.secondaryButton,
                  cursor: 'pointer'
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

            {/* ✅ ADD DIFF VIEWER */}
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
                  {improvementTips.map((tip, idx) => (
                    <li key={idx} style={styles.tipItem}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={styles.resumeSection}>
              <h3 style={styles.sectionTitle}>📄 Optimized Resume</h3>
              <div style={styles.resumePreview}>
                <pre style={styles.resumeText}>{optimizedResume}</pre>
              </div>
            </div>

            <div style={styles.resultsActions}>
              <button
                onClick={handleDownload}
                style={{
                  ...styles.button,
                  ...styles.primaryButton
                }}
              >
                📥 Download Optimized Resume
              </button>

              <button
                onClick={async () => {
                  const success = await generatePDF();
                  if (success) {
                    alert('✅ PDF downloaded successfully!');
                  }
                }}
                disabled={loading}
                style={{
                  ...styles.button,
                  ...styles.secondaryButton,
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? '⏳ Generating PDF...' : '📄 Download as PDF'}
              </button>

              <button
                onClick={() => window.location.reload()}
                style={{
                  ...styles.button,
                  backgroundColor: '#6c757d',
                  color: 'white'
                }}
              >
                🔄 Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: 20,
    maxWidth: 1200, // Wider for diff viewer
    margin: '0 auto'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    textAlign: 'center',
    color: '#333',
    margin: '0 0 10px'
  },
  description: {
    fontSize: 18,
    color: '#666',
    margin: '0 0 30px',
    textAlign: 'center'
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