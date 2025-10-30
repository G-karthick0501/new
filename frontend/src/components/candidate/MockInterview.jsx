// src/components/candidate/MockInterview.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InterviewStart from '../interview/InterviewStart';
import InterviewSession from '../interview/InterviewSession';
import InterviewResults from '../interview/InterviewResults';
import { useInterview } from '../../hooks/useInterview';

export default function MockInterview() {
  const navigate = useNavigate();
  const interview = useInterview();
  const [interviewPhase, setInterviewPhase] = useState('start'); // 'start', 'session', 'results'
  const [savedResults, setSavedResults] = useState(null);
  
  // No need for session storage hack anymore
  
  // Handle interview start with questionCount
  const handleInterviewStart = async (interviewType, questionCount) => {
    const success = await interview.startInterview(interviewType, questionCount);
    if (success) {
      setInterviewPhase('session');
    }
  };

  // Handle interview completion
  const handleInterviewComplete = async () => {
    await interview.completeInterview();
    
    // Properly transition to results phase
    // This will unmount WebcamRecorder completely
    setInterviewPhase('results');
  };

  // Handle restart
  const handleRestart = () => {
    interview.resetInterview();
    setInterviewPhase('start');
  };

  // Render different phases
  if (interviewPhase === 'start') {
    return (
      <InterviewStart 
        onStart={handleInterviewStart}
        isLoading={interview.isLoading}
      />
    );
  }
  
  if (interviewPhase === 'session') {
    return (
      <InterviewSession 
        interview={interview}
        onComplete={handleInterviewComplete}
      />
    );
  }
  
  if (interviewPhase === 'results') {
    return (
      <InterviewResults 
        results={savedResults || interview.results}
        onRestart={handleRestart}
      />
    );
  }

  return null;
}