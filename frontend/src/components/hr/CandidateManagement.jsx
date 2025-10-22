// frontend/src/components/hr/CandidateManagement.jsx
// FIXED VERSION - Corrected status dropdown options

import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CandidateManagement() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setApplications(data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (appId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        alert('✅ Status updated! Notification sent to candidate.');
        fetchApplications();
      } else {
        const error = await res.json();
        alert('❌ Failed to update: ' + error.msg);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('❌ Update failed');
    }
  };

  const deleteApplication = async (appId) => {
    if (!confirm('Delete this application?')) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/api/applications/${appId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('✅ Application deleted');
      fetchApplications();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('❌ Delete failed');
    }
  };

  const downloadResume = async (appId, filename) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/applications/download-resume/${appId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed');
    }
  };

  // Helper function to get status badge color
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
      <h2>👥 Applications Management ({applications.length})</h2>
      
      {loading && <p>Loading...</p>}

      {!loading && applications.length === 0 ? (
        <p style={{ padding: 20, textAlign: 'center', color: '#999' }}>
          No applications yet
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 15 }}>
          {applications.map(app => (
            <div 
              key={app._id} 
              style={{ 
                padding: 20, 
                border: '1px solid #ddd', 
                borderRadius: 8,
                background: 'white'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>{app.candidateId?.name}</h3>
                  <p style={{ margin: '5px 0' }}>
                    <strong>📧 Email:</strong> {app.candidateId?.email}
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    <strong>💼 Job:</strong> {app.jobId?.title}
                  </p>
                  <p style={{ margin: '5px 0' }}>
                    <strong>📅 Applied:</strong> {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                  
                  {/* Match Score Badge */}
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
                  
                  {app.coverLetter && (
                    <div style={{ 
                      margin: '10px 0', 
                      padding: 10, 
                      background: '#f8f9fa', 
                      borderRadius: 5 
                    }}>
                      <strong>📝 Cover Letter:</strong>
                      <p style={{ margin: '5px 0', fontSize: 14 }}>{app.coverLetter}</p>
                    </div>
                  )}

                  <div style={{ marginTop: 10 }}>
                    <button
                      onClick={() => downloadResume(app._id, app.resumeFileName)}
                      style={{
                        padding: '8px 16px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: 5,
                        cursor: 'pointer',
                        fontSize: 14
                      }}
                    >
                      📥 Download Resume
                    </button>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 10,
                  minWidth: 180
                }}>
                  {/* Current Status Badge */}
                  <div style={{
                    padding: '6px 12px',
                    background: getStatusColor(app.status),
                    color: 'white',
                    borderRadius: 5,
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: 12,
                    textTransform: 'uppercase'
                  }}>
                    {app.status}
                  </div>

                  {/* Status Dropdown - FIXED OPTIONS */}
                  <select
                    value={app.status}
                    onChange={(e) => updateStatus(app._id, e.target.value)}
                    style={{ 
                      padding: '8px 12px', 
                      borderRadius: 5,
                      border: '1px solid #ddd',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="reviewed">👀 Reviewed</option>
                    <option value="shortlisted">✅ Shortlisted</option>
                    <option value="test_sent">📝 Test Sent</option>
                    <option value="rejected">❌ Rejected</option>
                  </select>

                  <button
                    onClick={() => deleteApplication(app._id)}
                    style={{
                      padding: '8px 12px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: 5,
                      cursor: 'pointer',
                      fontSize: 14
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