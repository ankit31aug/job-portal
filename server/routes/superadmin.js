const express = require('express');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const db = require('../db');
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
router.get('/stats', authenticate, requireSuperAdmin, (req, res) => {
  const users    = db.prepare('SELECT COUNT(*) as c FROM users').get();
  const jobs     = db.prepare('SELECT COUNT(*) as c FROM jobs WHERE is_active = 1').get();
  const apps     = db.prepare('SELECT COUNT(*) as c FROM applications').get();
  const hired    = db.prepare("SELECT COUNT(*) as c FROM applications WHERE status='hired'").get();
  const hrRoles  = db.prepare('SELECT COUNT(*) as c FROM hr_roles').get();
  const gallery  = db.prepare('SELECT COUNT(*) as c FROM gallery WHERE is_active=1').get();
  res.json({ totalUsers: users.c, totalJobs: jobs.c, totalApplications: apps.c, hired: hired.c, hrRoles: hrRoles.c, galleryItems: gallery.c });
});

// ══════════════════════════════════════════════════════════════════════════
// HR ROLE MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════
router.get('/hr-roles', authenticate, requireSuperAdmin, (req, res) => {
  const roles = db.prepare(`
    SELECT r.*, u.name as created_by_name,
    (SELECT COUNT(*) FROM users WHERE hr_role_id = r.id) as assigned_count
    FROM hr_roles r LEFT JOIN users u ON r.created_by = u.id
    ORDER BY r.created_at DESC
  `).all();
  res.json(roles.map(r => ({ ...r, permissions: JSON.parse(r.permissions || '[]') })));
});

