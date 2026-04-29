const express = require('express');
const multer = require('multer');
const path = require('path');
const { query } = require('../db-pg');
const { authenticate, requireEmployer } = require('../middleware/auth');
const { sendMail, applicationConfirmEmail, statusUpdateEmail, newApplicationAlertEmail } = require('../utils/email');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) =>
    cb(null, `resume_${Date.now()}_${file.originalname.replace(/\s/g, '_')}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only PDF and Word documents are allowed'));
  },
});

const router = express.Router();

router.post('/', authenticate, upload.single('resume'), async (req, res) => {
  try {
    const {
      job_id, full_name, email, phone, pincode, city, state,
      experience_years, current_company, current_ctc, expected_ctc,
      notice_period, cover_letter, skills,
    } = req.body;

    if (!job_id || !full_name || !email || !phone || !pincode) {
      return res.status(400).json({ error: 'Job ID, name, email, phone, and pincode are required' });
    }

    const job = (await query(
      'SELECT * FROM jobs WHERE id = $1 AND is_active = 1',
      [job_id]
    )).rows[0];
    if (!job) return res.status(404).json({ error: 'Job not found or no longer active' });

    const existing = (await query(
      'SELECT id FROM applications WHERE job_id = $1 AND applicant_id = $2',
      [job_id, req.user.id]
    )).rows[0];
    if (existing) return res.status(409).json({ error: 'You have already applied for this job' });

    const matchScore = calculateMatchScore(skills || '', job.skills);
    // Auto-shortlist if match score >= 70%
    const autoStatus = matchScore >= 70 ? 'shortlisted' : 'pending';

    const appId = (await query(
      `INSERT INTO applications (job_id, applicant_id, full_name, email, phone, pincode, city, state,
         experience_years, current_company, current_ctc, expected_ctc, notice_period, cover_letter,
         resume_path, skills, match_score, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING id`,
      [
        job_id, req.user.id, full_name, email, phone, pincode, city || null, state || null,
        experience_years || 0, current_company || null, current_ctc || null, expected_ctc || null,
        notice_period || null, cover_letter || null,
        req.file ? req.file.filename : null, skills || null, matchScore, autoStatus,
      ]
    )).rows[0].id;

    // Log initial status history
    await query(
      'INSERT INTO application_status_history (application_id, status) VALUES ($1, $2)',
      [appId, autoStatus]
    );

    const application = (await query(
      'SELECT * FROM applications WHERE id = $1',
      [appId]
    )).rows[0];

    // Send confirmation email to applicant
    sendMail({
      to: email,
      subject: `Application Received — ${job.title} | QCI Job Portal`,
      html: applicationConfirmEmail(full_name, job.title, job.company),
    });

    // If auto-shortlisted, send shortlist notification
    if (autoStatus === 'shortlisted') {
      sendMail({
        to: email,
        subject: `You've been Shortlisted for ${job.title} | QCI`,
        html: statusUpdateEmail(full_name, job.title, 'shortlisted'),
      });
    }

    // Notify employer/HR about new application
    const employer = (await query(
      'SELECT name, email FROM users WHERE id = $1',
      [job.employer_id]
    )).rows[0];
    if (employer) {
      sendMail({
        to: employer.email,
        subject: `New Application — ${job.title} | QCI`,
        html: newApplicationAlertEmail(employer.name, full_name, job.title, matchScore),
      });
    }

    res.status(201).json({
      ...application,
      message: 'Application submitted successfully!',
      auto_shortlisted: autoStatus === 'shortlisted',
    });
  } catch (err) {
    console.error('POST /applications error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my', authenticate, async (req, res) => {
  try {
    const { rows: applications } = await query(
      `SELECT a.*, j.title as job_title, j.company, j.location, j.job_type
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.applicant_id = $1
       ORDER BY a.applied_at DESC`,
      [req.user.id]
    );
    res.json(applications);
  } catch (err) {
    console.error('GET /applications/my error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/job/:jobId', authenticate, requireEmployer, async (req, res) => {
  try {
    const job = (await query(
      'SELECT id FROM jobs WHERE id = $1 AND employer_id = $2',
      [req.params.jobId, req.user.id]
    )).rows[0];
    if (!job) return res.status(404).json({ error: 'Job not found or unauthorized' });

    const { rows: applications } = await query(
      `SELECT a.*, u.email as user_email
       FROM applications a
       JOIN users u ON a.applicant_id = u.id
       WHERE a.job_id = $1
       ORDER BY a.match_score DESC, a.applied_at DESC`,
      [req.params.jobId]
    );

    res.json(applications);
  } catch (err) {
    console.error('GET /applications/job/:jobId error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id/status', authenticate, requireEmployer, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'shortlisted', 'interviewed', 'rejected', 'hired'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const application = (await query(
      `SELECT a.id FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.id = $1 AND j.employer_id = $2`,
      [req.params.id, req.user.id]
    )).rows[0];

    if (!application) return res.status(404).json({ error: 'Application not found or unauthorized' });

    await query(
      'UPDATE applications SET status = $1 WHERE id = $2',
      [status, req.params.id]
    );
    await query(
      'INSERT INTO application_status_history (application_id, status) VALUES ($1, $2)',
      [req.params.id, status]
    );

    // Email applicant about status change
    const app = (await query(
      `SELECT a.full_name, a.email, j.title
       FROM applications a JOIN jobs j ON a.job_id = j.id
       WHERE a.id = $1`,
      [req.params.id]
    )).rows[0];
    if (app) {
      sendMail({
        to: app.email,
        subject: `Application Update — ${app.title} | QCI`,
        html: statusUpdateEmail(app.full_name, app.title, status),
      });
    }

    res.json({ message: 'Status updated successfully', status });
  } catch (err) {
    console.error('PATCH /applications/:id/status error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

function calculateMatchScore(resumeSkills, jobSkills) {
  if (!resumeSkills || !jobSkills) return 0;
  const resume = resumeSkills.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  const required = jobSkills.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  if (!required.length) return 0;

  let matched = 0;
  for (const skill of required) {
    if (resume.some(rs => rs.includes(skill) || skill.includes(rs))) matched++;
  }
  return Math.round((matched / required.length) * 100);
}

module.exports = router;
