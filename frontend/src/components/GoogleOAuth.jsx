// frontend/src/components/GoogleOAuth.jsx - CORRECTED
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth"; // Correctly import the useAuth hook

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_BASE = import.meta.env.VITE_API_URL;

export default function GoogleOAuth() {
  const navigate = useNavigate();
  const { login } = useAuth(); // Access the login function from the auth context

  const handleGoogleLogin = async (response) => {
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: response.credential }),
      });

      const data = await res.json();
      
      if (res.ok) {
        // CALL THE GLOBAL LOGIN FUNCTION INSTEAD OF MANUAL LOCALSTORAGE
        login(data.user, data.token); 
        navigate("/dashboard");
      } else {
        alert("Google login failed: " + data.msg);
      }
    } catch (error) {
      alert("Network error during Google login");
    }
  };

  useEffect(() => {
    // Load Google Identity Services
    if (!window.google) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleLogin,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-button"),
          {
            theme: "outline",
            size: "large",
            text: "signin_with",
            width: "300"
          }
        );
      };
      document.head.appendChild(script);
    } else {
      // If Google script already loaded
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-button"),
        {
          theme: "outline",
          size: "large",
          text: "signin_with",
          width: "300"
        }
      );
    }
  }, [login, handleGoogleLogin, GOOGLE_CLIENT_ID]); // Add dependencies to useEffect
  
  // Note: handleGoogleLogin is a stable function in modern React, so it's fine.
  // However, older React versions might throw a warning. This is a minor detail.

  return <div id="google-signin-button"></div>;
}