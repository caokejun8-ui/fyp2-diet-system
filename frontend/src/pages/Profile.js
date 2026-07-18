import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [targetWeight, setTargetWeight] = useState('');
  const [dietaryPreference, setDietaryPreference] = useState('none'); // NEW
  const [nutFree, setNutFree] = useState(false); // NEW
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { navigate('/'); return; }
    const parsed = JSON.parse(u);
    fetchProfile(parsed.user_id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async (user_id) => {
    try {
      const res = await api.get('/profile/' + user_id);
      setUser(res.data);
      setName(res.data.name);
      setAge(res.data.age);
      setGender(res.data.gender);
      setTargetWeight(res.data.target_weight !== null && res.data.target_weight !== undefined ? res.data.target_weight : '');
      // NEW: pre-fill dietary preferences
      setDietaryPreference(res.data.dietary_preference || 'none');
      setNutFree(!!res.data.nut_free);
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

    let targetWeightValue = null;
    if (targetWeight !== '' && targetWeight !== null && targetWeight !== undefined) {
      const twNum = Number(targetWeight);
      if (isNaN(twNum) || twNum <= 0 || twNum > 500) {
        setMessage('Please enter a valid target weight between 1 and 500 kg.');
        return;
      }
      targetWeightValue = twNum;
    }

    try {
      const res = await api.put('/profile/' + user.user_id, {
        name: name,
        age: ageNum,
        gender: gender,
        target_weight: targetWeightValue,
        dietary_preference: dietaryPreference, // NEW
        nut_free: nutFree // NEW
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
          {user && user.role === 'admin' ? <a href="/admin">Admin</a> : null}
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

          <label>Target Weight (kg) — optional</label>
          <input
            type="number"
            value={targetWeight}
            onChange={function (e) { setTargetWeight(e.target.value); }}
            placeholder="e.g. 60"
          />
          <p style={{ fontSize: 13, color: '#777', marginTop: -4 }}>
            Set a goal weight to see your progress on the Dashboard. Leave blank if you don't want to track this.
          </p>

          {/* NEW: dietary preference section */}
          <label style={{ marginTop: 16, display: 'block' }}>Dietary Preference</label>
          <select
            value={dietaryPreference}
            onChange={function (e) { setDietaryPreference(e.target.value); }}
            style={{ width: '100%', padding: 10, margin: '8px 0', borderRadius: 8, border: '1px solid #ccc' }}
          >
            <option value="none">No preference (meat included)</option>
            <option value="vegetarian">Vegetarian (plant-based protein)</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={nutFree}
              onChange={function (e) { setNutFree(e.target.checked); }}
            />
            Nut-free (replace walnuts with chia seeds)
          </label>

          <p style={{ fontSize: 13, color: '#777', marginTop: 8 }}>
            Note: all meal plans in this system are already free of pork and alcohol.
          </p>

          {message ? <p className={message.indexOf('success') !== -1 ? 'success' : 'error'}>{message}</p> : null}

          <button className="btn" onClick={handleSave}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

export default Profile;