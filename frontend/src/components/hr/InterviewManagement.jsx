// src/components/hr/InterviewManagement.jsx
export default function InterviewManagement() {
  return (
    <div>
      <h2>🎤 Interview Management</h2>
      <div style={{ marginBottom: 20 }}>
        <h3>Today's Interviews</h3>
        <p style={{ color: '#6c757d' }}>No interviews scheduled for today.</p>
      </div>
      
      <div>
        <h3>AI Interview Analysis</h3>
        <p>Review AI-generated insights from recent interviews</p>
        <button style={{ 
          padding: '10px 20px', 
          backgroundColor: '#17a2b8', 
          color: 'white', 
          border: 'none', 
          borderRadius: 5 
        }}>
          View Analysis Reports
        </button>
      </div>
    </div>
  );
}