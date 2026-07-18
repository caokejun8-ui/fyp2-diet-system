import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate, useParams, Link } from 'react-router-dom';
import '../App.css';

const EXERCISE_VIDEOS = {
  'Squats': 'tVB1q8zkP3o',
  'Push-ups': 'sxNUe7s4HYs',
  'Plank': 'tgbrMdfuGJA',
  'Lunges': 'xu4ahA2VJuo',
  'Rows': '-xlBxIMqh3A',
  'Mountain climbers': 'tgbrMdfuGJA',
  'Bench press': 'RsobeWfbBcY',
  'Shoulder press': 'tzZMsrzG_zE',
  'Tricep dips': 'qrS6aa0aQ9I',
  'Deadlifts': 'a5zhnubunoE',
  'Bicep curls': 'dDI8ClxRS04',
  'Calf raises': 'MAMzF7iZNkc',
  'Full body circuit': 'tVB1q8zkP3o'
};

const GOAL_EXERCISES = {
  weight_loss: ['Squats', 'Push-ups', 'Plank', 'Lunges', 'Rows', 'Mountain climbers', 'Full body circuit'],
  muscle_gain: ['Bench press', 'Shoulder press', 'Tricep dips', 'Deadlifts', 'Rows', 'Bicep curls', 'Squats', 'Lunges', 'Calf raises'],
  maintenance: ['Squats', 'Push-ups', 'Rows', 'Lunges', 'Full body circuit']
};

function VideoFacade(props) {
  var exName = props.exName;
  var videoId = props.videoId;
  var videoUrl = 'https://www.youtube.com/watch?v=' + videoId;
  var thumbUrl = 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg';
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontWeight: 'bold', color: '#028090', marginBottom: 6 }}>{exName}</p>
      <a href={videoUrl} target="_blank" rel="noopener noreferrer" style={{ position: 'relative', display: 'block', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 8, background: '#000' }}>
        <img src={thumbUrl} alt={exName} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 0, height: 0, borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderLeft: '20px solid white', marginLeft: 4 }}></div>
        </div>
      </a>
    </div>
  );
}

function PlanDetail() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // NEW: needed to know if this user is an admin
  const navigate = useNavigate();
  const { goalType } = useParams();

  const goalLabel = { weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain', maintenance: 'Maintenance' };
  const goalColor = { weight_loss: '#e74c3c', muscle_gain: '#2ecc71', maintenance: '#028090' };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (!u) { navigate('/'); return; }
    setUser(JSON.parse(u)); // NEW
    fetchPlan();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalType]);

  const fetchPlan = async () => {
    try {
      const res = await api.get('/plan/goal/' + goalType);
      setPlan(res.data[0] || null);
    } catch (err) {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = function () { localStorage.clear(); navigate('/'); };

  var uniqueExercises = [];
  var seenVideos = {};
  var list = GOAL_EXERCISES[goalType] || [];
  for (var i = 0; i < list.length; i++) {
    var exName = list[i];
    var vid = EXERCISE_VIDEOS[exName];
    if (!seenVideos[vid]) {
      seenVideos[vid] = true;
      uniqueExercises.push(exName);
    }
  }

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
        <Link to="/plans" style={{ color: '#028090', fontSize: 14 }}>Back to Plans</Link>

        {loading ? <p style={{ marginTop: 20 }}>Loading...</p> : null}

        {!loading && !plan ? (
          <div className="card" style={{ marginTop: 16 }}>
            <p>No plan found for this goal.</p>
          </div>
        ) : null}

        {!loading && plan ? (
          <div className="card" style={{ marginTop: 16 }}>
            <span className="tag" style={{ backgroundColor: goalColor[goalType], color: 'white' }}>
              {goalLabel[goalType]}
            </span>
            <h2 style={{ marginTop: 8 }}>{plan.plan_name}</h2>

            <div className="detail-section">
              <h4>Meal Plan</h4>
              {plan.meal_details ? plan.meal_details.split('\n').map(function (line, idx) {
                return <div key={idx} className="meal-item">{line}</div>;
              }) : null}
            </div>

            <div className="detail-section">
              <h4>Fitness Plan</h4>
              {plan.exercise_details ? plan.exercise_details.split('\n').map(function (line, idx) {
                return <div key={idx} className="meal-item">{line}</div>;
              }) : null}
            </div>

            <div className="detail-section">
              <h4>Watch Proper Form</h4>
              {uniqueExercises.map(function (exName, idx) {
                return <VideoFacade key={idx} exName={exName} videoId={EXERCISE_VIDEOS[exName]} />;
              })}
              <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>Video credit: Bodybuilding.com official YouTube channel</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default PlanDetail;