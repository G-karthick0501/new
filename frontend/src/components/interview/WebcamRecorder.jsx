// frontend/src/components/interview/WebcamRecorder.jsx
import { useRef, useState, useEffect } from 'react';

const Timer = ({ isRecording }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return <div className="timer">{formatTime(elapsedTime)}</div>;
};

export default function WebcamRecorder({ isRecording, onEmotionData }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const emotionIntervalRef = useRef(null);
  
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emotionHistory, setEmotionHistory] = useState([]);

  // Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera', err);
        alert('Camera access denied. Please enable camera permissions.');
      }
    };

    if (isRecording) {
      startCamera();
    } else {
      // Stop camera when not recording
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isRecording]);

  // Capture and analyze frames
  useEffect(() => {
    const captureAndAnalyze = async () => {
      if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

      try {
        setIsAnalyzing(true);

        // Create canvas and capture frame
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          if (!blob) {
            setIsAnalyzing(false);
            return;
          }

          const formData = new FormData();
          formData.append('file', blob, 'frame.jpg');

          console.log('📤 Sending frame to backend, size:', blob.size, 'bytes');

          try {
            const response = await fetch('http://localhost:8001/analyze-emotion', {
              method: 'POST',
              body: formData
            });

            console.log('📥 Response status:', response.status, response.statusText);

            if (!response.ok) {
              console.error('❌ HTTP error:', response.status);
              setIsAnalyzing(false);
              return;
            }

            const data = await response.json();
            console.log('📊 Emotion data received:', data);

            if (data.success) {
              console.log('✅ Emotion detected:', data.dominant_emotion, data.confidence);
              const emotionRecord = {
                timestamp: Date.now(),
                dominant_emotion: data.dominant_emotion,
                confidence: data.confidence,
                all_emotions: data.all_emotions
              };

              setCurrentEmotion(emotionRecord);
              
              // Add to history
              setEmotionHistory(prev => {
                const updated = [...prev, emotionRecord];
                console.log('📈 Emotion history updated, total frames:', updated.length);
                // Pass to parent component
                if (onEmotionData) {
                  onEmotionData(updated);
                }
                return updated;
              });
            } else {
              console.warn('⚠️ Analysis failed:', data.error);
            }
          } catch (err) {
            console.error('❌ Emotion analysis failed:', err);
            console.error('Error details:', err.message, err.stack);
          } finally {
            setIsAnalyzing(false);
          }
        }, 'image/jpeg', 0.8);

      } catch (err) {
        console.error('Error capturing frame:', err);
        setIsAnalyzing(false);
      }
    };

    if (isRecording) {
      // Analyze every 1 second (original was 0.5s, but backend needs more time)
      emotionIntervalRef.current = setInterval(captureAndAnalyze, 1000);
    } else {
      if (emotionIntervalRef.current) {
        clearInterval(emotionIntervalRef.current);
      }
    }

    return () => {
      if (emotionIntervalRef.current) {
        clearInterval(emotionIntervalRef.current);
      }
    };
  }, [isRecording, isAnalyzing, onEmotionData]);

  // Get emotion emoji
  const getEmotionEmoji = (emotion) => {
    const emojiMap = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      surprise: '😲',
      fear: '😨',
      disgust: '🤢',
      neutral: '😐',
      unknown: '❓'
    };
    return emojiMap[emotion] || '❓';
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '280px',
      zIndex: 1000,
      background: '#000',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      color: '#fff'
    }}>
      {/* Video Feed */}
      <div style={{ position: 'relative' }}>
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          style={{ width: '100%', display: 'block' }} 
        />
        
        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Emotion Overlay */}
        {currentEmotion && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>
              {getEmotionEmoji(currentEmotion.dominant_emotion)}
            </div>
            <div style={{ textTransform: 'capitalize' }}>
              {currentEmotion.dominant_emotion}
            </div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>
              {currentEmotion.confidence.toFixed(1)}%
            </div>
          </div>
        )}

        {/* Analyzing Indicator */}
        {isAnalyzing && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            background: 'rgba(255, 193, 7, 0.9)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#000'
          }}>
            Analyzing...
          </div>
        )}
      </div>

      {/* Timer */}
      <div style={{ 
        padding: '8px 12px', 
        background: '#1a1a1a',
        textAlign: 'center',
        fontWeight: 'bold'
      }}>
        <Timer isRecording={isRecording} />
      </div>

      {/* Emotion Details */}
      {currentEmotion && (
        <div style={{ 
          padding: '10px 12px', 
          fontSize: '11px',
          background: '#1a1a1a',
          maxHeight: '120px',
          overflowY: 'auto'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
            All Emotions:
          </div>
          {Object.entries(currentEmotion.all_emotions || {})
            .sort((a, b) => b[1] - a[1])
            .map(([emotion, score]) => (
              <div key={emotion} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '3px'
              }}>
                <span style={{ textTransform: 'capitalize' }}>{emotion}:</span>
                <span>{score.toFixed(1)}%</span>
              </div>
            ))}
        </div>
      )}

      {/* Emotion History Count */}
      <div style={{
        padding: '6px 12px',
        background: '#0d0d0d',
        fontSize: '10px',
        color: '#888',
        textAlign: 'center'
      }}>
        Frames analyzed: {emotionHistory.length}
      </div>
    </div>
  );
}
