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
      setJobs(data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setApplications(data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    }
  };

  const handleApply = async (jobId) => {
    try {
      if (!resumeFile) {
        alert('Please select a resume file');
        return;
      }

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
        alert('Application submitted!');
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
    return applications.some(app => app.jobId._id === jobId);
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

  return (
    <div>
      <h2>🔍 Available Jobs</h2>

      <div style={{ display: 'grid', gap: 20 }}>
        {jobs.map(job => (
          <div key={job._id} style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
            <h3>{job.title}</h3>
            <p>{job.description}</p>
            <p>
              <strong>Location:</strong> {job.location} | <strong>Salary:</strong> {job.salary}
            </p>
            <p>
              <strong>Skills:</strong>{' '}
              {Array.isArray(job.skills) ? job.skills.join(', ') : job.skills}
            </p>

            {job.jdFileName && (
              <a
                href={`${API_BASE}/api/jobs/${job._id}/download-jd`}
                download
                style={{
                  display: 'inline-block',
                  marginTop: 10,
                  padding: '8px 16px',
                  background: '#17a2b8',
                  color: 'white',
                  borderRadius: 5,
                  textDecoration: 'none'
                }}
              >
                📄 Download Job Description
              </a>
            )}

            {hasApplied(job._id) ? (
              <span style={{ color: 'green', fontWeight: 'bold', marginLeft: 15 }}>
                ✅ Applied
              </span>
            ) : selectedJob === job._id ? (
              <div style={{ marginTop: 15 }}>
                <input
                  type="file"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  style={{ width: '100%', padding: 10, marginBottom: 10 }}
                />

                <textarea
                  placeholder="Cover Letter (optional)"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  style={{ width: '100%', padding: 10, minHeight: 100, marginBottom: 10 }}
                />

                <button
                  onClick={() => handleApply(job._id)}
                  style={{
                    padding: '10px 20px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: 5,
                    marginRight: 10
                  }}
                >
                  Submit Application
                </button>
                <button
                  onClick={() => setSelectedJob(null)}
                  style={{
                    padding: '10px 20px',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: 5
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSelectedJob(job._id)}
                style={{
                  padding: '10px 20px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: 5,
                  marginTop: 10
                }}
              >
                Apply Now
              </button>
            )}
          </div>
        ))}
      </div>

      {applications.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h3>My Applications</h3>

          {applications.map(app => (
            <div
              key={app._id}
              style={{
                padding: 15,
                border: '1px solid #ddd',
                borderRadius: 8,
                marginBottom: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <strong>{app.jobId.title}</strong>
                <span
                  style={{
                    marginLeft: 15,
                    padding: '4px 12px',
                    background: app.status === 'pending' ? '#ffc107' : '#28a745',
                    color: 'white',
                    borderRadius: 12,
                    fontSize: 12
                  }}
                >
                  {app.status}
                </span>
              </div>

              <button
                onClick={() => deleteApplication(app._id)}
                style={{
                  padding: '6px 12px',
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
          ))}
        </div>
      )}
    </div>
  );
}
