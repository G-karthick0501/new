// src/components/candidate/JobApplications.jsx
export default function JobApplications() {
  return (
    <div>
      <h2>Job Applications</h2>
      <div style={{ marginBottom: 20 }}>
        <input 
          type="text" 
          placeholder="Search jobs by title, company, or keyword..."
          style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: 5 }}
        />
      </div>
      <div>
        <h3>Your Applications</h3>
        <p style={{ color: '#6c757d' }}>No applications yet. Start applying to jobs that match your profile!</p>
      </div>
    </div>
  );
}