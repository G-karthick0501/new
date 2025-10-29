// src/components/candidate/MockInterview.jsx
import { useState } from 'react';
import InterviewStart from '../interview/InterviewStart';
import InterviewSession from '../interview/InterviewSession';
import InterviewResults from '../interview/InterviewResults';
import { useInterview } from '../../hooks/useInterview';

export default function MockInterview() {
  const interview = useInterview();
  const [interviewPhase, setInterviewPhase] = useState('start'); // 'start', 'session', 'results'
  
  // ✅ MODIFIED: Handle interview start with resume/JD
  const handleInterviewStart = async (interviewType, questionCount, resumeText, jdText) => {
    // Use dynamic endpoint if resume is provided
    if (resumeText) {
      await interview.startDynamicInterview(interviewType, questionCount, resumeText, jdText);
    } else {
      // Fallback to hardcoded (shouldn't happen with new flow)
      await interview.startInterview(interviewType, questionCount);
    }
    
    if (interview.questions && interview.questions.length > 0) {
      setInterviewPhase('session');
    }
  };

  // Handle interview completion
  const handleInterviewComplete = async () => {
    await interview.completeInterview();
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
        results={interview.results}
        onRestart={handleRestart}
      />
    );
  }

  return null;
}