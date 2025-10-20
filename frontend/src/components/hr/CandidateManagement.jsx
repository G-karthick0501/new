import { useState, useEffect } from 'react';
import { downloadFile } from '../../utils/downloadHelper';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CandidateManagement() {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    fetchApplications();
  }, []);

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

  const updateStatus = async (appId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchApplications();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  // 🗑️ DELETE application
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
      <h2>👥 Applications ({applications.length})</h2>

      {applications.length === 0 ? (
        <p>No applications yet</p>
      ) : (
        <div style={{ display: 'grid', gap: 15 }}>
          {applications.map(app => (
            <div key={app._id} style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3>{app.candidateId?.name}</h3>
                  <p><strong>Email:</strong> {app.candidateId?.email}</p>
                  <p><strong>Job:</strong> {app.jobId?.title}</p>

                  {/* Resume download button */}
                  <p>
                    <strong>Resume:</strong>
                    <button
                      onClick={() =>
                        downloadFile(
                          `${API_BASE}/api/applications/${app._id}/download-resume`,
                          app.resumeFileName || 'resume.pdf'
                        )
                      }
                      style={{
                        marginLeft: 10,
                        padding: '5px 10px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: 5,
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      📥 Download
                    </button>
                  </p>

                  {app.coverLetter && <p><strong>Cover Letter:</strong> {app.coverLetter}</p>}
                  <p><strong>Applied:</strong> {new Date(app.createdAt).toLocaleDateString()}</p>
                </div>

                <div>
                  <select
                    value={app.status}
                    onChange={(e) => updateStatus(app._id, e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 5, marginBottom: 10 }}
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="rejected">Rejected</option>
                    <option value="test_sent">Test Sent</option>
                  </select>

                  <button
                    onClick={() => deleteApplication(app._id)}
                    style={{
                      display: 'block',
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
