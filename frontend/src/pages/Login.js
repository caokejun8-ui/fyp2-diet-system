import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../App.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError('Wrong email or password');
    }
  };

  return (
    <div>
      <div className="navbar"><h1>AI Diet & Fitness</h1></div>
      <div className="container" style={{ maxWidth: 420, marginTop: 60 }}>
        <div className="card">
          <h2>Login</h2>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" />
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" />
          {error && <p className="error">{error}</p>}
          <button className="btn" onClick={handleLogin}>Login</button>
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
            No account? <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;