// src/components/hr/CandidateManagement.jsx
export default function CandidateManagement() {
  return (
    <div>
      <h2>👥 Candidate Management</h2>
      <div style={{ marginBottom: 20 }}>
        <input 
          type="text" 
          placeholder="Search candidates..."
          style={{ width: '70%', padding: '10px', marginRight: '10px' }}
        />
        <select style={{ padding: '10px' }}>
          <option>All Positions</option>
          <option>Senior Developer</option>
          <option>Marketing Manager</option>
        </select>
      </div>
      
      <div>
        <h3>Pending Reviews</h3>
        <p style={{ color: '#6c757d' }}>No candidates pending review. All caught up! 🎉</p>
        
        <button style={{ 
          padding: '12px 24px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: 5,
          marginTop: 10
        }}>
          Start AI-Powered Screening
        </button>
      </div>
    </div>
  );
}