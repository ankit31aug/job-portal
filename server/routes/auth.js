const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const { sendMail, passwordResetEmail } = require('../utils/email');

const router = express.Router();

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/resumes')),
  filename: (req, file, cb) => cb(null, `profile_${req.user?.id}_${Date.now()}${path.extname(file.originalname)}`),
});
const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['.pdf', '.doc', '.docx'].includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only PDF and Word documents allowed'));
  },
});

// ── Register ─────────────────────────────────────────────────────────────────
router.post('/register', (req, res) => {
  const { name, email, password, phone, role, company_name, city, state, pincode } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }
  if (!['jobseeker', 'employer'].includes(role)) {
    return res.status(400).json({ error: 'Role must be jobseeker or employer' });
  }
  if (role === 'hr' || role === 'super_admin') {
    return res.status(403).json({ error: 'This account type is created by the system administrator' });
  }
  if (role === 'employer' && !company_name) {
    return res.status(400).json({ error: 'Company name is required for employers' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  // Verify OTP for jobseekers (employers can self-register without OTP)
  // Skip in test environment so unit tests can register without going through the OTP flow
  if (role === 'jobseeker' && process.env.NODE_ENV !== 'test') {
    const otpRecord = db.prepare(
      'SELECT * FROM otp_verifications WHERE email = ? AND verified = 1 ORDER BY created_at DESC LIMIT 1'
    ).get(email.toLowerCase().trim());
    if (!otpRecord) {
      return res.status(400).json({ error: 'Email not verified. Please verify your email with OTP before registering.' });
    }
    const sentAt = new Date(otpRecord.created_at.replace(' ', 'T') + 'Z');
    if ((Date.now() - sentAt.getTime()) > 30 * 60 * 1000) {
      return res.status(400).json({ error: 'OTP verification expired. Please request a new OTP.' });
    }
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (name, email, password, phone, role, company_name, city, state, pincode, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name.trim(), email.toLowerCase().trim(), hashedPassword, phone || null, role,
    company_name || null, city || null, state || null, pincode || null,
    role === 'jobseeker' ? 1 : 0);

  const user = db.prepare('SELECT id, name, email, phone, role, company_name, city, state, pincode, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user });
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
});

// ── Get Current User ───────────────────────────────────────────────────────────
router.get('/me', authenticate, (req, res) => {
  const user = db.prepare(
    'SELECT id, name, email, phone, role, company_name, city, state, pincode, bio, skills, experience_years, current_company, profile_resume_path, created_at FROM users WHERE id = ?'
  ).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ── Get Profile ────────────────────────────────────────────────────────────────
router.get('/profile', authenticate, (req, res) => {
  const user = db.prepare(
    'SELECT id, name, email, phone, role, company_name, city, state, pincode, bio, skills, experience_years, current_company, profile_resume_path, created_at FROM users WHERE id = ?'
  ).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ── Update Profile ─────────────────────────────────────────────────────────────
router.put('/profile', authenticate, profileUpload.single('resume'), (req, res) => {
  const { name, phone, city, state, pincode, company_name, bio, skills, experience_years, current_company } = req.body;
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!existing) return res.status(404).json({ error: 'User not found' });

  const resumePath = req.file ? `/uploads/resumes/${req.file.filename}` : existing.profile_resume_path;

  db.prepare(`
    UPDATE users SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      city = COALESCE(?, city),
      state = COALESCE(?, state),
      pincode = COALESCE(?, pincode),
      company_name = COALESCE(?, company_name),
      bio = ?,
      skills = ?,
      experience_years = COALESCE(?, experience_years),
      current_company = ?,
      profile_resume_path = ?
    WHERE id = ?
  `).run(
    name || null, phone || null, city || null, state || null, pincode || null, company_name || null,
    bio ?? existing.bio,
    skills ?? existing.skills,
    experience_years !== undefined ? parseInt(experience_years) : null,
    current_company ?? existing.current_company,
    resumePath,
    req.user.id
  );

  const updated = db.prepare(
    'SELECT id, name, email, phone, role, company_name, city, state, pincode, bio, skills, experience_years, current_company, profile_resume_path FROM users WHERE id = ?'
  ).get(req.user.id);
  res.json(updated);
});

// ── Forgot Password ────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email.toLowerCase().trim());
  // Always respond the same way to prevent email enumeration
  if (!user) return res.json({ message: 'If that email is registered, a reset link has been sent.' });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  db.prepare('DELETE FROM password_reset_tokens WHERE email = ?').run(user.email);
  db.prepare('INSERT INTO password_reset_tokens (email, token, expires_at) VALUES (?, ?, ?)').run(user.email, token, expiresAt);

  const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  try {
    await sendMail({
      to: user.email,
      subject: 'QCI Job Portal — Reset Your Password',
      html: passwordResetEmail(user.name, resetUrl),
    });
  } catch (_) {}

  res.json({ message: 'If that email is registered, a reset link has been sent.' });
});

// ── Reset Password ─────────────────────────────────────────────────────────────
router.post('/reset-password', (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const record = db.prepare('SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0').get(token);
  if (!record) return res.status(400).json({ error: 'Invalid or already used reset link.' });

  if (new Date() > new Date(record.expires_at)) {
    return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
  }

  db.prepare('UPDATE users SET password = ? WHERE email = ?').run(bcrypt.hashSync(password, 10), record.email);
  db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(record.id);

  res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
});

module.exports = router;
