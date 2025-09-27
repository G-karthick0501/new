import { useRef, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';


const Timer = ({ isRecording }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
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

export default function WebcamRecorder({ isRecording, onFrameCaptured }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [model, setModel] = useState(null);

  // Load TF.js FER model once
  useEffect(() => {
    const loadModel = async () => {
      const loadedModel = await tf.loadLayersModel('/tfjs_model/model.json');
      setModel(loadedModel);
    };
    loadModel();
  }, []);

  useEffect(() => {
    let interval;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        // Capture frames periodically
        interval = setInterval(() => {
          if (videoRef.current && model && onFrameCaptured) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Send imageData to parent for preprocessing + prediction
            onFrameCaptured(imageData);
          }
        }, 1000); // 1 frame per second
      } catch (err) {
        console.error('Error accessing camera', err);
      }
    };

    if (isRecording) startCamera();
    else {
      // Stop camera
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
  }, [isRecording, model, onFrameCaptured]);

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
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
    }}>
      <video ref={videoRef} autoPlay muted style={{ width: '100%', display: 'block' }} />
      <Timer isRecording={isRecording} />
    </div>
  );
}