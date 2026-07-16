const express = require('express');
const router = express.Router();
const db = require('../db');

// Get profile info
router.get('/:user_id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT user_id, name, email, age, gender FROM USER WHERE user_id = ?',
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

// Update profile info (name, age, gender only)
router.put('/:user_id', async (req, res) => {
  const { name, age, gender } = req.body;
  try {
    await db.query(
      'UPDATE USER SET name = ?, age = ?, gender = ? WHERE user_id = ?',
      [name, age, gender, req.params.user_id]
    );
    const [rows] = await db.query(
      'SELECT user_id, name, email, age, gender FROM USER WHERE user_id = ?',
      [req.params.user_id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;