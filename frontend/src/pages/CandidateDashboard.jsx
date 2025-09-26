// frontend/src/pages/CandidateDashboard.jsx - UPDATED

import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import ResumeOptimizer from "./candidate/ResumeOptimizer";
import CodeEditor from '../components/coding/CodeEditor';
import { codingService } from '../services/codingService';

import InterviewStart from '../components/interview/InterviewStart';
import InterviewSession from '../components/interview/InterviewSession';
import InterviewResults from '../components/interview/InterviewResults';
import { useInterview } from '../hooks/useInterview';

export default function CandidateDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const candidateFeatures = [
    { id: 'overview', label: 'Overview', description: 'Your application status and progress' },
    { id: 'resume', label: 'Resume Optimizer', description: 'AI-powered resume analysis and improvement' },
    { id: 'interview', label: 'Mock Interview', description: 'Practice interviews with AI feedback' },
    { id: 'coding', label: 'Coding Practice', description: 'Technical challenges and assessments' },
    { id: 'jobs', label: 'Job Applications', description: 'Browse and apply for positions' }
  ];

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 30,
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: 15
      }}>
        <div>
          <h1>Candidate Dashboard</h1>
          <p>Welcome back, <strong>{user?.name}</strong></p>
        </div>
        <button onClick={logout} style={{ 
          padding: '10px 20px', 
          backgroundColor: '#dc3545', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Logout
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        marginBottom: 30,
        borderBottom: '1px solid #ddd'
      }}>
        {candidateFeatures.map(feature => (
          <button
            key={feature.id}
            onClick={() => setActiveTab(feature.id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              backgroundColor: activeTab === feature.id ? '#007bff' : 'transparent',
              color: activeTab === feature.id ? 'white' : '#333',
              cursor: 'pointer',
              borderRadius: '5px 5px 0 0',
              marginRight: '5px'
            }}
          >
            {feature.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ minHeight: 400 }}>
        {activeTab === 'overview' && <CandidateOverview />}
        {activeTab === 'resume' && <ResumeOptimizer />}
        {activeTab === 'interview' && <MockInterview />}
        {activeTab === 'coding' && <CodingPractice />}
        {activeTab === 'jobs' && <JobApplications />}
      </div>
    </div>
  );
}

// Keep existing components for now (can be modularized later)
function CandidateOverview() {
  return (
    <div>
      <h2>Your Progress Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
        <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
          <h3>Applications</h3>
          <p style={{ fontSize: 24, margin: 0 }}>12 Active</p>
          <small>3 interviews pending</small>
        </div>
        <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
          <h3>Resume Score</h3>
          <p style={{ fontSize: 24, margin: 0, color: '#28a745' }}>85/100</p>
          <small>Good match for target roles</small>
        </div>
        <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
          <h3>Interview Practice</h3>
          <p style={{ fontSize: 24, margin: 0 }}>7 Sessions</p>
          <small>Average score: 78%</small>
        </div>
        <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
          <h3>Coding Challenges</h3>
          <p style={{ fontSize: 24, margin: 0 }}>15 Completed</p>
          <small>8 medium, 7 easy</small>
        </div>
      </div>
    </div>
  );
}

function MockInterview() {
  // ✅ ENHANCEMENT: Use interview hook
  const interview = useInterview();
  const [interviewPhase, setInterviewPhase] = useState('start'); // 'start', 'session', 'results'
  
  // ✅ ENHANCEMENT: Handle interview start with questionCount
  const handleInterviewStart = async (interviewType, questionCount) => {
    await interview.startInterview(interviewType, questionCount);
    if (interview.questions && interview.questions.length > 0) {
      setInterviewPhase('session');
    }
  };

  // ✅ ENHANCEMENT: Handle interview completion
  const handleInterviewComplete = async () => {
    await interview.completeInterview();
    setInterviewPhase('results');
  };

  // ✅ ENHANCEMENT: Handle restart
  const handleRestart = () => {
    interview.resetInterview();
    setInterviewPhase('start');
  };

  // ✅ ENHANCEMENT: Render different phases
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

function CodingPractice() {
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRunCode = async (sourceCode, languageId) => {
    try {
      setIsLoading(true);
      setOutput('Executing code...');
      
      // Submit code
      const submitResponse = await codingService.submitCode(sourceCode, languageId);
      
      if (!submitResponse.token) {
        setOutput('Error: Failed to submit code');
        return;
      }

      // Poll for results
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const results = await codingService.getSubmissionResults(submitResponse.token);
        
        if (results.status && results.status.id > 2) { // Status > 2 means completed
          const output = results.stdout || results.stderr || results.compile_output || 'No output';
          setOutput(`Status: ${results.status.description}\nOutput:\n${output}`);
          break;
        }
        
        attempts++;
      }
      
      if (attempts === maxAttempts) {
        setOutput('Timeout: Code execution took too long');
      }
      
    } catch (error) {
      setOutput('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Coding Practice Arena</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <h3>Code Editor</h3>
          <CodeEditor onRunCode={handleRunCode} />
        </div>
        
        <div>
          <h3>Output</h3>
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: 8, 
            padding: 15, 
            minHeight: 400, 
            backgroundColor: '#f8f9fa',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap'
          }}>
            {isLoading ? 'Executing...' : output || 'Run your code to see output here'}
          </div>
        </div>
      </div>
    </div>
  );
}

function JobApplications() {
  return (
    <div>
      <h2>Job Applications</h2>
      <div style={{ marginBottom: 20 }}>
        <input 
          type="text" 
          placeholder="Search jobs by title, company, or keyword..."
          style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: 5 }}
        />
      </div>
      <div>
        <h3>Your Applications</h3>
        <p style={{ color: '#6c757d' }}>No applications yet. Start applying to jobs that match your profile!</p>
      </div>
    </div>
  );
}