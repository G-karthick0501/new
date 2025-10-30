// WebcamIframe.jsx - Iframe-based camera component for proper cleanup
import { useRef, useEffect, useState, memo } from 'react';

// Timer component that persists across iframe recreations
const Timer = ({ startTime }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'absolute',
      top: 10,
      right: 10,
      background: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '5px 10px',
      borderRadius: '5px',
      fontFamily: 'monospace',
      fontSize: '14px',
      zIndex: 10
    }}>
      {formatTime(elapsedTime)}
    </div>
  );
};

// Create iframe HTML - extracted as function to be called once
function createIframeHTML(emotionServiceUrl) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; overflow: hidden; background: #000; }
    video { width: 100%; height: 100%; object-fit: cover; }
    canvas { display: none; }
    .emotion {
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 5px 10px;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <video id="video" autoplay playsinline muted></video>
  <canvas id="canvas"></canvas>
  <div class="emotion" id="emotion">Initializing...</div>
  
  <script>
    let stream = null;
    let emotionInterval = null;
    let isAnalyzing = false;
    const EMOTION_SERVICE_URL = '${emotionServiceUrl}';

    // Start camera
    async function startCamera() {
      try {
        console.log('🎥 [IFRAME] Starting camera...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false  // Only video needed for emotion detection, no audio to prevent echo
        });
        
        const video = document.getElementById('video');
        video.srcObject = stream;
        video.muted = true;  // Extra safety: mute video element to prevent any audio playback
        
        console.log('✅ [IFRAME] Camera started');
        
        // Start emotion analysis
        startEmotionAnalysis();
      } catch (err) {
        console.error('❌ [IFRAME] Camera failed:', err);
        window.parent.postMessage({
          type: 'camera-error',
          data: err.message
        }, '*');
      }
    }

    // Emotion analysis
    function startEmotionAnalysis() {
      emotionInterval = setInterval(async () => {
        if (isAnalyzing) return;
        
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        
        if (video.readyState !== 4) return;
        
        try {
          isAnalyzing = true;
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob(async (blob) => {
            if (!blob) {
              isAnalyzing = false;
              return;
            }
            
            const formData = new FormData();
            formData.append('file', blob, 'frame.jpg');
            
            try {
              const response = await fetch(EMOTION_SERVICE_URL + '/analyze-emotion', {
                method: 'POST',
                body: formData
              });
              
              if (response.ok) {
                const data = await response.json();
                if (data.success) {
                  document.getElementById('emotion').textContent = 
                    data.dominant_emotion + ' ' + Math.round(data.confidence) + '%';
                  
                  // Send to parent
                  window.parent.postMessage({
                    type: 'emotion-data',
                    data: [{
                      timestamp: Date.now(),
                      dominant_emotion: data.dominant_emotion,
                      confidence: data.confidence,
                      all_emotions: data.all_emotions
                    }]
                  }, '*');
                }
              }
            } catch (err) {
              console.error('[IFRAME] Analysis error:', err);
            } finally {
              isAnalyzing = false;
            }
          }, 'image/jpeg', 0.8);
        } catch (err) {
          console.error('[IFRAME] Capture error:', err);
          isAnalyzing = false;
        }
      }, 500); // Process every 0.5 seconds for better real-time tracking
    }

    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
      console.log('🛑 [IFRAME] Cleaning up...');
      if (emotionInterval) clearInterval(emotionInterval);
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('[IFRAME] Stopped', track.kind, 'track');
        });
      }
    });

    // Start immediately
    startCamera();
  </script>
</body>
</html>
  `;
}

const WebcamIframe = memo(function WebcamIframe({ isRecording, onEmotionData }) {
  const iframeRef = useRef(null);
  const [interviewStartTime] = useState(Date.now()); // Persists throughout interview
  const blobUrlRef = useRef(null);
  const iframeHTMLRef = useRef(null);

  // Create iframe HTML only once
  if (!iframeHTMLRef.current) {
    iframeHTMLRef.current = createIframeHTML(import.meta.env.VITE_VIDEO_EMOTION_URL);
  }

  // Cleanup when component unmounts (interview ends)
  useEffect(() => {
    return () => {
      console.log('🧹 COMPONENT UNMOUNTING - DESTROYING IFRAME');
      
      // Cleanup blob URLs
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.origin.includes('localhost:5173') && !event.origin.includes('.github.dev')) return;
      
      const { type, data } = event.data;
      
      if (type === 'emotion-data' && onEmotionData) {
        onEmotionData(data);
      } else if (type === 'camera-error') {
        console.error('Camera error in iframe:', data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onEmotionData]);

  if (!isRecording) {
    // Return null to completely remove iframe from DOM
    // This ensures camera permissions are fully released
    console.log('📷 Camera OFF - iframe removed from DOM');
    return null;
  }

  // Create blob URL only once, store in ref - use iframeHTMLRef which was created once
  if (!blobUrlRef.current && isRecording) {
    const blob = new Blob([iframeHTMLRef.current], { type: 'text/html' });
    blobUrlRef.current = URL.createObjectURL(blob);
    console.log('📦 Created blob URL for iframe:', blobUrlRef.current);
  }

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, width: 280, zIndex: 1000 }}>
      {isRecording && blobUrlRef.current && (
        <>
          {/* Timer component persists throughout interview */}
          <Timer startTime={interviewStartTime} />
          
          {/* Iframe persists throughout entire interview - no key prop means no recreation */}
          <iframe
            ref={iframeRef}
            src={blobUrlRef.current}
            style={{
              width: '100%',
              height: 210,
              border: 'none',
              borderRadius: 8
            }}
            allow="camera *;microphone *;autoplay"
            sandbox="allow-same-origin allow-scripts"
            title="Webcam"
          />
        </>
      )}
    </div>
  );
});

export default WebcamIframe;
