import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function JobApplications() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/jobs`);
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      setJobs([]);
    }
  };

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      setApplications([]);
    }
  };

  const handleApply = async (jobId) => {
    if (!resumeFile) {
      alert('Please select a resume file');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('coverLetter', coverLetter);

      const response = await fetch(`${API_BASE}/api/applications/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        alert('Application submitted! Calculating match score...');
        setCoverLetter('');
        setResumeFile(null);
        setSelectedJob(null);
        fetchApplications();
      } else {
        alert('Application failed');
      }
    } catch (error) {
      console.error('Failed to apply:', error);
    }
  };

  const hasApplied = (jobId) => {
    if (!Array.isArray(applications)) return false;
    return applications.some(app => app?.jobId?._id === jobId);
  };

  const deleteApplication = async (appId) => {
    if (!confirm('Delete this application?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/api/applications/${appId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchApplications();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#ffc107',
      'reviewed': '#17a2b8',
      'shortlisted': '#28a745',
      'rejected': '#dc3545',
      'test_sent': '#007bff'
    };
    return colors[status] || '#6c757d';
  };

  return (
    <div>
      <h2>🔍 Available Jobs</h2>

      <div style={{ display: 'grid', gap: 20 }}>
        {jobs.map(job => (
          <div key={job._id} style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
            <h3>{job.title}</h3>
            <p>{job.description}</p>
            <p><strong>Location:</strong> {job.location} | <strong>Salary:</strong> {job.salary}</p>
            <p><strong>Skills:</strong> {Array.isArray(job.skills) ? job.skills.join(', ') : job.skills}</p>

            <div style={{ marginTop: 15, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {job.jdFileName && (
                <a
                  href={`${API_BASE}/api/jobs/${job._id}/download-jd`}
                  download
                  style={{
                    padding: '8px 16px',
                    background: '#17a2b8',
                    color: 'white',
                    borderRadius: 5,
                    textDecoration: 'none'
                  }}
                >
                  📄 Download JD
                </a>
              )}

              {hasApplied(job._id) ? (
                <span style={{ color: 'green', fontWeight: 'bold', padding: '8px' }}>
                  ✅ Applied
                </span>
              ) : (
                <button
                  onClick={() => setSelectedJob(selectedJob === job._id ? null : job._id)}
                  style={{
                    padding: '8px 16px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: 5,
                    cursor: 'pointer'
                  }}
                >
                  {selectedJob === job._id ? 'Cancel' : 'Apply'}
                </button>
              )}
            </div>

            {selectedJob === job._id && (
              <div style={{ marginTop: 20, padding: 15, background: '#f8f9fa', borderRadius: 5 }}>
                <h4>Submit Application</h4>
                <div style={{ marginBottom: 10 }}>
                  <label>Resume (PDF):</label>
                  <input type="file" accept=".pdf" onChange={(e) => setResumeFile(e.target.files[0])} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label>Cover Letter:</label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={4}
                    style={{ width: '100%', padding: 8 }}
                  />
                </div>
                <button
                  onClick={() => handleApply(job._id)}
                  style={{
                    padding: '10px 20px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: 5,
                    cursor: 'pointer'
                  }}
                >
                  Submit Application
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 40 }}>📋 My Applications</h2>
      <div style={{ display: 'grid', gap: 15 }}>
        {applications.map(app => (
          <div key={app._id} style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3>{app.jobId?.title}</h3>
                <p><strong>Applied:</strong> {new Date(app.createdAt).toLocaleDateString()}</p>
                
                {/* Match Score */}
                {app.matchScore !== undefined && (
                  <div style={{ 
                    marginTop: 10,
                    padding: '8px 12px',
                    background: app.matchScore >= 70 ? '#d4edda' : app.matchScore >= 50 ? '#fff3cd' : '#f8d7da',
                    border: `1px solid ${app.matchScore >= 70 ? '#c3e6cb' : app.matchScore >= 50 ? '#ffeaa7' : '#f5c6cb'}`,
                    borderRadius: 5,
                    display: 'inline-block'
                  }}>
                    <strong>🎯 Match Score:</strong> {app.matchScore}%
                  </div>
                )}
                
                {/* Status Badge */}
                <div style={{
                  marginTop: 10,
                  padding: '6px 12px',
                  background: getStatusColor(app.status),
                  color: 'white',
                  borderRadius: 5,
                  display: 'inline-block',
                  fontSize: 12,
                  textTransform: 'uppercase'
                }}>
                  {app.status}
                </div>
              </div>

              <button
                onClick={() => deleteApplication(app._id)}
                style={{
                  padding: '8px 16px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: 5,
                  cursor: 'pointer'
                }}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}