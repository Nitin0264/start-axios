import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      // Send registration credentials to our new backend endpoint
      const response = await axios.post("http://localhost:8000/api/register", {
        username,
        password
      });

      setMessage(response.data.message); // "User registered successfully!"
      setUsername("");
      setPassword("");
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message);
      } else {
        setError("Could not connect to server.");
      }
    }
  };

  return (
    <div>
      <h2>Create an Account</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleRegister}>
        <div>
          <label>Username:</label>
          <input 
            type="text" 
            placeholder="Choose a username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
          />
        </div>

        <div>
          <label>Password:</label>
          <input 
            type="password" 
            placeholder="Create a password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>

        <button type="submit">Sign Up</button>
      </form>

      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
}

export default Register;