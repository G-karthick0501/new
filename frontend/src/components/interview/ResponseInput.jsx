// frontend/src/components/interview/ResponseInput.jsx - UPDATED with API_BASE + Speech-to-Text
import { useState, useEffect, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL + "/api"; // ✅ Centralized API base

export default function ResponseInput({ 
  currentResponse, 
  onResponseChange, 
  onSubmit, 
  isLastQuestion,
  isLoading,
  questionIndex,
  currentAudioEmotion 
}) {
  const [response, setResponse] = useState('');
  const [startTime] = useState(Date.now());
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioEmotion, setAudioEmotion] = useState(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Reset textarea and audio emotion when question changes
  useEffect(() => {
    setResponse(currentResponse || '');
    // Clear previous audio emotion data when moving to next question
    setAudioEmotion(null);
  }, [currentResponse, questionIndex]);

  // Update audio emotion from real-time data during recording
  useEffect(() => {
    if (currentAudioEmotion && isRecording) {
      setAudioEmotion({
        emotion: currentAudioEmotion.emotion,
        confidence: currentAudioEmotion.confidence,
        features: currentAudioEmotion.features
      });
    }
    // Removed: Don't clear audio emotion when recording stops
    // Audio emotion should persist after recording completes
  }, [currentAudioEmotion, isRecording]);

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

  // Get emotion color
  const getEmotionColor = (emotion) => {
    const colors = {
      happy: '#28a745',
      sad: '#6c757d',
      angry: '#dc3545',
      fear: '#fd7e14',
      surprise: '#20c997',
      disgust: '#6f42c1',
      neutral: '#17a2b8'
    };
    return colors[emotion] || '#6c757d';
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

          // Send blob to BOTH transcription AND emotion services in parallel
          const formData = new FormData();
          formData.append("file", blob, "response.webm");

          const emotionFormData = new FormData();
          emotionFormData.append("file", blob, "response.webm");

          try {
            // Parallel requests: Transcription + Audio Emotion
            const [transcriptionRes, emotionRes] = await Promise.all([
              fetch(import.meta.env.VITE_TRANSCRIPTION_URL + '/transcribe', {  // Whisper transcription
                method: "POST",
                body: formData
              }),
              fetch(import.meta.env.VITE_AUDIO_EMOTION_URL + '/analyze-audio', {  // Audio emotion - WORKING
                method: "POST",
                body: emotionFormData
              }).catch(err => {
                console.warn("⚠️ Audio emotion service unavailable:", err);
                return null;
              })
            ]);
            
            const transcriptionData = await transcriptionRes.json();
            
            // Handle transcription
            if (transcriptionData.success && transcriptionData.transcription) {
              const transcribedText = transcriptionData.transcription.cleaned_text || transcriptionData.transcription.raw_text;
              setResponse((prev) => (prev ? prev + " " : "") + transcribedText);
              onResponseChange((response || "") + " " + transcribedText);
            } else {
              alert("Transcription failed: " + (transcriptionData.error || "Unknown error"));
            }

            // Handle audio emotion (optional - doesn't block if unavailable)
            console.log("🎵 Audio emotion response:", emotionRes);
            if (emotionRes && emotionRes.ok) {
              const emotionData = await emotionRes.json();
              console.log("🎵 Audio emotion data:", emotionData);
              if (emotionData && emotionData.emotion) {
                const audioEmotionData = {
                  emotion: emotionData.emotion,
                  confidence: Math.round(emotionData.confidence * 100), // Convert to percentage
                  features: {
                    processing_time_seconds: emotionData.processing_time_seconds,
                    model_type: emotionData.model_type,
                    all_emotions: emotionData.all_emotions
                  }
                };
                setAudioEmotion(audioEmotionData);
                console.log("🎵 Audio emotion detected:", audioEmotionData.emotion, 
                           "- Confidence:", audioEmotionData.confidence + "%");
                if (audioEmotionData.features) {
                  console.log("📊 Audio features:", audioEmotionData.features);
                }
              }
            } else {
              setAudioEmotion(null);
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
        
        // Reset and start timer from 0
        setRecordingTime(0);
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
        
        // Stop and clear timer
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
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
          {isTranscribing ? 'Transcribing Voice... ⏳' : 
           isRecording ? `Stop Voice Recording 🔴 ${formatTime(recordingTime)}` : 
           'Start Voice Recording 🎤'}
        </button>
        {isTranscribing && (
          <span style={{ marginLeft: 10, color: '#666', fontSize: 14 }}>
            Please wait while we transcribe your audio...
          </span>
        )}
        
        {/* Audio Emotion Display */}
        {audioEmotion && (
          <div style={{
            marginTop: 10,
            padding: '8px 12px',
            backgroundColor: '#e8f4fd',
            border: '1px solid #bee5eb',
            borderRadius: 4,
            fontSize: 13
          }}>
            🎵 <strong>Audio Emotion:</strong> 
            <span style={{
              marginLeft: 5,
              padding: '2px 8px',
              backgroundColor: getEmotionColor(audioEmotion.emotion),
              color: 'white',
              borderRadius: 3,
              fontWeight: 'bold'
            }}>
              {audioEmotion.emotion.toUpperCase()}
            </span>
            <span style={{ marginLeft: 8, color: '#666' }}>
              ({audioEmotion.confidence}% confidence)
            </span>
            {audioEmotion.features && (
              <div style={{ marginTop: 5, fontSize: 11, color: '#666' }}>
                {audioEmotion.features.energy_mean !== undefined ? 
                  `Energy: ${(audioEmotion.features.energy_mean * 100).toFixed(1)}% | ` : ''}
                {audioEmotion.features.tempo_bpm ? 
                  `Tempo: ${audioEmotion.features.tempo_bpm} BPM | ` : ''}
                {audioEmotion.features.pitch_mean_hz ? 
                  `Pitch: ${audioEmotion.features.pitch_mean_hz.toFixed(0)} Hz` : ''}
                {audioEmotion.features.duration_seconds !== undefined ? 
                  `Duration: ${audioEmotion.features.duration_seconds}s` : ''}
                {audioEmotion.features.file_size_bytes ? 
                  `Size: ${audioEmotion.features.file_size_bytes} bytes` : ''}
              </div>
            )}
          </div>
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
