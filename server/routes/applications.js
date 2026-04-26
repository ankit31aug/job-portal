const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { authenticate, requireEmployer } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `resume_${Date.now()}_${file.originalname.replace(/\s/g, '_')}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only PDF and Word documents are allowed'));
  }
});

router = express.Router();

router.post('/', authenticate, upload.single('resume'), (req, res) => {
  const {
    job_id, full_name, email, phone, pincode, city, state,
    experience_years, current_company, current_ctc, expected_ctc,
    notice_period, cover_letter, skills
  } = req.body;

  if (!job_id || !full_name || !email || !phone || !pincode) {
    return res.status(400).json({ error: 'Job ID, name, email, phone, and pincode are required' });
  }

  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND is_active = 1').get(job_id);
  if (!job) return res.status(404).json({ error: 'Job not found or no longer active' });

  const existing = db.prepare('SELECT id FROM applications WHERE job_id = ? AND applicant_id = ?').get(job_id, req.user.id);
  if (existing) return res.status(409).json({ error: 'You have already applied for this job' });

  const matchScore = calculateMatchScore(skills || '', job.skills);

  const result = db.prepare(`
    INSERT INTO applications (job_id, applicant_id, full_name, email, phone, pincode, city, state,
      experience_years, current_company, current_ctc, expected_ctc, notice_period, cover_letter,
      resume_path, skills, match_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(job_id, req.user.id, full_name, email, phone, pincode, city || null, state || null,
    experience_years || 0, current_company || null, current_ctc || null, expected_ctc || null,
    notice_period || null, cover_letter || null,
    req.file ? req.file.filename : null, skills || null, matchScore);

  const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...application, message: 'Application submitted successfully!' });
});

router.get('/my', authenticate, (req, res) => {
  const applications = db.prepare(`
    SELECT a.*, j.title as job_title, j.company, j.location, j.job_type
    FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE a.applicant_id = ?
    ORDER BY a.applied_at DESC
  `).all(req.user.id);
  res.json(applications);
});

router.get('/job/:jobId', authenticate, requireEmployer, (req, res) => {
  const job = db.prepare('SELECT id FROM jobs WHERE id = ? AND employer_id = ?').get(req.params.jobId, req.user.id);
  if (!job) return res.status(404).json({ error: 'Job not found or unauthorized' });

  const applications = db.prepare(`
    SELECT a.*, u.email as user_email
    FROM applications a
    JOIN users u ON a.applicant_id = u.id
    WHERE a.job_id = ?
    ORDER BY a.match_score DESC, a.applied_at DESC
  `).all(req.params.jobId);

  res.json(applications);
});

router.patch('/:id/status', authenticate, requireEmployer, (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'shortlisted', 'interviewed', 'rejected', 'hired'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const application = db.prepare(`
    SELECT a.id FROM applications a
    JOIN jobs j ON a.job_id = j.id
    WHERE a.id = ? AND j.employer_id = ?
  `).get(req.params.id, req.user.id);

  if (!application) return res.status(404).json({ error: 'Application not found or unauthorized' });

  db.prepare('UPDATE applications SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Status updated successfully', status });
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
