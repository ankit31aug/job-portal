const express = require('express');
const db = require('../db');
const { sendMail, otpEmail } = require('../utils/email');

const router = express.Router();

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/otp/send
router.post('/send', async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) return res.status(400).json({ error: 'Email and name are required' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  // Invalidate old OTPs for this email
  db.prepare('DELETE FROM otp_verifications WHERE email = ?').run(email.toLowerCase().trim());

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  db.prepare('INSERT INTO otp_verifications (email, otp, expires_at) VALUES (?, ?, ?)').run(
    email.toLowerCase().trim(), otp, expiresAt
  );

  await sendMail({
    to: email,
    subject: 'QCI Job Portal — Your OTP for Registration',
    html: otpEmail(name, otp),
  });

  res.json({ message: 'OTP sent to your email address' });
});

// POST /api/otp/verify
router.post('/verify', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

  const record = db.prepare(
    'SELECT * FROM otp_verifications WHERE email = ? AND verified = 0 ORDER BY created_at DESC LIMIT 1'
  ).get(email.toLowerCase().trim());

  if (!record) return res.status(400).json({ error: 'No pending OTP for this email' });

  if (new Date() > new Date(record.expires_at)) {
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
  }

  if (record.otp !== String(otp)) {
    return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
  }

  db.prepare('UPDATE otp_verifications SET verified = 1 WHERE id = ?').run(record.id);
  res.json({ verified: true });
});

module.exports = router;
