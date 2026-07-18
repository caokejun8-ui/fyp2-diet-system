import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../App.css';

function Admin() {
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [mealDraft, setMealDraft] = useState('');
  const [exerciseDraft, setExerciseDraft] = useState('');
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState(null); // NEW

  const navigate = useNavigate();

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { navigate('/'); return; }
    const parsed = JSON.parse(u);
    if (parsed.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    setUser(parsed);
    fetchPlans();
    fetchStats(); // NEW
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/plan');
      const results = await Promise.all(
        res.data.map(function (p) {
          return api.get('/plan/goal/' + p.goal_type);
        })
      );
      setPlans(results.map(function (r) { return r.data[0]; }).filter(Boolean));
    } catch (err) {}
  };

  // NEW: fetch admin statistics
  const fetchStats = async () => {
    try {
      const res = await api.get('/plan/admin/stats');
      // Turn goalDistribution into a chart-friendly format with readable labels
      const labelMap = { weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain', maintenance: 'Maintenance' };
      const chartData = res.data.goalDistribution.map(function (row) {
        return { name: labelMap[row.goal_type] || row.goal_type, count: row.count };
      });
      setStats({ totalUsers: res.data.totalUsers, chartData: chartData });
    } catch (err) {}
  };

  const startEdit = (plan) => {
    setEditingId(plan.plan_id);
    setMealDraft(plan.meal_details || '');
    setExerciseDraft(plan.exercise_details || '');
    setMessage('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setMealDraft('');
    setExerciseDraft('');
    setMessage('');
  };

  const saveEdit = async (plan_id) => {
    try {
      await api.put('/plan/admin/' + plan_id, {
        meal_details: mealDraft,
        exercise_details: exerciseDraft
      });
      setMessage('Plan updated successfully!');
      fetchPlans();
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
          <a href="/admin">Admin</a>
          <span style={{ color: 'white', marginLeft: 20, fontSize: 14 }}>Admin: {user ? user.name : ''}</span>
          <button onClick={handleLogout} style={{ background: 'none', border: '1px solid white', color: 'white', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', marginLeft: 16 }}>Logout</button>
        </div>
      </div>

      <div className="container">
        <h2 style={{ marginTop: 24 }}>Admin - Manage Plans</h2>
        <p style={{ color: '#5a7a82', marginBottom: 20 }}>Edit the meal and fitness plan content shown to all users.</p>

        {/* NEW: Statistics card */}
        {stats ? (
          <div className="card">
            <h3>Usage Statistics</h3>
            <p style={{ fontSize: 16, marginBottom: 12 }}>
              <strong>Total Registered Users:</strong> {stats.totalUsers}
            </p>
            {stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#028090" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: '#888' }}>No recommendations generated yet.</p>
            )}
            <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
              Each user is counted once, based on their most recent AI-inferred goal.
            </p>
          </div>
        ) : null}

        {plans.map(function (plan) {
          return (
            <div key={plan.plan_id} className="card">
              <h3>{plan.plan_name} ({plan.goal_type})</h3>

              {editingId === plan.plan_id ? (
                <div>
                  <label>Meal Details</label>
                  <textarea
                    value={mealDraft}
                    onChange={function (e) { setMealDraft(e.target.value); }}
                    style={{ width: '100%', minHeight: 100, padding: 10, borderRadius: 8, border: '1px solid #ccc', fontFamily: 'inherit', fontSize: 14 }}
                  />
                  <label>Exercise Details</label>
                  <textarea
                    value={exerciseDraft}
                    onChange={function (e) { setExerciseDraft(e.target.value); }}
                    style={{ width: '100%', minHeight: 100, padding: 10, borderRadius: 8, border: '1px solid #ccc', fontFamily: 'inherit', fontSize: 14 }}
                  />

                  {message ? (
                    <p style={{
                      fontSize: 15,
                      fontWeight: 'bold',
                      padding: '10px 14px',
                      borderRadius: 8,
                      marginTop: 10,
                      backgroundColor: message.indexOf('success') !== -1 ? '#e8f7f5' : '#fde8e8',
                      color: message.indexOf('success') !== -1 ? '#028090' : '#e74c3c'
                    }}>
                      {message}
                    </p>
                  ) : null}

                  <button className="btn" onClick={function () { saveEdit(plan.plan_id); }}>Save</button>
                  <button
                    onClick={cancelEdit}
                    style={{ background: 'none', border: '1px solid #888', color: '#888', borderRadius: 8, padding: '10px 20px', marginTop: 8, cursor: 'pointer', width: '100%' }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div>
                  <div className="detail-section">
                    <h4>Meal Plan</h4>
                    {plan.meal_details ? plan.meal_details.split('\n').map(function (line, i) {
                      return <div key={i} className="meal-item">{line}</div>;
                    }) : null}
                  </div>
                  <div className="detail-section">
                    <h4>Fitness Plan</h4>
                    {plan.exercise_details ? plan.exercise_details.split('\n').map(function (line, i) {
                      return <div key={i} className="meal-item">{line}</div>;
                    }) : null}
                  </div>
                  <button className="btn" onClick={function () { startEdit(plan); }}>Edit This Plan</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Admin;