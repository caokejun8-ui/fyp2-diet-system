const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Get all plans (public - anyone browsing plans before login is fine)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM PLAN');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get plan by goal type
router.get('/goal/:goal_type', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT p.*, f.exercise_details FROM PLAN p LEFT JOIN FITNESS_PLAN f ON p.plan_id = f.plan_id WHERE p.goal_type = ?',
      [req.params.goal_type]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NEW: Admin statistics -- total users + distribution of AI-inferred goals
// Read-only, no new tables needed, requires admin login
router.get('/admin/stats', verifyToken, verifyAdmin, async (req, res) => {
  try {
    // Total registered users
    const [userCountRows] = await db.query('SELECT COUNT(*) AS totalUsers FROM USER');
    const totalUsers = userCountRows[0].totalUsers;

    // Distribution of goals, based on each user's MOST RECENT recommendation only
    // (so a user who clicks "Get Recommendation" many times only counts once,
    // using their latest goal rather than every past recommendation event)
    const [distributionRows] = await db.query(
      `SELECT p.goal_type, COUNT(*) AS count
       FROM (
         SELECT r.user_id, r.plan_id,
                ROW_NUMBER() OVER (PARTITION BY r.user_id ORDER BY r.rec_date DESC, r.rec_id DESC) AS rn
         FROM RECOMMENDATION r
       ) latest
       JOIN PLAN p ON latest.plan_id = p.plan_id
       WHERE latest.rn = 1
       GROUP BY p.goal_type`
    );

    res.json({
      totalUsers,
      goalDistribution: distributionRows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update a plan's meal/exercise details
// CHANGED: now requires a valid token AND role = 'admin'
// (previously anyone could call this with no login at all)
router.put('/admin/:plan_id', verifyToken, verifyAdmin, async (req, res) => {
  const { meal_details, exercise_details } = req.body;
  try {
    if (meal_details !== undefined) {
      await db.query('UPDATE PLAN SET meal_details = ? WHERE plan_id = ?', [meal_details, req.params.plan_id]);
    }
    if (exercise_details !== undefined) {
      await db.query('UPDATE FITNESS_PLAN SET exercise_details = ? WHERE plan_id = ?', [exercise_details, req.params.plan_id]);
    }
    res.json({ message: 'Plan updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;