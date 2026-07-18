import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function Plans() {
  const [plans, setPlans] = useState([]);
  const [user, setUser] = useState(null); // NEW: needed to know if this user is an admin
  const navigate = useNavigate();

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { navigate('/'); return; }
    setUser(JSON.parse(u)); // NEW
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const goals = ['weight_loss', 'muscle_gain', 'maintenance'];
      const results = await Promise.all(
        goals.map(g => api.get(`/plan/goal/${g}`))
      );
      setPlans(results.map(r => r.data[0]).filter(Boolean));
    } catch (err) {}
  };

  const handleLogout = () => { localStorage.clear(); navigate('/'); };

  const goalLabel = { weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain', maintenance: 'Maintenance' };
  const goalColor = { weight_loss: '#e74c3c', muscle_gain: '#2ecc71', maintenance: '#028090' };

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

      <div className="container">
        <h2 style={{ marginTop: 24 }}>All Available Plans</h2>
        <p style={{ color: '#5a7a82', marginBottom: 20 }}>Choose a plan that matches your health goal.</p>

        {plans.map((plan, i) => (
          <div key={i} className="plan-card" onClick={() => navigate(`/plans/${plan.goal_type}`)}>
            <span className="tag" style={{ backgroundColor: goalColor[plan.goal_type], color: 'white' }}>
              {goalLabel[plan.goal_type]}
            </span>
            <h3>{plan.plan_name}</h3>
            <p>{plan.meal_details?.split('\n')[0]}</p>
            <p style={{ marginTop: 8, color: '#028090', fontSize: 14 }}>View full plan →</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Plans;