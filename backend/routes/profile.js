const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

// Get profile info
router.get('/:user_id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT user_id, name, email, age, gender, target_weight, dietary_preference, nut_free FROM USER WHERE user_id = ?',
      [req.params.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile info (name, age, gender, target_weight, dietary_preference, nut_free)
router.put('/:user_id', verifyToken, async (req, res) => {
  const { name, age, gender, target_weight, dietary_preference, nut_free } = req.body;

  // basic validation (matches Chapter 5, B6/B7)
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name cannot be empty' });
  }
  if (!age || age < 10 || age > 100) {
    return res.status(400).json({ error: 'Please enter a valid age between 10 and 100' });
  }

  // target_weight is optional, but if provided must be a sensible number
  let targetWeightValue = null;
  if (target_weight !== undefined && target_weight !== null && target_weight !== '') {
    const tw = Number(target_weight);
    if (isNaN(tw) || tw <= 0 || tw > 500) {
      return res.status(400).json({ error: 'Please enter a valid target weight between 1 and 500 kg' });
    }
    targetWeightValue = tw;
  }

  // NEW: dietary_preference must be one of the two supported values
  const allowedPreferences = ['none', 'vegetarian'];
  const dietaryPreferenceValue = allowedPreferences.includes(dietary_preference) ? dietary_preference : 'none';

  // NEW: nut_free is a simple true/false flag
  const nutFreeValue = nut_free === true || nut_free === 'true' || nut_free === 1 ? 1 : 0;

  try {
    await db.query(
      'UPDATE USER SET name = ?, age = ?, gender = ?, target_weight = ?, dietary_preference = ?, nut_free = ? WHERE user_id = ?',
      [name, age, gender, targetWeightValue, dietaryPreferenceValue, nutFreeValue, req.params.user_id]
    );
    const [rows] = await db.query(
      'SELECT user_id, name, email, age, gender, target_weight, dietary_preference, nut_free FROM USER WHERE user_id = ?',
      [req.params.user_id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;