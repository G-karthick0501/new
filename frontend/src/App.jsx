import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
// Import pages
import Home from "./pages/Home.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import CandidateDashboard from "./pages/CandidateDashboard.jsx";
import HRDashboard from "./pages/HRDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import NotificationBell from "./components/shared/NotificationBell.jsx";


function AppContent() {
  const { user, isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Navigation user={user} isAuthenticated={isAuthenticated()} />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Role-Based Protected Routes */}
        <Route 
          path="/candidate-dashboard" 
          element={
            <ProtectedRoute requiredRoles={['candidate']}>
              <CandidateDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/hr-dashboard" 
          element={
            <ProtectedRoute requiredRoles={['hr']}>
              <HRDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        

        {/* Legacy dashboard route - redirects based on role */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <RoleBasedRedirect />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<div>404 - Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

// Navigation Component
function Navigation({ user, isAuthenticated }) {
  const getRoleBadge = (role) => {
    const badges = {
      'candidate': { text: '🔍 Candidate', color: '#007bff' },
      'hr': { text: '💼 HR Manager', color: '#28a745' },
      'admin': { text: '⚡ Admin', color: '#6f42c1' }
    };
    return badges[role] || { text: role, color: '#6c757d' };
  };

  const getDashboardLink = (role) => {
    const links = {
      'candidate': '/candidate-dashboard',
      'hr': '/hr-dashboard',
      'admin': '/admin-dashboard'
    };
    return links[role] || '/dashboard';
  };

  return (
    <div style={{ 
      padding: 16, 
      borderBottom: "2px solid #e0e0e0", 
      marginBottom: 16,
      backgroundColor: '#f8f9fa',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <Link 
          to="/" 
          style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            textDecoration: 'none',
            color: '#333'
          }}
        >
          🤖 AI Recruitment Platform
        </Link>
      </div>

      <nav style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#007bff' }}>Home</Link>
        
        {!isAuthenticated && (
          <>
            <span style={{ color: '#ccc' }}>|</span>
            <Link to="/signup" style={{ textDecoration: 'none', color: '#007bff' }}>Sign Up</Link>
            <span style={{ color: '#ccc' }}>|</span>
            <Link to="/login" style={{ textDecoration: 'none', color: '#007bff' }}>Login</Link>
          </>
        )}
        
        {isAuthenticated && user && (
          <>
            <span style={{ color: '#ccc' }}>|</span>
            <Link 
              to={getDashboardLink(user.role)} 
              style={{ textDecoration: 'none', color: '#007bff' }}
            >
              Dashboard
            </Link>
            <span style={{ color: '#ccc' }}>|</span>
            <span style={{ 
              backgroundColor: getRoleBadge(user.role).color, 
              color: 'white', 
              padding: '4px 8px', 
              borderRadius: '12px', 
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {getRoleBadge(user.role).text}
            </span>
            <span style={{ fontSize: '14px', color: '#6c757d' }}>
              Hi, {user.name}!
            </span>
          </>
        )}
        {isAuthenticated && <NotificationBell />}
      </nav>
    </div>
  );
}

// Component to redirect to appropriate dashboard based on role
function RoleBasedRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const redirectMap = {
        'candidate': '/candidate-dashboard',
        'hr': '/hr-dashboard',
        'admin': '/admin-dashboard'
      };
      const redirectPath = redirectMap[user.role] || '/candidate-dashboard';
      if (location.pathname !== redirectPath) {
        navigate(redirectPath, { replace: true });
      }
    }
  }, [user, navigate, location]);

  return null; // This component renders nothing
}
// Main App Component with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}