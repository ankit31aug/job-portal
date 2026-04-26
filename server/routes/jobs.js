const express = require('express');
const db = require('../db');
const { authenticate, requireEmployer } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  const { search, category, job_type, location, experience, page = 1, limit = 10 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let conditions = ['j.is_active = 1'];
  const params = [];

  if (search) {
    conditions.push('(j.title LIKE ? OR j.company LIKE ? OR j.skills LIKE ? OR j.description LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (category) {
    conditions.push('j.category = ?');
    params.push(category);
  }
  if (job_type) {
    conditions.push('j.job_type = ?');
    params.push(job_type);
  }
  if (location) {
    conditions.push('j.location LIKE ?');
    params.push(`%${location}%`);
  }
  if (experience !== undefined) {
    conditions.push('j.experience_min <= ?');
    params.push(parseInt(experience));
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as count FROM jobs j ${where}`).get(...params);
  const jobs = db.prepare(`
    SELECT j.*, u.name as employer_name,
    (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as application_count
    FROM jobs j
    LEFT JOIN users u ON j.employer_id = u.id
    ${where}
    ORDER BY j.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);

  res.json({ jobs, total: total.count, page: parseInt(page), pages: Math.ceil(total.count / parseInt(limit)) });
});

router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM jobs WHERE is_active = 1 ORDER BY category').all();
  res.json(categories.map(c => c.category));
});

router.get('/my', authenticate, requireEmployer, (req, res) => {
  const jobs = db.prepare(`
    SELECT j.*, (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as application_count
    FROM jobs j WHERE j.employer_id = ? ORDER BY j.created_at DESC
  `).all(req.user.id);
  res.json(jobs);
});

router.get('/:id', (req, res) => {
  const job = db.prepare(`
    SELECT j.*, u.name as employer_name, u.company_name
    FROM jobs j LEFT JOIN users u ON j.employer_id = u.id
    WHERE j.id = ?
  `).get(req.params.id);

  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

router.post('/', authenticate, requireEmployer, (req, res) => {
  const {
    title, location, job_type, category, experience_min, experience_max,
    salary_min, salary_max, description, requirements, skills, openings
  } = req.body;

  if (!title || !location || !category || !description || !requirements || !skills) {
    return res.status(400).json({ error: 'All required fields must be filled' });
  }

  const employer = db.prepare('SELECT company_name FROM users WHERE id = ?').get(req.user.id);

  const result = db.prepare(`
    INSERT INTO jobs (employer_id, title, company, location, job_type, category, experience_min, experience_max,
      salary_min, salary_max, description, requirements, skills, openings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, title, employer.company_name, location, job_type || 'Full-time', category,
    experience_min || 0, experience_max || 5, salary_min || null, salary_max || null,
    description, requirements, skills, openings || 1);

  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(job);
});

router.put('/:id', authenticate, requireEmployer, (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND employer_id = ?').get(req.params.id, req.user.id);
  if (!job) return res.status(404).json({ error: 'Job not found or unauthorized' });

  const {
    title, location, job_type, category, experience_min, experience_max,
    salary_min, salary_max, description, requirements, skills, openings, is_active
  } = req.body;

  db.prepare(`
    UPDATE jobs SET title=?, location=?, job_type=?, category=?, experience_min=?, experience_max=?,
    salary_min=?, salary_max=?, description=?, requirements=?, skills=?, openings=?, is_active=?
    WHERE id=?
  `).run(title, location, job_type, category, experience_min, experience_max,
    salary_min, salary_max, description, requirements, skills, openings,
    is_active !== undefined ? is_active : job.is_active, req.params.id);

  res.json(db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id));
});

router.delete('/:id', authenticate, requireEmployer, (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND employer_id = ?').get(req.params.id, req.user.id);
  if (!job) return res.status(404).json({ error: 'Job not found or unauthorized' });

  db.prepare('UPDATE jobs SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Job deactivated successfully' });
});

module.exports = router;
