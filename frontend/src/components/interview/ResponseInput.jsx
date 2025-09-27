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
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const audioChunksRef = useRef([]);

  // Reset textarea when question changes
  useEffect(() => {
    setResponse(currentResponse || '');
  }, [currentResponse, questionIndex]);

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
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioChunksRef.current = [];

          // Send blob to backend
          const formData = new FormData();
          formData.append("file", blob, "response.webm");

          try {
            const res = await fetch(`${API_BASE}/resume/transcribe`, {  // ✅ Uses API_BASE
              method: "POST",
              body: formData
            });
            const data = await res.json();
            if (data.text) {
              setResponse((prev) => prev + " " + data.text);
              onResponseChange((response || "") + " " + data.text);
            }
          } catch (err) {
            console.error("❌ Transcription failed:", err);
          }
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
      } catch (err) {
        console.error("Mic access denied:", err);
        alert("Microphone permission required for speech-to-text");
      }
    } else {
      mediaRecorder.stop();
      setIsRecording(false);
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
          style={{
            padding: '10px 20px',
            backgroundColor: isRecording ? '#dc3545' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: 5,
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          {isRecording ? 'Stop Recording 🔴' : 'Start Recording 🎤'}
        </button>
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
