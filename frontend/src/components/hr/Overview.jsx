// src/components/hr/Overview.jsx
export default function Overview() {
  return (
    <div>
      <h2>📊 Recruitment Pipeline Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 30 }}>
        <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#f8f9fa' }}>
          <h3>Active Job Posts</h3>
          <p style={{ fontSize: 24, margin: 0, color: '#007bff' }}>8</p>
          <small>2 urgent positions</small>
        </div>
        <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#f8f9fa' }}>
          <h3>Total Applications</h3>
          <p style={{ fontSize: 24, margin: 0, color: '#28a745' }}>247</p>
          <small>+23 this week</small>
        </div>
        <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#f8f9fa' }}>
          <h3>Interviews Scheduled</h3>
          <p style={{ fontSize: 24, margin: 0, color: '#ffc107' }}>15</p>
          <small>5 today</small>
        </div>
        <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#f8f9fa' }}>
          <h3>Offers Extended</h3>
          <p style={{ fontSize: 24, margin: 0, color: '#dc3545' }}>3</p>
          <small>Awaiting responses</small>
        </div>
      </div>
      
      <h3>Recent Activity</h3>
      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 20 }}>
        <p>• New application for Senior Developer position</p>
        <p>• Interview completed for Marketing Manager role</p>
        <p>• Job post published: Frontend Developer</p>
      </div>
    </div>
  );
}