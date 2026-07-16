import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../App.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { navigate('/'); return; }
    const parsed = JSON.parse(u);
    setUser(parsed);
    fetchHistory(parsed.user_id);
  }, []);

  const fetchHistory = async (user_id) => {
    try {
      const res = await axios.get('http://localhost:5000/api/weight/history/' + user_id);
      const formatted = res.data.map(function (r, index) {
        return Object.assign({}, r, {
          recorded_date: r.recorded_date.slice(0, 10),
          record_label: '#' + (index + 1)
        });
      });
      setHistory(formatted);
    } catch (err) {}
  };

  const handleDeleteRecord = async (record_id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await axios.delete('http://localhost:5000/api/weight/' + record_id);
      fetchHistory(user.user_id);
    } catch (err) {}
  };

  const handleSubmit = async () => {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (!weight || !height) {
      setMessage('Please enter both weight and height.');
      return;
    }
    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
      setMessage('Please enter a valid weight between 1 and 500 kg.');
      return;
    }
    if (isNaN(heightNum) || heightNum <= 0 || heightNum > 300) {
      setMessage('Please enter a valid height between 1 and 300 cm.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/recommend', {
        user_id: user.user_id, weight_kg: weightNum,
        height_cm: heightNum, age: user.age, gender: user.gender
      });
      setRecommendation(res.data);
      await axios.post('http://localhost:5000/api/weight/add', {
        user_id: user.user_id, weight_kg: weightNum, height_cm: heightNum
      });
      fetchHistory(user.user_id);
      setMessage('');
    } catch (err) {
      setMessage('Error. Please try again.');
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
          <span style={{ color: 'white', marginLeft: 20, fontSize: 14 }}>Hi, {user ? user.name : ''}</span>
          <button onClick={handleLogout} style={{ background: 'none', border: '1px solid white', color: 'white', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', marginLeft: 16 }}>Logout</button>
        </div>
      </div>

      <div className="container">
        <div className="card">
          <h2>Enter Your Data</h2>
          <label>Weight (kg)</label>
          <input type="number" value={weight} onChange={function (e) { setWeight(e.target.value); }} placeholder="e.g. 68.5" />
          <label>Height (cm)</label>
          <input type="number" value={height} onChange={function (e) { setHeight(e.target.value); }} placeholder="e.g. 170" />
          {message ? <p className="error">{message}</p> : null}
          <button className="btn" onClick={handleSubmit}>Calculate BMI & Get AI Recommendation</button>
        </div>

        {recommendation ? (
          <div className="card">
            <h2>AI Recommendation</h2>
            <p><strong>Your BMI:</strong> {recommendation.bmi}</p>
            <p><strong>Suggested Goal:</strong> {recommendation.goal ? recommendation.goal.replace('_', ' ').toUpperCase() : ''}</p>
            {recommendation.plan ? (
              <div>
                <h3 style={{ marginTop: 16, color: '#028090' }}>{recommendation.plan.plan_name}</h3>
                <div className="detail-section">
                  <h4>Meal Plan</h4>
                  {recommendation.plan.meal_details ? recommendation.plan.meal_details.split('\n').map(function (line, i) {
                    return <div key={i} className="meal-item">{line}</div>;
                  }) : null}
                </div>
                <div className="detail-section">
                  <h4>Fitness Plan</h4>
                  {recommendation.plan.exercise_details ? recommendation.plan.exercise_details.split('\n').map(function (line, i) {
                    return <div key={i} className="meal-item">{line}</div>;
                  }) : null}
                </div>
                <button className="btn" style={{ marginTop: 12 }} onClick={function () { navigate('/plans'); }}>
                  View All Plans
                </button>
              </div>
            ) : <p style={{ color: '#888', marginTop: 8 }}>No plan data found.</p>}
          </div>
        ) : null}

        {history.length > 0 ? (
          <div className="card">
            <h2>BMI History</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="record_label" />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip labelFormatter={function (label, payload) {
                  return payload && payload[0] ? label + ' - ' + payload[0].payload.recorded_date : label;
                }} />
                <Line type="monotone" dataKey="bmi" stroke="#028090" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>

            <div style={{ marginTop: 16, maxHeight: 200, overflowY: 'auto' }}>
              {history.map(function (h, i) {
                return (
                  <div key={h.record_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #e8f7f5', fontSize: 13 }}>
                    <span>#{i + 1} - {h.recorded_date} - BMI {h.bmi}</span>
                    <button
                      onClick={function () { handleDeleteRecord(h.record_id); }}
                      style={{ background: 'none', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: 6, padding: '3px 10px', fontSize: 12, cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Dashboard;