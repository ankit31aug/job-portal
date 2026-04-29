const express = require('express');
const { query } = require('../db-pg');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const alerts = (await query(
      'SELECT * FROM job_alerts WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    )).rows;
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { label, keywords, location, category, experience_min, experience_max } = req.body;
    if (!label) return res.status(400).json({ error: 'Alert label is required' });

    const insertResult = (await query(`
      INSERT INTO job_alerts (user_id, label, keywords, location, category, experience_min, experience_max)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      req.user.id,
      label.trim(),
      keywords || null,
      location || null,
      category || null,
      experience_min !== undefined ? parseInt(experience_min) : null,
      experience_max !== undefined ? parseInt(experience_max) : null,
    ])).rows[0];

    const newAlert = (await query(
      'SELECT * FROM job_alerts WHERE id = $1',
      [insertResult.id]
    )).rows[0];

    res.status(201).json(newAlert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/toggle', authenticate, async (req, res) => {
  try {
    const alert = (await query(
      'SELECT * FROM job_alerts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )).rows[0];
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    const newValue = alert.is_active ? 0 : 1;
    await query(
      'UPDATE job_alerts SET is_active = $1 WHERE id = $2',
      [newValue, alert.id]
    );
    res.json({ is_active: newValue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const alert = (await query(
      'SELECT id FROM job_alerts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )).rows[0];
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    await query('DELETE FROM job_alerts WHERE id = $1', [req.params.id]);
    res.json({ message: 'Alert deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
