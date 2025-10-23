// frontend/src/components/interview/ResponseInput.jsx - UPDATED with API_BASE + Speech-to-Text
import { useState, useEffect, useRef } from 'react';

const API_BASE = "http://localhost:5000/api"; // ✅ Centralized API base

export default function ResponseInput({ 
  currentResponse, 
  onResponseChange, 
  onSubmit, 
  isLastQuestion,
  isLoading,
  questionIndex 
}) {
  const [response, setResponse] = useState('');
  const [startTime] = useState(Date.now());
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Reset textarea when question changes
  useEffect(() => {
    setResponse(currentResponse || '');
  }, [currentResponse, questionIndex]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start/stop recording
  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          setIsTranscribing(true);
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioChunksRef.current = [];

          // Stop timer
          clearInterval(recordingTimerRef.current);
          setRecordingTime(0);

          // Send blob to backend
          const formData = new FormData();
          formData.append("file", blob, "response.webm");

          try {
            const res = await fetch(`http://localhost:8001/transcribe`, {  // ✅ interview-analyzer port
              method: "POST",
              body: formData
            });
            const data = await res.json();
            
            if (data.success && data.transcription) {
              const transcribedText = data.transcription.cleaned_text || data.transcription.raw_text;
              setResponse((prev) => (prev ? prev + " " : "") + transcribedText);
              onResponseChange((response || "") + " " + transcribedText);
            } else {
              alert("Transcription failed: " + (data.error || "Unknown error"));
            }
          } catch (err) {
            console.error("❌ Transcription failed:", err);
            alert("Failed to transcribe audio. Please try again.");
          } finally {
            setIsTranscribing(false);
          }
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
        
        // Start timer
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
        
      } catch (err) {
        console.error("Mic access denied:", err);
        alert("Microphone permission required for speech-to-text");
      }
    } else {
      if (mediaRecorder) {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      }
    }
  };

  const handleSubmit = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    onSubmit(response, timeSpent);
    setResponse('');
  };

  return (
    <div>
      <div style={{ marginBottom: 15 }}>
        <label style={{ 
          display: 'block', 
          marginBottom: 8,
          fontWeight: 'bold' 
        }}>
          Your Response:
        </label>
        
        <textarea
          value={response}
          onChange={(e) => {
            setResponse(e.target.value);
            onResponseChange(e.target.value);
          }}
          placeholder="Type or speak your answer here..."
          style={{
            width: '100%',
            minHeight: 150,
            padding: 12,
            border: '1px solid #ddd',
            borderRadius: 5,
            fontSize: 14,
            lineHeight: 1.5,
            resize: 'vertical'
          }}
        />
      </div>

      {/* Mic Button */}
      <div style={{ marginBottom: 15 }}>
        <button
          onClick={toggleRecording}
          disabled={isTranscribing}
          style={{
            padding: '10px 20px',
            backgroundColor: isRecording ? '#dc3545' : (isTranscribing ? '#ffc107' : '#6c757d'),
            color: 'white',
            border: 'none',
            borderRadius: 5,
            cursor: isTranscribing ? 'not-allowed' : 'pointer',
            fontSize: 14,
            opacity: isTranscribing ? 0.7 : 1
          }}
        >
          {isTranscribing ? 'Transcribing... ⏳' : 
           isRecording ? `Stop Recording 🔴 ${formatTime(recordingTime)}` : 
           'Start Recording 🎤'}
        </button>
        {isTranscribing && (
          <span style={{ marginLeft: 10, color: '#666', fontSize: 14 }}>
            Please wait while we transcribe your audio...
          </span>
        )}
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center' 
      }}>
        <div style={{ fontSize: 14, color: '#666' }}>
          {response.length} characters
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={isLoading || !response.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: isLastQuestion ? '#28a745' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 5,
            cursor: (!response.trim() || isLoading) ? 'not-allowed' : 'pointer',
            opacity: (!response.trim() || isLoading) ? 0.6 : 1,
            fontSize: 16
          }}
        >
          {isLastQuestion ? 'Complete Interview' : 'Next Question'}
        </button>
      </div>
    </div>
  );
}