router.post('/hr-roles', authenticate, requireSuperAdmin, (req, res) => {
  const { name, description, permissions } = req.body;
  if (!name) return res.status(400).json({ error: 'Role name is required' });
  const perms = Array.isArray(permissions) ? permissions : [];
  const result = db.prepare('INSERT INTO hr_roles (name, description, permissions, created_by) VALUES (?, ?, ?, ?)').run(name.trim(), description || '', JSON.stringify(perms), req.user.id);
  const role = db.prepare('SELECT * FROM hr_roles WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...role, permissions: JSON.parse(role.permissions) });
});

router.put('/hr-roles/:id', authenticate, requireSuperAdmin, (req, res) => {
  const { name, description, permissions } = req.body;
  const role = db.prepare('SELECT * FROM hr_roles WHERE id = ?').get(req.params.id);
  if (!role) return res.status(404).json({ error: 'HR role not found' });
  const perms = Array.isArray(permissions) ? permissions : JSON.parse(role.permissions || '[]');
  db.prepare('UPDATE hr_roles SET name=?, description=?, permissions=? WHERE id=?').run(name || role.name, description ?? role.description, JSON.stringify(perms), req.params.id);
  const updated = db.prepare('SELECT * FROM hr_roles WHERE id = ?').get(req.params.id);
  res.json({ ...updated, permissions: JSON.parse(updated.permissions) });
});

router.delete('/hr-roles/:id', authenticate, requireSuperAdmin, (req, res) => {
  db.prepare('UPDATE users SET hr_role_id = NULL WHERE hr_role_id = ?').run(req.params.id);
  db.prepare('DELETE FROM hr_roles WHERE id = ?').run(req.params.id);
  res.json({ message: 'HR role deleted' });
});

// ══════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════
router.get('/users', authenticate, requireSuperAdmin, (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const conditions = [];
  const params = [];
  if (role) { conditions.push('u.role = ?'); params.push(role); }
  if (search) { conditions.push('(u.name LIKE ? OR u.email LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) as c FROM users u ${where}`).get(...params);
  const users = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.company_name, u.phone, u.city, u.state, u.is_verified, u.hr_role_id, u.created_at,
    r.name as hr_role_name
    FROM users u LEFT JOIN hr_roles r ON u.hr_role_id = r.id
    ${where} ORDER BY u.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, parseInt(limit), offset);
  res.json({ users, total: total.c, page: parseInt(page), pages: Math.ceil(total.c / parseInt(limit)) });
});

router.put('/users/:id/role', authenticate, requireSuperAdmin, (req, res) => {
  const { role, hr_role_id } = req.body;
  const validRoles = ['jobseeker', 'employer', 'hr', 'super_admin'];
  if (!validRoles.includes(role)) return res.status(400).json({ error: 'Invalid role' });
  db.prepare('UPDATE users SET role=?, hr_role_id=? WHERE id=?').run(role, hr_role_id || null, req.params.id);
  res.json({ message: 'User role updated' });
});

router.post('/users/create-hr', authenticate, requireSuperAdmin, (req, res) => {
  const { name, email, password, phone, hr_role_id } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const result = db.prepare(`INSERT INTO users (name, email, password, role, hr_role_id, company_name, phone, is_verified) VALUES (?, ?, ?, 'hr', ?, ?, ?, 1)`)
    .run(name.trim(), email.toLowerCase().trim(), bcrypt.hashSync(password, 10), hr_role_id || null, 'Quality Council of India', phone || null);
  const user = db.prepare('SELECT id, name, email, role, hr_role_id FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(user);
});

router.delete('/users/:id', authenticate, requireSuperAdmin, (req, res) => {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'super_admin') return res.status(403).json({ error: 'Cannot delete super admin' });
  db.prepare('DELETE FROM bookmarks WHERE user_id = ?').run(req.params.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'User deleted' });
});

// ══════════════════════════════════════════════════════════════════════════
// GALLERY MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════
router.get('/gallery', authenticate, requireSuperAdmin, (req, res) => {
  const items = db.prepare('SELECT * FROM gallery ORDER BY display_order ASC, created_at DESC').all();
  res.json(items);
});

router.post('/gallery', authenticate, requireSuperAdmin, galleryUpload.single('image'), (req, res) => {
  const { title, description, category, display_order } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const result = db.prepare('INSERT INTO gallery (title, description, image_path, category, display_order) VALUES (?, ?, ?, ?, ?)').run(title, description || '', req.file ? `/uploads/gallery/${req.file.filename}` : null, category || 'general', parseInt(display_order) || 0);
  res.status(201).json(db.prepare('SELECT * FROM gallery WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/gallery/:id', authenticate, requireSuperAdmin, galleryUpload.single('image'), (req, res) => {
  const item = db.prepare('SELECT * FROM gallery WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Gallery item not found' });
  const { title, description, category, display_order, is_active } = req.body;
  db.prepare('UPDATE gallery SET title=?, description=?, category=?, display_order=?, is_active=?, image_path=? WHERE id=?').run(
    title || item.title, description ?? item.description, category || item.category,
    parseInt(display_order) || item.display_order,
    is_active !== undefined ? parseInt(is_active) : item.is_active,
    req.file ? `/uploads/gallery/${req.file.filename}` : item.image_path, req.params.id);
  res.json(db.prepare('SELECT * FROM gallery WHERE id = ?').get(req.params.id));
});

router.delete('/gallery/:id', authenticate, requireSuperAdmin, (req, res) => {
  db.prepare('DELETE FROM gallery WHERE id = ?').run(req.params.id);
  res.json({ message: 'Gallery item deleted' });
});

router.put('/gallery/reorder/batch', authenticate, requireSuperAdmin, (req, res) => {
  const { items } = req.body; // [{ id, display_order }]
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });
  const update = db.prepare('UPDATE gallery SET display_order = ? WHERE id = ?');
  db.transaction(() => items.forEach(({ id, display_order }) => update.run(display_order, id)))();
  res.json({ message: 'Gallery reordered' });
});

// ══════════════════════════════════════════════════════════════════════════
// BOARD CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════
router.get('/boards', authenticate, requireSuperAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM board_config ORDER BY display_order ASC').all());
});

