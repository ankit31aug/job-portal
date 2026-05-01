require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Ensure upload directories exist on startup
['uploads', 'uploads/gallery', 'uploads/boards', 'uploads/resumes'].forEach(dir => {
  const p = path.join(__dirname, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const resumeRoutes = require('./routes/resume');
const adminRoutes = require('./routes/admin');
const settingsRoutes = require('./routes/settings');
const bookmarkRoutes = require('./routes/bookmarks');
const otpRoutes = require('./routes/otp');
const superadminRoutes = require('./routes/superadmin');
const boardRoutes = require('./routes/boards');
const jobAlertRoutes = require('./routes/job-alerts');

const app = express();
const IS_PROD = process.env.NODE_ENV === 'production';

// Security headers (disable X-Powered-By, add X-Frame-Options, X-Content-Type-Options, etc.)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow /uploads static files
  contentSecurityPolicy: false, // CSP managed by frontend build
}));

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000'];

app.use(cors({ origin: IS_PROD ? true : allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiters — skip in test environment
const IS_TEST = process.env.NODE_ENV === 'test';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: IS_TEST ? 1000 : 10,  // 10 attempts per 15 min in prod
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => IS_TEST,
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: IS_TEST ? 1000 : 5,   // 5 OTP verifications per 10 min
  message: { error: 'Too many OTP attempts. Please request a new OTP.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => IS_TEST,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: IS_TEST ? 1000 : 5,   // 5 reset requests per hour
  message: { error: 'Too many password reset requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => IS_TEST,
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/forgot-password', forgotPasswordLimiter);
app.use('/api/otp/verify', otpLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/job-alerts', jobAlertRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Public gallery endpoint — no auth required
const { query } = require('./db-pg');
app.get('/api/gallery', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM gallery WHERE is_active = 1 ORDER BY display_order ASC, created_at DESC',
      []
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /api/gallery error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve React build whenever it exists (production always, dev as fallback if built)
const clientBuild = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
