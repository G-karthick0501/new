// frontend/src/components/interview/InterviewSession.jsx
import { useState } from 'react';
import QuestionDisplay from './QuestionDisplay';
import ResponseInput from './ResponseInput';
import WebcamRecorder from './WebcamRecorder';

export default function InterviewSession({ interview, onComplete }) {
  const [isRecording, setIsRecording] = useState(true); // Start recording at session start

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

  const handleResponseSubmit = async (response, timeSpent) => {
    await interview.submitResponse(response, timeSpent);

    if (isLastQuestion) {
      setIsRecording(false); // Stop webcam when interview ends
      onComplete();
    } else {
      interview.nextQuestion();
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      {/* Webcam + Timer */}
      <WebcamRecorder isRecording={isRecording} />

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
