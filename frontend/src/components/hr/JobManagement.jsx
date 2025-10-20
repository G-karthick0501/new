// src/components/hr/JobManagement.jsx
export default function JobManagement() {
  return (
    <div>
      <h2>💼 Job Post Management</h2>
      <button style={{ 
        padding: '12px 24px', 
        backgroundColor: '#28a745', 
        color: 'white', 
        border: 'none', 
        borderRadius: 5,
        marginBottom: 20
      }}>
        + Create New Job Post
      </button>
      
      <div>
        <h3>Active Job Posts</h3>
        <p style={{ color: '#6c757d' }}>No active job posts. Create your first job posting!</p>
      </div>
    </div>
  );
}