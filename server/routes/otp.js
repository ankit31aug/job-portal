const express = require('express');
const { query } = require('../db-pg');
const { sendMail, otpEmail } = require('../utils/email');

const router = express.Router();

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/otp/send
router.post('/send', async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) return res.status(400).json({ error: 'Email and name are required' });

  try {
    const existing = (await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    )).rows[0];
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    // Invalidate old OTPs for this email
    await query(
      'DELETE FROM otp_verifications WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await query(
      'INSERT INTO otp_verifications (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email.toLowerCase().trim(), otp, expiresAt]
    );

    await sendMail({
      to: email,
      subject: 'QCI Job Portal — Your OTP for Registration',
      html: otpEmail(name, otp),
    });

    res.json({ message: 'OTP sent to your email address' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/otp/verify
router.post('/verify', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

  try {
    const record = (await query(
      'SELECT * FROM otp_verifications WHERE email = $1 AND verified = 0 ORDER BY created_at DESC LIMIT 1',
      [email.toLowerCase().trim()]
    )).rows[0];

    if (!record) return res.status(400).json({ error: 'No pending OTP for this email' });

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp !== String(otp)) {
      return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    }

    await query('UPDATE otp_verifications SET verified = 1 WHERE id = $1', [record.id]);
    res.json({ verified: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
