const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const alerts = db.prepare('SELECT * FROM job_alerts WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(alerts);
});

router.post('/', authenticate, (req, res) => {
  const { label, keywords, location, category, experience_min, experience_max } = req.body;
  if (!label) return res.status(400).json({ error: 'Alert label is required' });

  const result = db.prepare(`
    INSERT INTO job_alerts (user_id, label, keywords, location, category, experience_min, experience_max)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, label.trim(), keywords || null, location || null, category || null,
    experience_min !== undefined ? parseInt(experience_min) : null,
    experience_max !== undefined ? parseInt(experience_max) : null);

  res.status(201).json(db.prepare('SELECT * FROM job_alerts WHERE id = ?').get(result.lastInsertRowid));
});

router.patch('/:id/toggle', authenticate, (req, res) => {
  const alert = db.prepare('SELECT * FROM job_alerts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  db.prepare('UPDATE job_alerts SET is_active = ? WHERE id = ?').run(alert.is_active ? 0 : 1, alert.id);
  res.json({ is_active: alert.is_active ? 0 : 1 });
});

router.delete('/:id', authenticate, (req, res) => {
  const alert = db.prepare('SELECT id FROM job_alerts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  db.prepare('DELETE FROM job_alerts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Alert deleted' });
});

module.exports = router;
