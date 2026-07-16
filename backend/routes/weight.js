const express = require('express');
const router = express.Router();
const db = require('../db');

// Add weight record
router.post('/add', async (req, res) => {
  const { user_id, weight_kg, height_cm } = req.body;
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
router.get('/history/:user_id', async (req, res) => {
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
// Delete a weight record
router.delete('/:record_id', async (req, res) => {
  try {
    await db.query('DELETE FROM WEIGHT_RECORD WHERE record_id = ?', [req.params.record_id]);
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;