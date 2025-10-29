// frontend/src/components/interview/InterviewStart.jsx
import { useState } from 'react';

export default function InterviewStart({ onStart, isLoading }) {
  const [selectedType, setSelectedType] = useState('technical');
  const [questionCount, setQuestionCount] = useState(5);
  
  // ✅ NEW: Resume/JD upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [jdText, setJdText] = useState('');

  const questionOptions = [
    { value: 3, label: '3 questions', description: 'Quick practice (5-10 mins)' },
    { value: 5, label: '5 questions', description: 'Standard interview (10-15 mins)' },
    { value: 7, label: '7 questions', description: 'Extended practice (15-20 mins)' },
    { value: 10, label: '10 questions', description: 'Comprehensive (25-30 mins)' }
  ];

  // ✅ MODIFIED: First click shows upload modal
  const handleStartClick = () => {
    setShowUploadModal(true);
  };

  // ✅ NEW: Second click (from modal) starts interview
  const handleConfirmStart = () => {
    if (!resumeText || resumeText.trim().length < 50) {
      alert('Please enter your resume text (minimum 50 characters)');
      return;
    }
    
    setShowUploadModal(false);
    onStart(selectedType, questionCount, resumeText, jdText || null);
  };

  // ✅ NEW: Upload Modal
  if (showUploadModal) {
    return (
      <div style={{ padding: 40, maxWidth: 700, margin: '0 auto' }}>
        <h2>📄 Upload Resume & Job Description</h2>
        <p style={{ color: '#666', marginBottom: 30 }}>
          Provide your resume (required) and job description (optional) to generate personalized questions.
        </p>

        {/* Resume Input */}
        <div style={{ marginBottom: 25 }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
            Resume Text <span style={{ color: 'red' }}>*</span>
          </label>
          <textarea
            placeholder="Paste your resume text here... (minimum 50 characters)"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={12}
            style={{
              width: '100%',
              padding: 12,
              fontSize: 14,
              borderRadius: 5,
              border: '1px solid #ddd',
              fontFamily: 'monospace'
            }}
          />
          <small style={{ color: '#666' }}>
            {resumeText.length} characters
          </small>
        </div>

        {/* JD Input */}
        <div style={{ marginBottom: 25 }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8 }}>
            Job Description (Optional)
          </label>
          <textarea
            placeholder="Paste job description here to get JD-specific questions..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            rows={8}
            style={{
              width: '100%',
              padding: 12,
              fontSize: 14,
              borderRadius: 5,
              border: '1px solid #ddd',
              fontFamily: 'monospace'
            }}
          />
          <small style={{ color: '#666' }}>
            {jdText.length} characters
          </small>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 15, justifyContent: 'center' }}>
          <button
            onClick={() => setShowUploadModal(false)}
            style={{
              padding: '12px 24px',
              fontSize: 16,
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer'
            }}
          >
            ← Back
          </button>
          
          <button
            onClick={handleConfirmStart}
            disabled={isLoading || !resumeText || resumeText.length < 50}
            style={{
              padding: '12px 24px',
              fontSize: 16,
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              cursor: (isLoading || !resumeText || resumeText.length < 50) ? 'not-allowed' : 'pointer',
              opacity: (isLoading || !resumeText || resumeText.length < 50) ? 0.6 : 1
            }}
          >
            {isLoading ? 'Generating Questions...' : '🚀 Start Interview'}
          </button>
        </div>

        <div style={{ 
          marginTop: 25, 
          padding: 15, 
          backgroundColor: '#e7f3ff', 
          borderRadius: 5,
          fontSize: 14
        }}>
          <strong>💡 Tip:</strong> The more detailed your resume, the better the AI can generate relevant questions!
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: 40, 
      maxWidth: 600, 
      margin: '0 auto',
      textAlign: 'center' 
    }}>
      <h2>Mock Interview Practice</h2>
      <p>Choose your interview type, number of questions, and start practicing!</p>
      
      {/* ✅ EXISTING: Interview Type Selection */}
      <div style={{ margin: '30px 0' }}>
        <h3 style={{ marginBottom: 15 }}>Interview Type</h3>
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <input
              type="radio"
              value="technical"
              checked={selectedType === 'technical'}
              onChange={(e) => setSelectedType(e.target.value)}
            />
            <strong>Technical Interview</strong>
            <span style={{ color: '#666' }}>- Programming and system design questions</span>
          </label>
        </div>
        
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <input
              type="radio"
              value="behavioral"
              checked={selectedType === 'behavioral'}
              onChange={(e) => setSelectedType(e.target.value)}
            />
            <strong>Behavioral Interview</strong>
            <span style={{ color: '#666' }}>- Experience and situation-based questions</span>
          </label>
        </div>
      </div>

      {/* ✅ NEW: Question Count Selection */}
      <div style={{ margin: '30px 0' }}>
        <h3 style={{ marginBottom: 15 }}>Number of Questions</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: 10, 
          maxWidth: 500, 
          margin: '0 auto' 
        }}>
          {questionOptions.map(option => (
            <label 
              key={option.value}
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                padding: 15,
                border: questionCount === option.value ? '2px solid #007bff' : '2px solid #ddd',
                borderRadius: 8,
                cursor: 'pointer',
                backgroundColor: questionCount === option.value ? '#f0f8ff' : '#fff',
                transition: 'all 0.2s ease'
              }}
            >
              <input
                type="radio"
                value={option.value}
                checked={questionCount === option.value}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                style={{ marginBottom: 8 }}
              />
              <strong style={{ marginBottom: 4 }}>{option.label}</strong>
              <small style={{ color: '#666', textAlign: 'center' }}>
                {option.description}
              </small>
            </label>
          ))}
        </div>
      </div>
      
      {/* ✅ MODIFIED: Start Button (first click) */}
      <button
        onClick={handleStartClick}
        disabled={isLoading}
        style={{
          padding: '15px 30px',
          fontSize: 18,
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: 5,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1
        }}
      >
        {isLoading ? 'Starting Interview...' : `Continue → Upload Resume`}
      </button>
      
      
      <div style={{ 
        marginTop: 30, 
        padding: 20, 
        backgroundColor: '#f8f9fa', 
        borderRadius: 5,
        fontSize: 14
      }}>
        <strong>What to expect:</strong>
        <ul style={{ textAlign: 'left', margin: '10px 0' }}>
          <li>Upload your resume (and optionally JD) on the next screen</li>
          <li>AI will generate {questionCount} personalized {selectedType} questions</li>
          <li>Type your responses in the text area</li>
          <li>Get comprehensive AI-powered feedback at the end</li>
        </ul>
      </div>
    </div>
  );
}
