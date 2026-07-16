import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { navigate('/'); return; }
    const parsed = JSON.parse(u);
    fetchProfile(parsed.user_id);
  }, []);

  const fetchProfile = async (user_id) => {
    try {
      const res = await axios.get('http://localhost:5000/api/profile/' + user_id);
      setUser(res.data);
      setName(res.data.name);
      setAge(res.data.age);
      setGender(res.data.gender);
    } catch (err) {
      setMessage('Failed to load profile.');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage('Name cannot be empty.');
      return;
    }
    const ageNum = Number(age);
    if (!age || isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
      setMessage('Please enter a valid age between 10 and 100.');
      return;
    }

    try {
      const res = await axios.put('http://localhost:5000/api/profile/' + user.user_id, {
        name: name,
        age: ageNum,
        gender: gender
      });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setMessage('Profile updated successfully!');
    } catch (err) {
      setMessage('Update failed. Please try again.');
    }
  };

  const handleLogout = function () { localStorage.clear(); navigate('/'); };

  return (
    <div>
      <div className="navbar">
        <h1>AI Diet & Fitness</h1>
        <div className="nav-links">
          <a href="/dashboard">Home</a>
          <a href="/plans">Plans</a>
          <a href="/profile">Profile</a>
          <button onClick={handleLogout} style={{ background: 'none', border: '1px solid white', color: 'white', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', marginLeft: 16 }}>Logout</button>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 420, marginTop: 60 }}>
        <div className="card">
          <h2>My Profile</h2>

          <label>Email</label>
          <input type="email" value={user ? user.email : ''} disabled style={{ background: '#f0f0f0' }} />

          <label>Name</label>
          <input type="text" value={name} onChange={function (e) { setName(e.target.value); }} placeholder="Your full name" />

          <label>Age</label>
          <input type="number" value={age} onChange={function (e) { setAge(e.target.value); }} placeholder="Your age" />

          <label>Gender</label>
          <select value={gender} onChange={function (e) { setGender(e.target.value); }} style={{ width: '100%', padding: 10, margin: '8px 0', borderRadius: 8, border: '1px solid #ccc' }}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          {message ? <p className={message.indexOf('success') !== -1 ? 'success' : 'error'}>{message}</p> : null}

          <button className="btn" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default Profile;