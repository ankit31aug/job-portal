const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  const { name, email, password, phone, role, company_name, city, state, pincode, otp_verified } = req.body;

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
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  // Verify OTP for jobseekers (employers can self-register without OTP)
  if (role === 'jobseeker') {
    const otpRecord = db.prepare(
      'SELECT * FROM otp_verifications WHERE email = ? AND verified = 1 ORDER BY created_at DESC LIMIT 1'
    ).get(email.toLowerCase().trim());
    if (!otpRecord) {
      return res.status(400).json({ error: 'Email not verified. Please verify your email with OTP before registering.' });
    }
    // OTP must have been sent within the last 30 minutes (created_at is UTC, append Z for correct parsing)
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

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...userWithoutPassword } = user;

  res.json({ token, user: userWithoutPassword });
});

router.get('/me', authenticate, (req, res) => {
  const user = db.prepare('SELECT id, name, email, phone, role, company_name, city, state, pincode, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.put('/profile', authenticate, (req, res) => {
  const { name, phone, city, state, pincode, company_name } = req.body;

  db.prepare(`
    UPDATE users SET name = ?, phone = ?, city = ?, state = ?, pincode = ?, company_name = ?
    WHERE id = ?
  `).run(name, phone, city, state, pincode, company_name, req.user.id);

  const user = db.prepare('SELECT id, name, email, phone, role, company_name, city, state, pincode FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

module.exports = router;
