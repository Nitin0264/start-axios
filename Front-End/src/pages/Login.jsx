import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom"; // Import useNavigate to redirect pages

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate(); // Initialize page redirect driver

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      // 1. Post credentials to backend login endpoint
      await axios.post("http://localhost:8000/api/login", { username, password });

      setMessage(response.data.message); // "Login successful!"

      // 2. CRITICAL STEP: Save the secure token and user data into Browser LocalStorage
      localStorage.setItem("blogToken", response.data.token);
      localStorage.setItem("blogUser", JSON.stringify(response.data.user));

      // Clear form inputs
      setUsername("");
      setPassword("");

      // 3. Redirect the user back to the home dashboard page automatically after 1 second
      setTimeout(() => {
        navigate("/");
      }, 1000);

    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError("Could not connect to server. Check backend terminal.");
      }
    }
  };

  return (
    <div>
      <h2>Account Login</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleLogin}>
        <div>
          <label>Username:</label>
          <input 
            type="text" 
            placeholder="Enter username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
          />
        </div>

        <div>
          <label>Password:</label>
          <input 
            type="password" 
            placeholder="Enter password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>

        <button type="submit">Login</button>
      </form>

      <p>
        Don't have an account yet? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}

export default Login;