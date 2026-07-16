const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all plans
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
// Admin: update a plan's meal/exercise details
router.put('/admin/:plan_id', async (req, res) => {
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