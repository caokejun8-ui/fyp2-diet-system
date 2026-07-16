import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../App.css';

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', age: '', gender: 'male' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async () => {
    if (!form.name.trim()) {
      setMessage('Please enter your name.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email)) {
      setMessage('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (!form.password || form.password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }

    const ageNum = Number(form.age);
    if (!form.age || isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
      setMessage('Please enter a valid age between 10 and 100.');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/auth/register', form);
      setMessage('Registration successful! Redirecting...');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setMessage('Registration failed. Email may already exist.');
    }
  };

  return (
    <div>
      <div className="navbar"><h1>AI Diet & Fitness</h1></div>
      <div className="container" style={{ maxWidth: 420, marginTop: 60 }}>
        <div className="card">
          <h2>Create Account</h2>
          <label>Name</label>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Your full name" />
          <label>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Your email" />
          <label>Password</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Create a password" />
          <label>Age</label>
          <input name="age" type="number" value={form.age} onChange={handleChange} placeholder="Your age" />
          <label>Gender</label>
          <select name="gender" value={form.gender} onChange={handleChange} style={{ width: '100%', padding: 10, margin: '8px 0', borderRadius: 8, border: '1px solid #ccc' }}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          {message && <p className={message.indexOf('successful') !== -1 ? 'success' : 'error'}>{message}</p>}
          <button className="btn" onClick={handleRegister}>Register</button>
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
            Already have an account? <Link to="/">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;