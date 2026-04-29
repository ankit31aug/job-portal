const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const { query } = require('../db-pg');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const { sendMail, passwordResetEmail } = require('../utils/email');

const router = express.Router();

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/resumes')),
  filename: (req, file, cb) =>
    cb(null, `profile_${req.user?.id}_${Date.now()}${path.extname(file.originalname)}`),
});
const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['.pdf', '.doc', '.docx'].includes(path.extname(file.originalname).toLowerCase()))
      cb(null, true);
    else cb(new Error('Only PDF and Word documents allowed'));
  },
});

// ── Register ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
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

    const existing = (await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    )).rows[0];
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    // Verify OTP for jobseekers (employers can self-register without OTP)
    // Skip in test environment so unit tests can register without going through the OTP flow
    if (role === 'jobseeker' && process.env.NODE_ENV !== 'test') {
      const otpRecord = (await query(
        'SELECT * FROM otp_verifications WHERE email = $1 AND verified = 1 ORDER BY created_at DESC LIMIT 1',
        [email.toLowerCase().trim()]
      )).rows[0];
      if (!otpRecord) {
        return res.status(400).json({
          error: 'Email not verified. Please verify your email with OTP before registering.',
        });
      }
      const sentAt = new Date(otpRecord.created_at);
      if (Date.now() - sentAt.getTime() > 30 * 60 * 1000) {
        return res.status(400).json({
          error: 'OTP verification expired. Please request a new OTP.',
        });
      }
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUserId = (await query(
      `INSERT INTO users (name, email, password, phone, role, company_name, city, state, pincode, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        name.trim(), email.toLowerCase().trim(), hashedPassword, phone || null, role,
        company_name || null, city || null, state || null, pincode || null,
        role === 'jobseeker' ? 1 : 0,
      ]
    )).rows[0].id;

    const user = (await query(
      'SELECT id, name, email, phone, role, company_name, city, state, pincode, created_at FROM users WHERE id = $1',
      [newUserId]
    )).rows[0];

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('POST /auth/register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const user = (await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    )).rows[0];

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('POST /auth/login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Get Current User ───────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = (await query(
      `SELECT id, name, email, phone, role, company_name, city, state, pincode,
              bio, skills, experience_years, current_company, profile_resume_path, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    )).rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('GET /auth/me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Get Profile ────────────────────────────────────────────────────────────────
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = (await query(
      `SELECT id, name, email, phone, role, company_name, city, state, pincode,
              bio, skills, experience_years, current_company, profile_resume_path, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    )).rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('GET /auth/profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Update Profile ─────────────────────────────────────────────────────────────
router.put('/profile', authenticate, profileUpload.single('resume'), async (req, res) => {
  try {
    const {
      name, phone, city, state, pincode, company_name,
      bio, skills, experience_years, current_company,
    } = req.body;

    const existing = (await query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    )).rows[0];
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const resumePath = req.file
      ? `/uploads/resumes/${req.file.filename}`
      : existing.profile_resume_path;

    await query(
      `UPDATE users SET
         name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         city = COALESCE($3, city),
         state = COALESCE($4, state),
         pincode = COALESCE($5, pincode),
         company_name = COALESCE($6, company_name),
         bio = $7,
         skills = $8,
         experience_years = COALESCE($9, experience_years),
         current_company = $10,
         profile_resume_path = $11
       WHERE id = $12`,
      [
        name || null,
        phone || null,
        city || null,
        state || null,
        pincode || null,
        company_name || null,
        bio ?? existing.bio,
        skills ?? existing.skills,
        experience_years !== undefined ? parseInt(experience_years) : null,
        current_company ?? existing.current_company,
        resumePath,
        req.user.id,
      ]
    );

    const updated = (await query(
      `SELECT id, name, email, phone, role, company_name, city, state, pincode,
              bio, skills, experience_years, current_company, profile_resume_path
       FROM users WHERE id = $1`,
      [req.user.id]
    )).rows[0];
    res.json(updated);
  } catch (err) {
    console.error('PUT /auth/profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Forgot Password ────────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = (await query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    )).rows[0];

    // Always respond the same way to prevent email enumeration
    if (!user) return res.json({ message: 'If that email is registered, a reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await query('DELETE FROM password_reset_tokens WHERE email = $1', [user.email]);
    await query(
      'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES ($1, $2, $3)',
      [user.email, token, expiresAt]
    );

    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    try {
      await sendMail({
        to: user.email,
        subject: 'QCI Job Portal — Reset Your Password',
        html: passwordResetEmail(user.name, resetUrl),
      });
    } catch (_) {}

    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    console.error('POST /auth/forgot-password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Reset Password ─────────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ error: 'Token and new password are required' });
    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const record = (await query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = 0',
      [token]
    )).rows[0];
    if (!record) return res.status(400).json({ error: 'Invalid or already used reset link.' });

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
    }

    await query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [bcrypt.hashSync(password, 10), record.email]
    );
    await query(
      'UPDATE password_reset_tokens SET used = 1 WHERE id = $1',
      [record.id]
    );

    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (err) {
    console.error('POST /auth/reset-password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
