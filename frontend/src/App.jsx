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
import InterviewResultsPage from "./pages/InterviewResults.jsx";
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
            <ProtectedRoute requiredRole="candidate">
              <CandidateDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hr-dashboard" 
          element={
            <ProtectedRoute requiredRole="hr">
              <HRDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/interview-results/:interviewId" 
          element={
            <ProtectedRoute>
              <InterviewResultsPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

// Navigation Component
function Navigation({ user, isAuthenticated }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getRoleBadge = (role) => {
    const badges = {
      'candidate': { color: '#28a745', text: '🔍 Candidate' },
      'hr': { color: '#007bff', text: '💼 HR' },
      'admin': { color: '#dc3545', text: '👑 Admin' }
    };
    return badges[role] || badges['candidate'];
  };

  const getDashboardLink = (role) => {
    const links = {
      'candidate': '/candidate-dashboard',
      'hr': '/hr-dashboard',
      'admin': '/admin-dashboard'
    };
    return links[role] || '/candidate-dashboard';
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '1rem 2rem', 
      backgroundColor: '#f8f9fa', 
      borderBottom: '1px solid #dee2e6' 
    }}>
      <div>
        <Link 
          to="/" 
          style={{ 
            fontSize: '1.5rem', 
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