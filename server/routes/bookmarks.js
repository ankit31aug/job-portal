const express = require('express');
const { query } = require('../db-pg');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const rows = (await query(`
      SELECT b.id, b.job_id, b.created_at,
        j.title, j.company, j.location, j.job_type, j.category, j.department,
        j.experience_min, j.experience_max, j.salary_min, j.salary_max, j.skills, j.is_active
      FROM bookmarks b
      JOIN jobs j ON b.job_id = j.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [req.user.id])).rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/check/:jobId', authenticate, async (req, res) => {
  try {
    const row = (await query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND job_id = $2',
      [req.user.id, req.params.jobId]
    )).rows[0];
    res.json({ bookmarked: !!row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { job_id } = req.body;
    if (!job_id) return res.status(400).json({ error: 'job_id required' });
    await query(
      'INSERT INTO bookmarks (user_id, job_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, job_id]
    );
    res.json({ bookmarked: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:jobId', authenticate, async (req, res) => {
  try {
    await query(
      'DELETE FROM bookmarks WHERE user_id = $1 AND job_id = $2',
      [req.user.id, req.params.jobId]
    );
    res.json({ bookmarked: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
