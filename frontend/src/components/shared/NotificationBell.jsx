import { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer',
          fontSize: '20px',
          position: 'relative'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -5,
            right: -5,
            background: 'red',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '12px'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 40,
          width: 320,
          maxHeight: 400,
          overflowY: 'auto',
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}>
          {notifications.length === 0 ? (
            <p style={{ padding: 20, textAlign: 'center', color: '#999' }}>
              No notifications
            </p>
          ) : (
            notifications.slice(0, 10).map(notif => (
              <div
                key={notif._id}
                onClick={() => markAsRead(notif._id)}
                style={{
                  padding: 12,
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  background: notif.read ? 'white' : '#f0f8ff'
                }}
              >
                <strong>{notif.title}</strong>
                <p style={{ margin: '4px 0', fontSize: 14 }}>{notif.message}</p>
                <small style={{ color: '#999' }}>
                  {new Date(notif.createdAt).toLocaleString()}
                </small>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}