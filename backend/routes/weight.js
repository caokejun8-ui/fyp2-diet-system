const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

// Add weight record
router.post('/add', verifyToken, async (req, res) => {
  const { user_id, weight_kg, height_cm } = req.body;

  // NEW: basic validation so bad data can't reach the database
  // (matches the boundary-value rules described in Chapter 5, B4/B5)
  if (!weight_kg || weight_kg <= 0 || weight_kg > 500) {
    return res.status(400).json({ error: 'Please enter a valid weight between 1 and 500 kg' });
  }
  if (!height_cm || height_cm <= 0 || height_cm > 300) {
    return res.status(400).json({ error: 'Please enter a valid height between 1 and 300 cm' });
  }

  const bmi = (weight_kg / ((height_cm / 100) ** 2)).toFixed(1);
  const recorded_date = new Date().toISOString().split('T')[0];
  try {
    await db.query(
      'INSERT INTO WEIGHT_RECORD (user_id, weight_kg, height_cm, bmi, recorded_date) VALUES (?, ?, ?, ?, ?)',
      [user_id, weight_kg, height_cm, bmi, recorded_date]
    );
    res.json({ message: 'Record added', bmi });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get history
router.get('/history/:user_id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM WEIGHT_RECORD WHERE user_id = ? ORDER BY recorded_date ASC',
      [req.params.user_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// NEW: Get progress toward the user's target weight
// Formula: progress% = |current - first| / |target - first| * 100, capped at 100
router.get('/progress/:user_id', verifyToken, async (req, res) => {
  try {
    // Get the user's target_weight
    const [userRows] = await db.query(
      'SELECT target_weight FROM USER WHERE user_id = ?',
      [req.params.user_id]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const targetWeight = userRows[0].target_weight;

    if (targetWeight === null || targetWeight === undefined) {
      return res.json({ hasTarget: false, message: 'No target weight set yet.' });
    }

    // Get first and most recent weight entries
    const [records] = await db.query(
      'SELECT weight_kg, recorded_date FROM WEIGHT_RECORD WHERE user_id = ? ORDER BY recorded_date ASC',
      [req.params.user_id]
    );

    if (records.length === 0) {
      return res.json({ hasTarget: true, targetWeight, message: 'No weight entries yet. Log your first weight to start tracking progress.' });
    }

    const firstWeight = Number(records[0].weight_kg);
    const currentWeight = Number(records[records.length - 1].weight_kg);
    const target = Number(targetWeight);

    let progressPercent;
    const totalChangeNeeded = Math.abs(target - firstWeight);

    if (totalChangeNeeded === 0) {
      // Target equals starting weight -- treat as already achieved
      progressPercent = 100;
    } else {
      const changeSoFar = Math.abs(currentWeight - firstWeight);
      progressPercent = Math.min(100, Math.round((changeSoFar / totalChangeNeeded) * 100));
    }

    res.json({
      hasTarget: true,
      firstWeight,
      currentWeight,
      targetWeight: target,
      progressPercent,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a weight record
router.delete('/:record_id', verifyToken, async (req, res) => {
  try {
    // NEW: only delete the record if it belongs to the logged-in user
    // (previously anyone could delete any record just by guessing the ID)
    const [result] = await db.query(
      'DELETE FROM WEIGHT_RECORD WHERE record_id = ? AND user_id = ?',
      [req.params.record_id, req.user.user_id]
    );
    if (result.affectedRows === 0) {
      return res.status(403).json({ error: 'Not allowed to delete this record' });
    }
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;