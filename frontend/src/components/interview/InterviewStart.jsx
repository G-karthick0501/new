// frontend/src/components/interview/InterviewStart.jsx
import { useState } from 'react';

export default function InterviewStart({ onStart, isLoading }) {
  const [selectedType, setSelectedType] = useState('technical');
  const [questionCount, setQuestionCount] = useState(5);

  const questionOptions = [
    { value: 3, label: '3 questions', description: 'Quick practice (5-10 mins)' },
    { value: 5, label: '5 questions', description: 'Standard interview (10-15 mins)' },
    { value: 7, label: '7 questions', description: 'Extended practice (15-20 mins)' },
    { value: 10, label: '10 questions', description: 'Comprehensive (25-30 mins)' }
  ];

  const handleStart = () => {
    onStart(selectedType, questionCount);
  };

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
      
      {/* ✅ ENHANCED: Start Button */}
      <button
        onClick={handleStart}
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
        {isLoading ? 'Starting Interview...' : `Start ${selectedType} Interview (${questionCount} questions)`}
      </button>
      
      {/* ✅ ENHANCED: Updated expectations */}
      <div style={{ 
        marginTop: 30, 
        padding: 20, 
        backgroundColor: '#f8f9fa', 
        borderRadius: 5,
        fontSize: 14
      }}>
        <strong>What to expect:</strong>
        <ul style={{ textAlign: 'left', margin: '10px 0' }}>
          <li>{questionCount} questions related to your chosen interview type</li>
          <li>Type your responses in the text area</li>
          <li>Take your time - there's no strict time limit</li>
          <li>Get comprehensive AI-powered feedback at the end</li>
        </ul>
      </div>
    </div>
  );
}
