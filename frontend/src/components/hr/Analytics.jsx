// src/components/hr/Analytics.jsx
export default function Analytics() {
  return (
    <div>
      <h2>📈 Recruitment Analytics</h2>
      <div>
        <h3>Key Metrics</h3>
        <p>• Average time to hire: 18 days</p>
        <p>• Interview to offer ratio: 3:1</p>
        <p>• Top source of candidates: LinkedIn (45%)</p>
        
        <button style={{ 
          padding: '12px 24px', 
          backgroundColor: '#6f42c1', 
          color: 'white', 
          border: 'none', 
          borderRadius: 5,
          marginTop: 15
        }}>
          Generate Detailed Report
        </button>
      </div>
    </div>
  );
}