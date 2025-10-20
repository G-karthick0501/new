// src/components/candidate/Overview.jsx
export default function Overview() {
  return (
    <div>
      <h2>Your Progress Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
        <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
          <h3>Applications</h3>
          <p style={{ fontSize: 24, margin: 0 }}>12 Active</p>
          <small>3 interviews pending</small>
        </div>
        <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
          <h3>Resume Score</h3>
          <p style={{ fontSize: 24, margin: 0, color: '#28a745' }}>85/100</p>
          <small>Good match for target roles</small>
        </div>
        <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
          <h3>Interview Practice</h3>
          <p style={{ fontSize: 24, margin: 0 }}>7 Sessions</p>
          <small>Average score: 78%</small>
        </div>
        <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
          <h3>Coding Challenges</h3>
          <p style={{ fontSize: 24, margin: 0 }}>15 Completed</p>
          <small>8 medium, 7 easy</small>
        </div>
      </div>
    </div>
  );
}