// frontend/src/pages/Home.jsx - UPDATED
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  
  // This helper function can be defined here or in a central place like the AuthProvider
  function getRoleBasedDashboard(role) {
    const dashboards = {
      'candidate': '/candidate-dashboard',
      'hr': '/hr-dashboard',
      'admin': '/admin-dashboard'
    };
    return dashboards[role] || '/dashboard';
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Home</h2>
      <p>Welcome! This is a tiny demo with Sign Up, Login, and a protected Dashboard.</p>
      {isAuthenticated() ? (
        <p>
          You are logged in. Go to <Link to={getRoleBasedDashboard(user.role)}>Dashboard</Link>.
        </p>
      ) : (
        <p>
          Start by creating an account on the <Link to="/signup">Sign Up</Link> page.
        </p>
      )}
    </div>
  );
}