const express = require('express');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const { query } = require('../db-pg');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/gallery')),
  filename: (req, file, cb) => cb(null, `gallery_${Date.now()}${path.extname(file.originalname)}`),
});
const boardStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/boards')),
  filename: (req, file, cb) => cb(null, `board_${Date.now()}${path.extname(file.originalname)}`),
});

const galleryUpload = multer({ storage: galleryStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => { if (file.mimetype.startsWith('image/')) cb(null, true); else cb(new Error('Images only')); } });
const boardUpload   = multer({ storage: boardStorage,   limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => { if (file.mimetype.startsWith('image/')) cb(null, true); else cb(new Error('Images only')); } });

// ── Dashboard Stats ────────────────────────────────────────────────────────
router.get('/stats', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const users   = (await query('SELECT COUNT(*) as c FROM users', [])).rows[0];
    const jobs    = (await query('SELECT COUNT(*) as c FROM jobs WHERE is_active = 1', [])).rows[0];
    const apps    = (await query('SELECT COUNT(*) as c FROM applications', [])).rows[0];
    const hired   = (await query("SELECT COUNT(*) as c FROM applications WHERE status='hired'", [])).rows[0];
    const hrRoles = (await query('SELECT COUNT(*) as c FROM hr_roles', [])).rows[0];
    const gallery = (await query('SELECT COUNT(*) as c FROM gallery WHERE is_active=1', [])).rows[0];
    res.json({
      totalUsers: parseInt(users.c),
      totalJobs: parseInt(jobs.c),
      totalApplications: parseInt(apps.c),
      hired: parseInt(hired.c),
      hrRoles: parseInt(hrRoles.c),
      galleryItems: parseInt(gallery.c),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// HR ROLE MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════
router.get('/hr-roles', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const roles = (await query(`
      SELECT r.*, u.name as created_by_name,
      (SELECT COUNT(*) FROM users WHERE hr_role_id = r.id) as assigned_count
      FROM hr_roles r LEFT JOIN users u ON r.created_by = u.id
      ORDER BY r.created_at DESC
    `, [])).rows;
    res.json(roles.map(r => ({ ...r, permissions: JSON.parse(r.permissions || '[]') })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/hr-roles', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    if (!name) return res.status(400).json({ error: 'Role name is required' });
    const perms = Array.isArray(permissions) ? permissions : [];

    const insertResult = (await query(
      'INSERT INTO hr_roles (name, description, permissions, created_by) VALUES ($1, $2, $3, $4) RETURNING id',
      [name.trim(), description || '', JSON.stringify(perms), req.user.id]
    )).rows[0];

    const role = (await query('SELECT * FROM hr_roles WHERE id = $1', [insertResult.id])).rows[0];
    res.status(201).json({ ...role, permissions: JSON.parse(role.permissions) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/hr-roles/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const role = (await query('SELECT * FROM hr_roles WHERE id = $1', [req.params.id])).rows[0];
    if (!role) return res.status(404).json({ error: 'HR role not found' });
    const perms = Array.isArray(permissions) ? permissions : JSON.parse(role.permissions || '[]');
    await query(
      'UPDATE hr_roles SET name=$1, description=$2, permissions=$3 WHERE id=$4',
      [name || role.name, description ?? role.description, JSON.stringify(perms), req.params.id]
    );
    const updated = (await query('SELECT * FROM hr_roles WHERE id = $1', [req.params.id])).rows[0];
    res.json({ ...updated, permissions: JSON.parse(updated.permissions) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/hr-roles/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    await query('UPDATE users SET hr_role_id = NULL WHERE hr_role_id = $1', [req.params.id]);
    await query('DELETE FROM hr_roles WHERE id = $1', [req.params.id]);
    res.json({ message: 'HR role deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════
router.get('/users', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];

    if (role) {
      params.push(role);
      conditions.push(`u.role = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.name ILIKE $${params.length}`);
      params.push(`%${search}%`);
      conditions[conditions.length - 1] += ` OR u.email ILIKE $${params.length})`;
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const totalResult = (await query(
      `SELECT COUNT(*) as c FROM users u ${where}`,
      params
    )).rows[0];
    const total = parseInt(totalResult.c);

    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;

    const users = (await query(`
      SELECT u.id, u.name, u.email, u.role, u.company_name, u.phone, u.city, u.state, u.is_verified, u.hr_role_id, u.created_at,
      r.name as hr_role_name
      FROM users u LEFT JOIN hr_roles r ON u.hr_role_id = r.id
      ${where} ORDER BY u.created_at DESC LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `, [...params, parseInt(limit), offset])).rows;

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/role', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { role, hr_role_id } = req.body;
    const validRoles = ['jobseeker', 'employer', 'hr', 'super_admin'];
    if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });
    await query(
      'UPDATE users SET role=$1, hr_role_id=$2 WHERE id=$3',
      [role, hr_role_id || null, req.params.id]
    );
    res.json({ message: 'User role updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/create-hr', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, phone, hr_role_id } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });

    const existing = (await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    )).rows[0];
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const insertResult = (await query(
      `INSERT INTO users (name, email, password, role, hr_role_id, company_name, phone, is_verified)
       VALUES ($1, $2, $3, 'hr', $4, $5, $6, 1) RETURNING id`,
      [
        name.trim(),
        email.toLowerCase().trim(),
        bcrypt.hashSync(password, 10),
        hr_role_id || null,
        'Quality Council of India',
        phone || null,
      ]
    )).rows[0];

    const user = (await query(
      'SELECT id, name, email, role, hr_role_id FROM users WHERE id = $1',
      [insertResult.id]
    )).rows[0];
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/password', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const user = (await query('SELECT id, role FROM users WHERE id = $1', [req.params.id])).rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    await query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [bcrypt.hashSync(password, 10), req.params.id]
    );
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const user = (await query('SELECT role FROM users WHERE id = $1', [req.params.id])).rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'super_admin') return res.status(403).json({ error: 'Cannot delete super admin' });
    // Remove all FK-referenced rows before deleting the user
    await query('DELETE FROM job_alerts WHERE user_id = $1', [req.params.id]);
    await query('DELETE FROM bookmarks WHERE user_id = $1', [req.params.id]);
    await query('DELETE FROM application_status_history WHERE application_id IN (SELECT id FROM applications WHERE applicant_id = $1)', [req.params.id]);
    await query('DELETE FROM applications WHERE applicant_id = $1', [req.params.id]);
    await query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// GALLERY MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════
router.get('/gallery', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const items = (await query(
      'SELECT * FROM gallery ORDER BY display_order ASC, created_at DESC',
      []
    )).rows;
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/gallery', authenticate, requireSuperAdmin, galleryUpload.single('image'), async (req, res) => {
  try {
    const { title, description, category, display_order } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const insertResult = (await query(
      'INSERT INTO gallery (title, description, image_path, category, display_order) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [
        title,
        description || '',
        req.file ? `/uploads/gallery/${req.file.filename}` : null,
        category || 'general',
        parseInt(display_order) || 0,
      ]
    )).rows[0];

    const item = (await query('SELECT * FROM gallery WHERE id = $1', [insertResult.id])).rows[0];
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/gallery/reorder/batch', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });
    for (const { id, display_order } of items) {
      await query('UPDATE gallery SET display_order=$1 WHERE id=$2', [display_order, id]);
    }
    res.json({ message: 'Gallery reordered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/gallery/:id', authenticate, requireSuperAdmin, galleryUpload.single('image'), async (req, res) => {
  try {
    const item = (await query('SELECT * FROM gallery WHERE id = $1', [req.params.id])).rows[0];
    if (!item) return res.status(404).json({ error: 'Gallery item not found' });
    const { title, description, category, display_order, is_active } = req.body;
    await query(
      'UPDATE gallery SET title=$1, description=$2, category=$3, display_order=$4, is_active=$5, image_path=$6 WHERE id=$7',
      [
        title || item.title,
        description ?? item.description,
        category || item.category,
        parseInt(display_order) || item.display_order,
        is_active !== undefined ? parseInt(is_active) : item.is_active,
        req.file ? `/uploads/gallery/${req.file.filename}` : item.image_path,
        req.params.id,
      ]
    );
    const updated = (await query('SELECT * FROM gallery WHERE id = $1', [req.params.id])).rows[0];
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/gallery/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    await query('DELETE FROM gallery WHERE id = $1', [req.params.id]);
    res.json({ message: 'Gallery item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// BOARD CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════
router.get('/boards', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const boards = (await query(
      'SELECT * FROM board_config ORDER BY display_order ASC',
      []
    )).rows;
    res.json(boards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/boards/reorder/batch', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });
    for (const { id, display_order } of items) {
      await query('UPDATE board_config SET display_order=$1 WHERE id=$2', [display_order, id]);
    }
    res.json({ message: 'Boards reordered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/boards/:id', authenticate, requireSuperAdmin, boardUpload.single('image'), async (req, res) => {
  try {
    const board = (await query('SELECT * FROM board_config WHERE id = $1', [req.params.id])).rows[0];
    if (!board) return res.status(404).json({ error: 'Board not found' });
    const { name, full_name, description, color, display_order, is_active } = req.body;
    await query(
      `UPDATE board_config SET name=$1, full_name=$2, description=$3, color=$4, display_order=$5, is_active=$6, image_path=$7 WHERE id=$8`,
      [
        name || board.name,
        full_name || board.full_name,
        description ?? board.description,
        color || board.color,
        parseInt(display_order) || board.display_order,
        is_active !== undefined ? parseInt(is_active) : board.is_active,
        req.file ? `/uploads/boards/${req.file.filename}` : board.image_path,
        req.params.id,
      ]
    );
    const updated = (await query('SELECT * FROM board_config WHERE id = $1', [req.params.id])).rows[0];
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// FULL SETTINGS (extends existing /api/settings)
// ══════════════════════════════════════════════════════════════════════════
router.get('/settings', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const rows = (await query('SELECT * FROM settings ORDER BY category, key', [])).rows;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const updates = req.body;
    for (const [k, v] of Object.entries(updates)) {
      await query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
        [k, v]
      );
    }
    res.json({ message: 'Settings saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// JOBS (full control)
// ══════════════════════════════════════════════════════════════════════════
router.get('/jobs', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, department } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(j.title ILIKE $${params.length}`);
      params.push(`%${search}%`);
      conditions[conditions.length - 1] += ` OR j.company ILIKE $${params.length})`;
    }
    if (department) {
      params.push(department);
      conditions.push(`j.department = $${params.length}`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const totalResult = (await query(
      `SELECT COUNT(*) as c FROM jobs j ${where}`,
      params
    )).rows[0];
    const total = parseInt(totalResult.c);

    const limitIndex = params.length + 1;
    const offsetIndex = params.length + 2;

    const jobs = (await query(
      `SELECT j.*, u.name as employer_name,
       (SELECT COUNT(*) FROM applications WHERE job_id=j.id) as application_count
       FROM jobs j LEFT JOIN users u ON j.employer_id=u.id
       ${where} ORDER BY j.created_at DESC LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
      [...params, parseInt(limit), offset]
    )).rows;

    res.json({ jobs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/jobs', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { title, company, location, job_type, category, department, experience_min, experience_max, salary_min, salary_max, description, requirements, skills, openings } = req.body;
    if (!title || !location || !category || !description || !requirements || !skills)
      return res.status(400).json({ error: 'Required fields missing' });

    const insertResult = (await query(
      `INSERT INTO jobs (employer_id, title, company, location, job_type, category, department, experience_min, experience_max, salary_min, salary_max, description, requirements, skills, openings)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id`,
      [
        req.user.id,
        title,
        company || 'Quality Council of India',
        location,
        job_type || 'Full-time',
        category,
        department || 'General',
        experience_min || 0,
        experience_max || 5,
        salary_min || null,
        salary_max || null,
        description,
        requirements,
        skills,
        openings || 1,
      ]
    )).rows[0];

    const job = (await query('SELECT * FROM jobs WHERE id = $1', [insertResult.id])).rows[0];
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/jobs/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const job = (await query('SELECT * FROM jobs WHERE id = $1', [req.params.id])).rows[0];
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const { title, company, location, job_type, category, department, experience_min, experience_max, salary_min, salary_max, description, requirements, skills, openings, is_active } = req.body;
    await query(
      `UPDATE jobs SET title=$1, company=$2, location=$3, job_type=$4, category=$5, department=$6,
       experience_min=$7, experience_max=$8, salary_min=$9, salary_max=$10,
       description=$11, requirements=$12, skills=$13, openings=$14, is_active=$15 WHERE id=$16`,
      [
        title        ?? job.title,
        company      ?? job.company,
        location     ?? job.location,
        job_type     ?? job.job_type,
        category     ?? job.category,
        department   ?? job.department,
        experience_min ?? job.experience_min,
        experience_max ?? job.experience_max,
        salary_min   ?? job.salary_min,
        salary_max   ?? job.salary_max,
        description  ?? job.description,
        requirements ?? job.requirements,
        skills       ?? job.skills,
        openings     ?? job.openings,
        is_active    ?? job.is_active,
        req.params.id,
      ]
    );
    const updated = (await query('SELECT * FROM jobs WHERE id = $1', [req.params.id])).rows[0];
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/jobs/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    await query('UPDATE jobs SET is_active = 0 WHERE id = $1', [req.params.id]);
    res.json({ message: 'Job deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
