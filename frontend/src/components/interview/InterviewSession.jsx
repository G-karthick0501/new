// frontend/src/components/interview/InterviewSession.jsx
import { useState } from 'react';
import QuestionDisplay from './QuestionDisplay';
import ResponseInput from './ResponseInput';
import WebcamRecorder from './WebcamRecorder';

export default function InterviewSession({ interview, onComplete }) {
  const [isRecording, setIsRecording] = useState(true); // Start recording at session start
  const [emotionData, setEmotionData] = useState({});

  const {
    currentQuestion,
    currentQuestionIndex,
    questions,
    responses,
    progress,
    isLastQuestion,
    isLoading
  } = interview;

  if (!currentQuestion) {
    return <div>Loading question...</div>;
  }

  // Handle emotion data from webcam
  const handleEmotionData = (emotionHistory) => {
    setEmotionData(prev => ({
      ...prev,
      [currentQuestionIndex]: emotionHistory
    }));
  };

  const generateEmotionSummary = async (emotionHistory) => {
    try {
      const response = await fetch('http://localhost:8001/emotion-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emotion_history: emotionHistory })
      });
      
      const data = await response.json();
      if (data.success) {
        console.log('📊 Emotion Summary:', data.summary);
        // Store summary for final report
        interview.emotionSummary = data.summary;
      }
    } catch (err) {
      console.error('Failed to generate emotion summary:', err);
    }
  };

  const handleResponseSubmit = async (response, timeSpent) => {
    // Include emotion data for current question
    const questionEmotionData = emotionData[currentQuestionIndex] || [];
    
    // You can send emotion data along with response if needed
    console.log('Emotion data for question', currentQuestionIndex, questionEmotionData);
    
    await interview.submitResponse(response, timeSpent);

    if (isLastQuestion) {
      setIsRecording(false);
      
      // Generate emotion summary for entire interview
      const allEmotions = Object.values(emotionData).flat();
      if (allEmotions.length > 0) {
        await generateEmotionSummary(allEmotions);
      }
      
      onComplete();
    } else {
      interview.nextQuestion();
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      {/* Webcam + Emotion Analysis */}
      <WebcamRecorder 
        isRecording={isRecording} 
        onEmotionData={handleEmotionData}
      />

      {/* Progress Bar */}
      <div style={{ marginBottom: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 'bold' }}>Interview Progress</span>
          <span style={{ fontSize: 14, color: '#666' }}>{Math.round(progress)}% Complete</span>
        </div>
        <div style={{ width: '100%', height: 8, backgroundColor: '#e9ecef', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#007bff', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* Question Display */}
      <QuestionDisplay
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
      />

      {/* Response Input */}
      <ResponseInput
        currentResponse={responses[currentQuestionIndex] || ''}
        onResponseChange={() => {}}
        onSubmit={handleResponseSubmit}
        isLastQuestion={isLastQuestion}
        isLoading={isLoading}
        questionIndex={currentQuestionIndex}
      />

      {/* Emotion Stats for Current Question */}
      {emotionData[currentQuestionIndex] && emotionData[currentQuestionIndex].length > 0 && (
        <div style={{
          marginTop: 20,
          padding: 15,
          backgroundColor: '#f8f9fa',
          borderRadius: 5,
          fontSize: 14
        }}>
          <strong>📊 Emotion Tracking:</strong>
          <div style={{ marginTop: 8 }}>
            Frames captured: {emotionData[currentQuestionIndex].length}
          </div>
        </div>
      )}

      {/* Tips / Help */}
      <div style={{
        marginTop: 20,
        padding: 15,
        backgroundColor: '#e8f4fd',
        borderRadius: 5,
        fontSize: 14
      }}>
        <strong>💡 Tips:</strong>
        <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
          <li>Be specific and provide examples when possible</li>
          <li>Structure your answer with clear beginning, middle, and end</li>
          <li>For behavioral questions, use the STAR method (Situation, Task, Action, Result)</li>
        </ul>
      </div>
    </div>
  );
}
