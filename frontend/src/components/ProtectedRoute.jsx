import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  fallbackPath = "/login" 
}) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    // Redirect based on user role
    const roleRedirects = {
      'candidate': '/candidate-dashboard',
      'hr': '/hr-dashboard',
      'admin': '/admin-dashboard'
    };
    return <Navigate to={roleRedirects[user.role] || '/'} replace />;
  }

  return children;
}