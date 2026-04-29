const express = require('express');
const { query } = require('../db-pg');
const { authenticate, requireHR } = require('../middleware/auth');
const { statusUpdateEmail, sendMail } = require('../utils/email');

const router = express.Router();

router.get('/stats', authenticate, requireHR, async (req, res) => {
  try {
    const [
      { rows: [{ count: totalJobsCount }] },
      { rows: [{ count: totalAppsCount }] },
      { rows: [{ count: pendingCount }] },
      { rows: [{ count: inProgressCount }] },
      { rows: [{ count: hiredCount }] },
    ] = await Promise.all([
      query('SELECT COUNT(*) as count FROM jobs WHERE is_active = 1'),
      query('SELECT COUNT(*) as count FROM applications'),
      query("SELECT COUNT(*) as count FROM applications WHERE status = 'pending'"),
      query("SELECT COUNT(*) as count FROM applications WHERE status IN ('shortlisted','interviewed')"),
      query("SELECT COUNT(*) as count FROM applications WHERE status = 'hired'"),
    ]);

    res.json({
      totalJobs: parseInt(totalJobsCount),
      totalApplications: parseInt(totalAppsCount),
      pending: parseInt(pendingCount),
      inProgress: parseInt(inProgressCount),
      hired: parseInt(hiredCount),
    });
  } catch (err) {
    console.error('GET /admin/stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/jobs', authenticate, requireHR, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let idx = 1;
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(`(j.title ILIKE $${idx} OR j.company ILIKE $${idx + 1})`);
      params.push(`%${search}%`, `%${search}%`);
      idx += 2;
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const countParams = [...params];

    const { rows: [{ count }] } = await query(
      `SELECT COUNT(*) as count FROM jobs j ${where}`,
      countParams
    );
    const total = parseInt(count);

    params.push(parseInt(limit), offset);
    const limitIdx = idx++;
    const offsetIdx = idx++;

    const { rows: jobs } = await query(
      `SELECT j.*, u.name as employer_name,
         (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as application_count
       FROM jobs j LEFT JOIN users u ON j.employer_id = u.id
       ${where}
       ORDER BY j.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );

    res.json({
      jobs,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error('GET /admin/jobs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/jobs', authenticate, requireHR, async (req, res) => {
  try {
    const {
      title, company, location, job_type, category, department, experience_min, experience_max,
      salary_min, salary_max, description, requirements, skills, openings,
    } = req.body;

    if (!title || !company || !location || !category || !description || !requirements || !skills) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    const newJobId = (await query(
      `INSERT INTO jobs (employer_id, title, company, location, job_type, category, department,
         experience_min, experience_max, salary_min, salary_max, description, requirements, skills, openings)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id`,
      [
        req.user.id, title, company, location, job_type || 'Full-time', category,
        department || 'General', experience_min || 0, experience_max || 5,
        salary_min || null, salary_max || null, description, requirements, skills, openings || 1,
      ]
    )).rows[0].id;

    const job = (await query('SELECT * FROM jobs WHERE id = $1', [newJobId])).rows[0];
    res.status(201).json(job);
  } catch (err) {
    console.error('POST /admin/jobs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/jobs/:id', authenticate, requireHR, async (req, res) => {
  try {
    const job = (await query(
      'SELECT * FROM jobs WHERE id = $1',
      [req.params.id]
    )).rows[0];
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const {
      title, company, location, job_type, category, department, experience_min, experience_max,
      salary_min, salary_max, description, requirements, skills, openings, is_active,
    } = req.body;

    await query(
      `UPDATE jobs SET title=$1, company=$2, location=$3, job_type=$4, category=$5, department=$6,
         experience_min=$7, experience_max=$8, salary_min=$9, salary_max=$10,
         description=$11, requirements=$12, skills=$13, openings=$14, is_active=$15
       WHERE id=$16`,
      [
        title, company, location, job_type, category, department || job.department || 'General',
        experience_min, experience_max, salary_min, salary_max, description, requirements, skills,
        openings, is_active !== undefined ? is_active : job.is_active,
        req.params.id,
      ]
    );

    const updated = (await query('SELECT * FROM jobs WHERE id = $1', [req.params.id])).rows[0];
    res.json(updated);
  } catch (err) {
    console.error('PUT /admin/jobs/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/jobs/:id/toggle', authenticate, requireHR, async (req, res) => {
  try {
    const job = (await query(
      'SELECT * FROM jobs WHERE id = $1',
      [req.params.id]
    )).rows[0];
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const newState = job.is_active ? 0 : 1;
    await query('UPDATE jobs SET is_active = $1 WHERE id = $2', [newState, req.params.id]);
    res.json({ is_active: newState });
  } catch (err) {
    console.error('PATCH /admin/jobs/:id/toggle error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/applications/job/:jobId', authenticate, requireHR, async (req, res) => {
  try {
    const { rows: applications } = await query(
      `SELECT a.*, u.email as user_email FROM applications a
       JOIN users u ON a.applicant_id = u.id
       WHERE a.job_id = $1
       ORDER BY a.match_score DESC, a.applied_at DESC`,
      [req.params.jobId]
    );
    res.json(applications);
  } catch (err) {
    console.error('GET /admin/applications/job/:jobId error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/applications/:id/status', authenticate, requireHR, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending', 'shortlisted', 'interviewed', 'rejected', 'hired'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const app = (await query(
      `SELECT a.*, j.title as job_title FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.id = $1`,
      [req.params.id]
    )).rows[0];
    if (!app) return res.status(404).json({ error: 'Application not found' });

    await query('UPDATE applications SET status = $1 WHERE id = $2', [status, req.params.id]);

    if (['shortlisted', 'interviewed', 'hired', 'rejected'].includes(status)) {
      try {
        await sendMail({
          to: app.email,
          subject: 'QCI Job Portal — Application Status Update',
          html: statusUpdateEmail(app.full_name, app.job_title, status),
        });
      } catch (_) {}
    }

    res.json({ message: 'Status updated', status });
  } catch (err) {
    console.error('PATCH /admin/applications/:id/status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/users', authenticate, requireHR, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: [{ count }] } = await query('SELECT COUNT(*) as count FROM users');
    const total = parseInt(count);

    const { rows: users } = await query(
      'SELECT id, name, email, role, company_name, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [parseInt(limit), offset]
    );

    res.json({
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error('GET /admin/users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
