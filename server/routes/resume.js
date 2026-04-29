const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { query } = require('../db-pg');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `parse_${Date.now()}_${file.originalname.replace(/\s/g, '_')}`)
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.pdf') cb(null, true);
    else cb(new Error('Only PDF files are supported for auto-parsing'));
  }
});

router.post('/parse', authenticate, upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Please upload a PDF resume' });

  const filePath = req.file.path;

  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const text = data.text;

    const parsed = extractResumeData(text);
    fs.unlinkSync(filePath);

    res.json({ success: true, data: parsed, rawText: text.substring(0, 500) + '...' });
  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: 'Failed to parse resume: ' + err.message });
  }
});

router.post('/match', authenticate, upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Please upload a PDF resume' });

  const filePath = req.file.path;

  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    const text = data.text.toLowerCase();

    fs.unlinkSync(filePath);

    const { rows: jobs } = await query('SELECT * FROM jobs WHERE is_active = 1', []);

    const scoredJobs = jobs.map(job => {
      const jobSkills = job.skills.toLowerCase().split(',').map(s => s.trim());
      const titleWords = job.title.toLowerCase().split(' ');

      let score = 0;
      let matchedSkills = [];

      for (const skill of jobSkills) {
        if (text.includes(skill)) {
          score += 15;
          matchedSkills.push(skill);
        }
      }

      for (const word of titleWords) {
        if (word.length > 3 && text.includes(word)) score += 5;
      }

      const categories = ['react', 'node', 'python', 'java', 'android', 'ios', 'data', 'design', 'devops', 'product'];
      for (const cat of categories) {
        if (text.includes(cat) && job.title.toLowerCase().includes(cat)) score += 10;
      }

      return {
        ...job,
        match_score: Math.min(score, 100),
        matched_skills: matchedSkills
      };
    });

    const matched = scoredJobs
      .filter(j => j.match_score > 0)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 10);

    res.json({ jobs: matched, total: matched.length });
  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: 'Failed to process resume: ' + err.message });
  }
});

function extractResumeData(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';

  const phonePatterns = [
    /(\+91[\s\-]?)?[6-9]\d{9}/,
    /(\+1[\s\-]?)?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/,
    /\d{5}[\s\-]\d{5}/
  ];
  let phone = '';
  for (const p of phonePatterns) {
    const m = text.match(p);
    if (m) { phone = m[0].replace(/\s/g, '').replace(/-/g, ''); break; }
  }

  const pincodeMatch = text.match(/\b[1-9][0-9]{5}\b/);
  const pincode = pincodeMatch ? pincodeMatch[0] : '';

  let name = '';
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (/^[A-Z][a-z]+ [A-Z][a-z]+/.test(line) && line.length < 50 && !line.includes('@') && !line.match(/\d{4}/)) {
      name = line;
      break;
    }
  }
  if (!name && lines.length > 0) name = lines[0].substring(0, 50);

  const skillKeywords = [
    'javascript', 'typescript', 'react', 'angular', 'vue', 'node', 'express', 'python',
    'django', 'flask', 'fastapi', 'java', 'spring', 'kotlin', 'android', 'swift', 'ios',
    'c++', 'c#', '.net', 'php', 'laravel', 'ruby', 'rails', 'go', 'golang', 'rust',
    'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch',
    'aws', 'gcp', 'azure', 'docker', 'kubernetes', 'terraform', 'jenkins', 'git',
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn',
    'figma', 'adobe xd', 'photoshop', 'illustrator', 'ui/ux', 'html', 'css', 'sass',
    'agile', 'scrum', 'jira', 'product management', 'data science', 'data analysis'
  ];

  const textLower = text.toLowerCase();
  const foundSkills = skillKeywords.filter(skill => textLower.includes(skill));

  const expMatch = text.match(/(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)/i);
  const experienceYears = expMatch ? parseInt(expMatch[1]) : '';

  const cityKeywords = ['bangalore', 'mumbai', 'delhi', 'hyderabad', 'pune', 'chennai', 'kolkata', 'ahmedabad', 'noida', 'gurgaon'];
  let city = '';
  for (const c of cityKeywords) {
    if (textLower.includes(c)) { city = c.charAt(0).toUpperCase() + c.slice(1); break; }
  }

  return { name, email, phone, pincode, city, skills: foundSkills.join(', '), experienceYears };
}

module.exports = router;
