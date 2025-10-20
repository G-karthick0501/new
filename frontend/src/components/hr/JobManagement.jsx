import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function JobManagement() {
  const [jobs, setJobs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: '',
    skills: '',
    location: '',
    salary: '',
    deadline: ''
  });
  const [jdFile, setJdFile] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/jobs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setJobs(data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  // ✅ Create job (with JD upload)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (jdFile) formData.append('jdFile', jdFile);

      await fetch(`${API_BASE}/api/jobs`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      setForm({
        title: '',
        description: '',
        requirements: '',
        skills: '',
        location: '',
        salary: '',
        deadline: ''
      });
      setJdFile(null);
      setShowForm(false);
      fetchJobs();
    } catch (error) {
      console.error('Failed to create job:', error);
    }
  };

  // 🗑️ Delete job
  const deleteJob = async (jobId) => {
    if (!confirm('Delete this job post?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchJobs();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2>💼 Job Posts</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: 5
          }}
        >
          {showForm ? 'Cancel' : '+ Create Job'}
        </button>
      </div>

      {/* Job Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{ marginBottom: 30, padding: 20, border: '1px solid #ddd', borderRadius: 8 }}
        >
          <input
            placeholder="Job Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={{ width: '100%', padding: 10, marginBottom: 10 }}
            required
          />
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setJdFile(e.target.files[0])}
            style={{ width: '100%', padding: 10, marginBottom: 10 }}
          />
          <small style={{ display: 'block', marginBottom: 10, color: '#666' }}>
            Upload Job Description PDF (optional)
          </small>
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            style={{ width: '100%', padding: 10, marginBottom: 10, minHeight: 100 }}
            required
          />
          <textarea
            placeholder="Requirements"
            value={form.requirements}
            onChange={(e) => setForm({ ...form, requirements: e.target.value })}
            style={{ width: '100%', padding: 10, marginBottom: 10 }}
          />
          <input
            placeholder="Skills (comma-separated)"
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            style={{ width: '100%', padding: 10, marginBottom: 10 }}
          />
          <input
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            style={{ width: '100%', padding: 10, marginBottom: 10 }}
          />
          <input
            placeholder="Salary Range"
            value={form.salary}
            onChange={(e) => setForm({ ...form, salary: e.target.value })}
            style={{ width: '100%', padding: 10, marginBottom: 10 }}
          />
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            style={{ width: '100%', padding: 10, marginBottom: 10 }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 5
            }}
          >
            Create Job
          </button>
        </form>
      )}

      {/* Job List */}
      <div>
        {jobs.length === 0 ? (
          <p>No jobs posted yet</p>
        ) : (
          jobs.map((job) => (
            <div
              key={job._id}
              style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8, marginBottom: 15 }}
            >
              <h3>{job.title}</h3>
              <p>{job.description}</p>
              <p>
                <strong>Location:</strong> {job.location} | <strong>Salary:</strong> {job.salary}
              </p>
              <p>
                <strong>Skills:</strong>{' '}
                {Array.isArray(job.skills) ? job.skills.join(', ') : job.skills}
              </p>

              <span
                style={{
                  padding: '4px 12px',
                  background: job.status === 'active' ? '#28a745' : '#6c757d',
                  color: 'white',
                  borderRadius: 12,
                  fontSize: 12
                }}
              >
                {job.status}
              </span>

              {/* 📄 JD download + 🗑️ Delete buttons */}
              <div style={{ marginTop: 10 }}>
                {job.jdFileName && (
                  <a
                    href={`${API_BASE}/api/jobs/${job._id}/download-jd`}
                    download
                    style={{
                      marginRight: 10,
                      padding: '6px 12px',
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: 5,
                      textDecoration: 'none',
                      fontSize: 12
                    }}
                  >
                    📄 Download JD
                  </a>
                )}

                <button
                  onClick={() => deleteJob(job._id)}
                  style={{
                    padding: '6px 12px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: 5,
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
