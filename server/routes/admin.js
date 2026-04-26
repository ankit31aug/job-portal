const express = require('express');
const db = require('../db');
const { authenticate, requireHR } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authenticate, requireHR, (req, res) => {
  const totalJobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE is_active = 1').get();
  const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get();
  const pending = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'pending'").get();
  const inProgress = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status IN ('shortlisted','interviewed')").get();
  const hired = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'hired'").get();
  res.json({
    totalJobs: totalJobs.count,
    totalApplications: totalApplications.count,
    pending: pending.count,
    inProgress: inProgress.count,
    hired: hired.count,
  });
});

router.get('/jobs', authenticate, requireHR, (req, res) => {
  const jobs = db.prepare(`
    SELECT j.*, u.name as employer_name,
    (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as application_count
    FROM jobs j LEFT JOIN users u ON j.employer_id = u.id
    ORDER BY j.created_at DESC
  `).all();
  res.json(jobs);
});

router.post('/jobs', authenticate, requireHR, (req, res) => {
  const { title, company, location, job_type, category, department, experience_min, experience_max,
    salary_min, salary_max, description, requirements, skills, openings } = req.body;

  if (!title || !company || !location || !category || !description || !requirements || !skills) {
    return res.status(400).json({ error: 'All required fields must be filled' });
  }

  const result = db.prepare(`
    INSERT INTO jobs (employer_id, title, company, location, job_type, category, department,
      experience_min, experience_max, salary_min, salary_max, description, requirements, skills, openings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, title, company, location, job_type || 'Full-time', category,
    department || 'General', experience_min || 0, experience_max || 5,
    salary_min || null, salary_max || null, description, requirements, skills, openings || 1);

  res.status(201).json(db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/jobs/:id', authenticate, requireHR, (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const { title, company, location, job_type, category, department, experience_min, experience_max,
    salary_min, salary_max, description, requirements, skills, openings, is_active } = req.body;

  db.prepare(`
    UPDATE jobs SET title=?, company=?, location=?, job_type=?, category=?, department=?,
    experience_min=?, experience_max=?, salary_min=?, salary_max=?, description=?,
    requirements=?, skills=?, openings=?, is_active=? WHERE id=?
  `).run(title, company, location, job_type, category, department || job.department || 'General',
    experience_min, experience_max, salary_min, salary_max, description, requirements, skills,
    openings, is_active !== undefined ? is_active : job.is_active, req.params.id);

  res.json(db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id));
});

router.patch('/jobs/:id/toggle', authenticate, requireHR, (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const newState = job.is_active ? 0 : 1;
  db.prepare('UPDATE jobs SET is_active = ? WHERE id = ?').run(newState, req.params.id);
  res.json({ is_active: newState });
});

router.get('/applications/job/:jobId', authenticate, requireHR, (req, res) => {
  const applications = db.prepare(`
    SELECT a.*, u.email as user_email FROM applications a
    JOIN users u ON a.applicant_id = u.id
    WHERE a.job_id = ?
    ORDER BY a.match_score DESC, a.applied_at DESC
  `).all(req.params.jobId);
  res.json(applications);
});

router.patch('/applications/:id/status', authenticate, requireHR, (req, res) => {
  const { status } = req.body;
  const valid = ['pending', 'shortlisted', 'interviewed', 'rejected', 'hired'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const app = db.prepare('SELECT id FROM applications WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });

  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Status updated', status });
});

router.get('/users', authenticate, requireHR, (req, res) => {
  const users = db.prepare(
    'SELECT id, name, email, role, company_name, created_at FROM users ORDER BY created_at DESC'
  ).all();
  res.json(users);
});

module.exports = router;
