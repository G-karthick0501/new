import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import GoogleOAuth from "../components/GoogleOAuth";

const API_BASE = "http://localhost:5000/api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function getRoleBasedDashboard(role) {
    const dashboards = {
      'candidate': '/candidate-dashboard',
      'hr': '/hr-dashboard', 
      'admin': '/admin-dashboard'
    };
    return dashboards[role] || '/candidate-dashboard';
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    if (!form.email || !form.password) {
      setMsg("Email and password are required");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.msg || "Error");
        return;
      }
      
      // Use the auth context to login
      login(data.user, data.token);
      
      // Redirect to role-appropriate dashboard
      navigate(getRoleBasedDashboard(data.user.role));
      
    } catch {
      setMsg("Network error");
    }
  }

  return (
    <div style={{ 
      padding: 40, 
      maxWidth: 400, 
      margin: '0 auto',
      border: '1px solid #ddd',
      borderRadius: '8px',
      marginTop: '50px'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: 30 }}>Welcome Back!</h2>
      
      {/* Google Sign-In Button */}
      <div style={{ marginBottom: 20 }}>
        <GoogleOAuth />
      </div>
      
      <div style={{ 
        margin: "20px 0", 
        textAlign: "center",
        position: 'relative'
      }}>
        <hr style={{ margin: '20px 0' }} />
        <span style={{ 
          position: 'absolute',
          top: '-12px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'white',
          padding: '0 15px',
          color: '#6c757d',
          fontWeight: 'bold'
        }}>
          OR
        </span>
      </div>
      
      {/* Regular Login Form */}
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 15 }}>
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            value={form.email}
            onChange={onChange}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: 20 }}>
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={onChange}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
          />
        </div>
        
        <button 
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Sign In
        </button>
      </form>
      
      {msg && (
        <p style={{ 
          color: "crimson", 
          textAlign: 'center', 
          marginTop: 15,
          padding: '10px',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '5px'
        }}>
          {msg}
        </p>
      )}
      
      <p style={{ textAlign: 'center', marginTop: 20 }}>
        Don't have an account?{' '}
        <a 
          href="/signup" 
          style={{ 
            color: '#007bff', 
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          Sign up here
        </a>
      </p>
    </div>
  );
}