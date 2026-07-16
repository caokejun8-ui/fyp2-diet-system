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

module.exports = router;