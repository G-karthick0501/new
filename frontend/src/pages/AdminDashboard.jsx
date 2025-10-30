// frontend/src/pages/AdminDashboard.jsx - CORRECTED
import { useAuth } from "../hooks/useAuth";
import { useState } from 'react'; // <-- ADDED THIS IMPORT

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const adminFeatures = [
    { id: 'overview', label: '📊 System Overview' },
    { id: 'users', label: '👥 User Management' },
    { id: 'settings', label: '⚙️ Platform Settings' },
    { id: 'analytics', label: '📈 Platform Analytics' },
    { id: 'maintenance', label: '🔧 System Maintenance' }
  ];

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 30,
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: 15
      }}>
        <div>
          <h1>Admin Dashboard</h1>
          <p>System administration, <strong>{user?.name}</strong>! ⚡</p>
        </div>
        <button onClick={logout} style={{ 
          padding: '10px 20px', 
          backgroundColor: '#dc3545', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px' 
        }}>
          Logout
        </button>
      </div>

      <div style={{ 
        display: 'flex', 
        marginBottom: 30,
        borderBottom: '1px solid #ddd'
      }}>
        {adminFeatures.map(feature => (
          <button
            key={feature.id}
            onClick={() => setActiveTab(feature.id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              backgroundColor: activeTab === feature.id ? '#6f42c1' : 'transparent',
              color: activeTab === feature.id ? 'white' : '#333',
              cursor: 'pointer',
              borderRadius: '5px 5px 0 0',
              marginRight: '5px'
            }}
          >
            {feature.label}
          </button>
        ))}
      </div>

      <div style={{ minHeight: 400 }}>
        {activeTab === 'overview' && (
          <div>
            <h2>📊 System Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
              <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
                <h3>Total Users</h3>
                <p style={{ fontSize: 24, margin: 0 }}>1,247</p>
                <small>↑ 12% this month</small>
              </div>
              <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
                <h3>Active Sessions</h3>
                <p style={{ fontSize: 24, margin: 0 }}>89</p>
                <small>Peak: 156 today</small>
              </div>
              <div style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
                <h3>System Health</h3>
                <p style={{ fontSize: 24, margin: 0, color: '#28a745' }}>Good</p>
                <small>All services operational</small>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'users' && (
          <div>
            <h2>👥 User Management</h2>
            <p>Manage candidates, HR users, and administrators</p>
            <button style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 5 }}>
              View All Users
            </button>
          </div>
        )}
        {/* Add other admin sections as needed */}
      </div>
    </div>
  );
}