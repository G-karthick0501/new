// src/components/shared/DashboardLayout.jsx
import { useAuth } from '../../hooks/useAuth';

export default function DashboardLayout({ 
  title, 
  subtitle, 
  activeTab, 
  tabs, 
  onTabChange,
  accentColor = '#007bff',
  children 
}) {
  const { logout } = useAuth();

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 30,
        borderBottom: '2px solid #e0e0e0',
        paddingBottom: 15
      }}>
        <div>
          <h1>{title}</h1>
          <p dangerouslySetInnerHTML={{ __html: subtitle }} />
        </div>
        <button onClick={logout} style={{ 
          padding: '10px 20px', 
          backgroundColor: '#dc3545', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          Logout
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        marginBottom: 30,
        borderBottom: '1px solid #ddd'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              backgroundColor: activeTab === tab.id ? accentColor : 'transparent',
              color: activeTab === tab.id ? 'white' : '#333',
              cursor: 'pointer',
              borderRadius: '5px 5px 0 0',
              marginRight: '5px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ minHeight: 400 }}>
        {children}
      </div>
    </div>
  );
}