router.put('/boards/:id', authenticate, requireSuperAdmin, boardUpload.single('image'), (req, res) => {
  const board = db.prepare('SELECT * FROM board_config WHERE id = ?').get(req.params.id);
  if (!board) return res.status(404).json({ error: 'Board not found' });
  const { name, full_name, description, color, display_order, is_active } = req.body;
  db.prepare(`UPDATE board_config SET name=?, full_name=?, description=?, color=?, display_order=?, is_active=?, image_path=? WHERE id=?`).run(
    name || board.name, full_name || board.full_name, description ?? board.description,
    color || board.color, parseInt(display_order) || board.display_order,
    is_active !== undefined ? parseInt(is_active) : board.is_active,
    req.file ? `/uploads/boards/${req.file.filename}` : board.image_path, req.params.id);
  res.json(db.prepare('SELECT * FROM board_config WHERE id = ?').get(req.params.id));
});

router.put('/boards/reorder/batch', authenticate, requireSuperAdmin, (req, res) => {
  const { items } = req.body; // [{ id, display_order }]
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });
  const update = db.prepare('UPDATE board_config SET display_order = ? WHERE id = ?');
  db.transaction(() => items.forEach(({ id, display_order }) => update.run(display_order, id)))();
  res.json({ message: 'Boards reordered' });
});

// ══════════════════════════════════════════════════════════════════════════
// FULL SETTINGS (extends existing /api/settings)
// ══════════════════════════════════════════════════════════════════════════
router.get('/settings', authenticate, requireSuperAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM settings ORDER BY category, key').all();
  res.json(rows);
});

router.put('/settings', authenticate, requireSuperAdmin, (req, res) => {
  const updates = req.body; // { key: value, ... }
  const upsert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
  db.transaction(() => Object.entries(updates).forEach(([k, v]) => upsert.run(k, v)))();
  res.json({ message: 'Settings saved' });
});

// ══════════════════════════════════════════════════════════════════════════
// JOBS (full control)
// ══════════════════════════════════════════════════════════════════════════
router.get('/jobs', authenticate, requireSuperAdmin, (req, res) => {
  const { page = 1, limit = 20, search, department } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const conditions = [];
  const params = [];
  if (search) { conditions.push('(j.title LIKE ? OR j.company LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (department) { conditions.push('j.department = ?'); params.push(department); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) as c FROM jobs j ${where}`).get(...params);
  const jobs = db.prepare(`SELECT j.*, u.name as employer_name, (SELECT COUNT(*) FROM applications WHERE job_id=j.id) as application_count FROM jobs j LEFT JOIN users u ON j.employer_id=u.id ${where} ORDER BY j.created_at DESC LIMIT ? OFFSET ?`).all(...params, parseInt(limit), offset);
  res.json({ jobs, total: total.c, page: parseInt(page), pages: Math.ceil(total.c / parseInt(limit)) });
});

router.post('/jobs', authenticate, requireSuperAdmin, (req, res) => {
  const { title, company, location, job_type, category, department, experience_min, experience_max, salary_min, salary_max, description, requirements, skills, openings } = req.body;
  if (!title || !location || !category || !description || !requirements || !skills) return res.status(400).json({ error: 'Required fields missing' });
  const result = db.prepare(`INSERT INTO jobs (employer_id, title, company, location, job_type, category, department, experience_min, experience_max, salary_min, salary_max, description, requirements, skills, openings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(req.user.id, title, company || 'Quality Council of India', location, job_type || 'Full-time', category, department || 'General', experience_min || 0, experience_max || 5, salary_min || null, salary_max || null, description, requirements, skills, openings || 1);
  res.status(201).json(db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/jobs/:id', authenticate, requireSuperAdmin, (req, res) => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  const { title, company, location, job_type, category, department, experience_min, experience_max, salary_min, salary_max, description, requirements, skills, openings, is_active } = req.body;
  db.prepare(`UPDATE jobs SET title=?,company=?,location=?,job_type=?,category=?,department=?,experience_min=?,experience_max=?,salary_min=?,salary_max=?,description=?,requirements=?,skills=?,openings=?,is_active=? WHERE id=?`).run(title, company, location, job_type, category, department || job.department, experience_min, experience_max, salary_min, salary_max, description, requirements, skills, openings, is_active ?? job.is_active, req.params.id);
  res.json(db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id));
});

router.delete('/jobs/:id', authenticate, requireSuperAdmin, (req, res) => {
  db.prepare('UPDATE jobs SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Job deactivated' });
});

module.exports = router;
