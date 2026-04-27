const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (req, res) => {
  const rows = db.prepare(`
    SELECT b.id, b.job_id, b.created_at,
      j.title, j.company, j.location, j.job_type, j.category, j.department,
      j.experience_min, j.experience_max, j.salary_min, j.salary_max, j.skills, j.is_active
    FROM bookmarks b
    JOIN jobs j ON b.job_id = j.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `).all(req.user.id);
  res.json(rows);
});

router.get('/check/:jobId', authenticate, (req, res) => {
  const row = db.prepare('SELECT id FROM bookmarks WHERE user_id = ? AND job_id = ?')
    .get(req.user.id, req.params.jobId);
  res.json({ bookmarked: !!row });
});

router.post('/', authenticate, (req, res) => {
  const { job_id } = req.body;
  if (!job_id) return res.status(400).json({ error: 'job_id required' });
  db.prepare('INSERT OR IGNORE INTO bookmarks (user_id, job_id) VALUES (?, ?)').run(req.user.id, job_id);
  res.json({ bookmarked: true });
});

router.delete('/:jobId', authenticate, (req, res) => {
  db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND job_id = ?').run(req.user.id, req.params.jobId);
  res.json({ bookmarked: false });
});

module.exports = router;
