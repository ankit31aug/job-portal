const express = require('express');
const { query } = require('../db-pg');
const { authenticate, requireEmployer } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { search, category, department, job_type, location, experience, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let idx = 1;
    const conditions = ['j.is_active = 1'];
    const params = [];

    if (search) {
      const s = `%${search}%`;
      conditions.push(
        `(j.title ILIKE $${idx} OR j.company ILIKE $${idx + 1} OR j.skills ILIKE $${idx + 2} OR j.description ILIKE $${idx + 3})`
      );
      params.push(s, s, s, s);
      idx += 4;
    }
    if (department) {
      conditions.push(`j.department = $${idx++}`);
      params.push(department);
    }
    if (category) {
      conditions.push(`j.category = $${idx++}`);
      params.push(category);
    }
    if (job_type) {
      conditions.push(`j.job_type = $${idx++}`);
      params.push(job_type);
    }
    if (location) {
      conditions.push(`j.location ILIKE $${idx++}`);
      params.push(`%${location}%`);
    }
    if (experience !== undefined && experience !== '') {
      const [expMin, expMax] = String(experience).split('-').map(Number);
      if (!isNaN(expMin) && !isNaN(expMax)) {
        conditions.push(`j.experience_min <= $${idx++} AND j.experience_max >= $${idx++}`);
        params.push(expMax, expMin);
      } else if (!isNaN(expMin)) {
        conditions.push(`j.experience_min <= $${idx++}`);
        params.push(expMin);
      }
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
       FROM jobs j
       LEFT JOIN users u ON j.employer_id = u.id
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
    console.error('GET /jobs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT DISTINCT category FROM jobs WHERE is_active = 1 ORDER BY category'
    );
    res.json(rows.map(c => c.category));
  } catch (err) {
    console.error('GET /jobs/categories error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const { rows: byDept } = await query(
      `SELECT department, COUNT(*) as job_count, SUM(openings) as total_openings
       FROM jobs WHERE is_active = 1 GROUP BY department`
    );
    const { rows: [totalRow] } = await query(
      'SELECT COUNT(*) as c FROM jobs WHERE is_active = 1'
    );
    const { rows: [openingsRow] } = await query(
      'SELECT SUM(openings) as s FROM jobs WHERE is_active = 1'
    );

    const byDepartment = {};
    const openingsByDept = {};
    for (const row of byDept) {
      byDepartment[row.department || 'General'] = parseInt(row.job_count);
      openingsByDept[row.department || 'General'] = parseInt(row.total_openings) || 0;
    }

    res.json({
      byDepartment,
      openingsByDept,
      total: parseInt(totalRow.c),
      totalOpenings: parseInt(openingsRow.s) || 0,
    });
  } catch (err) {
    console.error('GET /jobs/stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my', authenticate, requireEmployer, async (req, res) => {
  try {
    const { rows: jobs } = await query(
      `SELECT j.*, (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as application_count
       FROM jobs j WHERE j.employer_id = $1 ORDER BY j.created_at DESC`,
      [req.user.id]
    );
    res.json(jobs);
  } catch (err) {
    console.error('GET /jobs/my error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const job = (await query(
      `SELECT j.*, u.name as employer_name, u.company_name
       FROM jobs j LEFT JOIN users u ON j.employer_id = u.id
       WHERE j.id = $1`,
      [req.params.id]
    )).rows[0];

    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    console.error('GET /jobs/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticate, requireEmployer, async (req, res) => {
  try {
    const {
      title, location, job_type, category, department, experience_min, experience_max,
      salary_min, salary_max, description, requirements, skills, openings,
    } = req.body;

    if (!title || !location || !category || !description || !requirements || !skills) {
      return res.status(400).json({ error: 'All required fields must be filled' });
    }

    const employer = (await query(
      'SELECT company_name FROM users WHERE id = $1',
      [req.user.id]
    )).rows[0];

    const newJobId = (await query(
      `INSERT INTO jobs (employer_id, title, company, location, job_type, category, department,
         experience_min, experience_max, salary_min, salary_max, description, requirements, skills, openings)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id`,
      [
        req.user.id, title, employer.company_name, location, job_type || 'Full-time', category,
        department || 'General', experience_min || 0, experience_max || 5,
        salary_min || null, salary_max || null, description, requirements, skills, openings || 1,
      ]
    )).rows[0].id;

    const job = (await query('SELECT * FROM jobs WHERE id = $1', [newJobId])).rows[0];
    res.status(201).json(job);
  } catch (err) {
    console.error('POST /jobs error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticate, requireEmployer, async (req, res) => {
  try {
    const job = (await query(
      'SELECT * FROM jobs WHERE id = $1 AND employer_id = $2',
      [req.params.id, req.user.id]
    )).rows[0];
    if (!job) return res.status(404).json({ error: 'Job not found or unauthorized' });

    const {
      title, location, job_type, category, experience_min, experience_max,
      salary_min, salary_max, description, requirements, skills, openings, is_active,
    } = req.body;

    await query(
      `UPDATE jobs SET title=$1, location=$2, job_type=$3, category=$4,
         experience_min=$5, experience_max=$6, salary_min=$7, salary_max=$8,
         description=$9, requirements=$10, skills=$11, openings=$12, is_active=$13
       WHERE id=$14`,
      [
        title, location, job_type, category, experience_min, experience_max,
        salary_min, salary_max, description, requirements, skills, openings,
        is_active !== undefined ? is_active : job.is_active,
        req.params.id,
      ]
    );

    const updated = (await query('SELECT * FROM jobs WHERE id = $1', [req.params.id])).rows[0];
    res.json(updated);
  } catch (err) {
    console.error('PUT /jobs/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticate, requireEmployer, async (req, res) => {
  try {
    const job = (await query(
      'SELECT * FROM jobs WHERE id = $1 AND employer_id = $2',
      [req.params.id, req.user.id]
    )).rows[0];
    if (!job) return res.status(404).json({ error: 'Job not found or unauthorized' });

    await query('UPDATE jobs SET is_active = 0 WHERE id = $1', [req.params.id]);
    res.json({ message: 'Job deactivated successfully' });
  } catch (err) {
    console.error('DELETE /jobs/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
