import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import GoogleOAuth from "../components/GoogleOAuth";

const API_BASE = "http://localhost:5000/api";

export default function Signup() {
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    role: "candidate" 
  });
  const [msg, setMsg] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    if (!form.name || !form.email || !form.password || !form.role) {
      setMsg("All fields are required");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.msg || "Error");
        return;
      }
      setMsg("Registered successfully! Redirecting...");
      
      // Auto-login after successful registration
      setTimeout(async () => {
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          login(loginData.user, loginData.token);
          navigate(getRoleBasedDashboard(loginData.user.role));
        }
      }, 1000);
      
      setForm({ name: "", email: "", password: "", role: "candidate" });
    } catch {
      setMsg("Network error");
    }
  }

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
      <h2>Sign Up</h2>
      
      {/* Google Sign-In Button */}
      <div style={{ marginBottom: 20 }}>
        <GoogleOAuth />
      </div>
      
      <div style={{ margin: "20px 0", textAlign: "center" }}>
        <strong>OR</strong>
      </div>
      
      {/* Regular Signup Form */}
      <form onSubmit={onSubmit}>
        <input
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={onChange}
        /><br/><br/>
        
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={onChange}
        /><br/><br/>
        
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={onChange}
        /><br/><br/>
        
        {/* Role Selection */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 10 }}>
            <strong>I am a:</strong>
          </label>
          <select
            name="role"
            value={form.role}
            onChange={onChange}
            style={{ 
              padding: '8px 12px', 
              width: '200px', 
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          >
            <option value="candidate">Job Candidate</option>
            <option value="hr">HR Manager</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
        
        <button type="submit">Create Account</button>
      </form>
      
      <p style={{ color: msg?.includes("successfully") ? "green" : "crimson" }}>
        {msg}
      </p>
      <p><a href="/login">Already have an account? Login here</a></p>
    </div>
  );
}