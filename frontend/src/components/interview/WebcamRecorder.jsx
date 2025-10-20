// frontend/src/components/interview/WebcamRecorder.jsx
import { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';

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

export default function WebcamRecorder({ isRecording }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [expressions, setExpressions] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceExpressionNet.loadFromUri('/models');
      setModelsLoaded(true);
      console.log('Face-api.js models loaded!');
    };
    loadModels();
  }, []);

  useEffect(() => {
    let interval;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        interval = setInterval(async () => {
          if (!videoRef.current.paused && modelsLoaded) {
            const detection = await faceapi
              .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
              .withFaceExpressions();

            if (detection) {
              setExpressions(detection.expressions);
            }
          }
        }, 500); // detect every 0.5s
      } catch (err) {
        console.error('Error accessing camera', err);
      }
    };

    if (isRecording) startCamera();
    else {
      // Stop camera when not recording
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      clearInterval(interval);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      clearInterval(interval);
    };
  }, [isRecording, modelsLoaded]);

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '240px',
      zIndex: 1000,
      background: '#000',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      color: '#fff',
      padding: '5px'
    }}>
      <video ref={videoRef} autoPlay muted style={{ width: '100%', display: 'block' }} />
      <Timer isRecording={isRecording} />

      <div style={{ marginTop: 5, fontSize: 12 }}>
        {expressions
          ? Object.entries(expressions).map(([emotion, score]) => (
              <div key={emotion}>{emotion}: {(score * 100).toFixed(1)}%</div>
            ))
          : 'Emotion: Detecting...'}
      </div>
    </div>
  );
}
