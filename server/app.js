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

// ── Seed default settings (INSERT … ON CONFLICT DO NOTHING so existing values are never overwritten) ──
async function seedSettings() {
  const leaders = JSON.stringify([
    { name: 'Mr. Jaxay Shah', title: 'Chairperson, QCI', initials: 'JS', gradient: 'from-brand-700 to-brand-500', photo: 'https://nabet.qci.org.in/wp-content/uploads/elementor/thumbs/1000211985-1-qjghotg3esmx7uf2drd68lnr1b1a619ti5ybq4nwpk.jpg', quote: "Quality is the foundation on which India's global competitiveness will be built. QCI's mandate is to make quality a way of life — for every organisation, every product, every service." },
    { name: 'Ms. Hema Bhandari', title: 'Chief Advisor, QCI', initials: 'HB', gradient: 'from-indigo-600 to-blue-700', photo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrp2trppMOF2f_5Grw4oqU3VUNNQM_Rk4cZA&s', quote: 'Quality leadership means building systems that sustain excellence long after we are gone. QCI exists to create those enduring systems across every sector of India.' },
    { name: 'Mr. Chakravarthy T. Kannan', title: 'Secretary General, QCI', initials: 'CK', gradient: 'from-blue-600 to-indigo-700', photo: 'https://nabet.qci.org.in/wp-content/uploads/elementor/thumbs/kannan-qmxcv27v8ckbp0rqs1lekb9bqi2ty88qjpdyvra2c8.jpg', quote: 'Quality is not an abstract ideal — it is a measurable, manageable, and improvable reality. QCI exists to make that reality universal across India.' },
    { name: 'Mr. Rizwan Koita', title: 'Chairperson, NABH', initials: 'RK', gradient: 'from-teal-600 to-cyan-700', photo: 'https://nabh-portal-live.s3.ap-south-1.amazonaws.com/wp-content/uploads/2025/06/19164032/chairperson-1-e1758280232152.jpg', quote: 'We are building institutions that outlast individuals. Every accreditation QCI grants is a promise to the public that standards will be upheld.' },
  ]);

  const boardChairs = JSON.stringify([
    { name: 'Mr. Rizwan Koita',  title: 'Chairperson, NABH',  initials: 'RK', gradient: 'from-teal-600 to-cyan-700',    board: 'NABH',  tag: 'Healthcare',          photo: 'https://nabh-portal-live.s3.ap-south-1.amazonaws.com/wp-content/uploads/2025/06/19164032/chairperson-1-e1758280232152.jpg' },
    { name: 'Dr. Sandip Shah',   title: 'Chairperson, NABL',  initials: 'SS', gradient: 'from-orange-600 to-amber-500', board: 'NABL',  tag: 'Laboratories',        photo: '' },
    { name: 'Mr. Jalaj Dani',    title: 'Chairman, NABET',    initials: 'JD', gradient: 'from-violet-700 to-purple-600',board: 'NABET', tag: 'Education & Training', photo: 'https://nabet.qci.org.in/wp-content/uploads/2025/11/ee-277x300.jpg' },
    { name: 'Mr. Deep Kapuria',  title: 'Chairman, NABCB',    initials: 'DK', gradient: 'from-blue-700 to-indigo-600',  board: 'NABCB', tag: 'Certification',        photo: '' },
    { name: 'Dr. Aishvarya Raj', title: 'CEO, NBQP',          initials: 'AR', gradient: 'from-rose-600 to-pink-500',   board: 'NBQP',  tag: 'Quality Promotion',   photo: '' },
  ]);

  const milestones = JSON.stringify([
    { year: '1997', event: "QCI established as India's national body for quality standards under the Ministry of Commerce & Industry." },
    { year: '2000', event: "NABL receives international recognition; India's first laboratory accreditations align with global norms." },
    { year: '2006', event: 'NABH launches hospital accreditation, setting the foundation for quality healthcare across the country.' },
    { year: '2010', event: 'NABET expands to accredit vocational training providers under the National Skills Development framework.' },
    { year: '2015', event: 'QCI signs MoUs with international accreditation bodies — IAF, ILAC, APAC — for mutual recognition.' },
    { year: '2018', event: 'Launch of IndiaGHP (Good Hygiene Practices) certification for food-safety excellence.' },
    { year: '2020', event: 'QCI plays a pivotal role in COVID-19 testing lab accreditation, onboarding 1000+ labs in record time.' },
    { year: '2023', event: 'Digital transformation initiative — QCI launches online accreditation portals for all five boards.' },
  ]);

  const testimonials = JSON.stringify([
    { name: 'Arjun Mehta',   role: 'Senior Analyst, NABL',    tenure: '4 years at QCI', initials: 'AM', gradient: 'from-orange-500 to-amber-500',  quote: "Every assessment I conduct directly impacts whether a laboratory's results can be trusted by doctors and patients. That accountability gives every Monday morning real meaning." },
    { name: 'Priya Nair',    role: 'Associate Manager, NABH', tenure: '5 years at QCI', initials: 'PN', gradient: 'from-teal-500 to-cyan-600',    quote: 'When a hospital gets NABH accreditation after our assessment, I know patient outcomes will improve.' },
    { name: 'Vikram Sharma', role: 'Project Manager, NABET',  tenure: '6 years at QCI', initials: 'VS', gradient: 'from-violet-500 to-indigo-600', quote: 'The career growth here is genuinely structured — I started as a Coordinator, and within 6 years I am leading a team of 8 across three states.' },
    { name: 'Sunita Reddy',  role: 'Coordinator, PADD',       tenure: '2 years at QCI', initials: 'SR', gradient: 'from-blue-500 to-indigo-600',   quote: 'The collaborative culture across departments is something I did not expect. I work daily with healthcare professionals, educators, and chemists.' },
  ]);

  const announcements = JSON.stringify([
    { tag: 'Recruitment', date: 'Apr 2025', title: 'CEO Recruitment — NBQP',        desc: 'Applications invited for the position of Chief Executive Officer at National Board for Quality Promotion.',       color: 'border-l-rose-500',   href: 'https://qcin.org/nbqp' },
    { tag: 'Workshop',    date: 'Apr 2025', title: 'Capacity Building Workshop',     desc: 'QCI and NABH to conduct a capacity building workshop for hospital administrators and quality managers.',           color: 'border-l-teal-500',   href: 'https://www.nabh.co/' },
    { tag: 'Initiative',  date: 'Mar 2025', title: 'Quality Reform Initiative',      desc: 'QCI launches a nationwide quality reform initiative targeting MSMEs under the ZED Certification programme.',      color: 'border-l-blue-500',   href: 'https://zed.org.in/' },
    { tag: 'Accreditation', date: 'Mar 2025', title: 'NABL Milestone: 14,000+ Labs', desc: "NABL crosses 14,000 accredited laboratories — a major milestone in India's quality infrastructure journey.",   color: 'border-l-orange-500', href: 'https://www.nabl-india.org/' },
    { tag: 'Education',   date: 'Feb 2025', title: 'Gunvatta Gurukul — Batch 6',     desc: "Applications open for the 6th batch of QCI's flagship student programme on quality management. 100 seats.",    color: 'border-l-amber-500',  href: 'https://gunvattagurukul.qcin.org/' },
    { tag: 'Governance',  date: 'Feb 2025', title: 'Sarpanch Samwaad Programme',     desc: "New cohort of Gram Panchayat leaders trained under QCI's rural quality governance outreach initiative.",       color: 'border-l-green-500',  href: 'https://qcin.org/sarpanch-samvaad/' },
  ]);

  const events = JSON.stringify([
    { emoji: '🏥', type: 'NABH',  month: 'May', year: '2025', title: 'NABH Healthcare Quality Summit',  location: 'New Delhi', desc: 'Annual summit bringing together healthcare leaders to discuss accreditation standards and patient safety.' },
    { emoji: '🔬', type: 'NABL',  month: 'Apr', year: '2025', title: 'Laboratory Quality Forum',        location: 'Mumbai',    desc: 'Forum for laboratory professionals on emerging testing standards and NABL accreditation processes.' },
    { emoji: '🎓', type: 'NABET', month: 'Apr', year: '2025', title: 'Education Quality Conclave',      location: 'Bengaluru', desc: 'Conclave on quality frameworks for educational institutions with NABET accreditation body.' },
    { emoji: '🏆', type: 'NBQP',  month: 'Mar', year: '2025', title: 'National Quality Award Ceremony', location: 'New Delhi', desc: 'Annual ceremony recognising organisations for excellence in quality management and innovation.' },
  ]);

  const initiatives = JSON.stringify([
    { emoji: '🎓', tag: 'Student Programme', title: 'Gunvatta Gurukul', desc: "QCI's flagship student initiative — 100 seats every two months for hands-on quality management training.", badges: ['100 seats/batch', 'Every 2 months', 'Certificate'], gradient: 'from-amber-500 to-red-500',    href: 'https://gunvattagurukul.qcin.org/' },
    { emoji: '🌾', tag: 'Rural Outreach',    title: 'Sarpanch Samwaad', desc: 'Connecting Gram Panchayat leaders with quality frameworks to drive governance at the grassroot level.',          badges: ['Gram Panchayats', 'Quality Governance', 'Rural Impact'], gradient: 'from-green-600 to-teal-500',  href: 'https://qcin.org/sarpanch-samvaad/' },
    { emoji: '🏙️', tag: 'Smart City',       title: 'Quality City Nashik', desc: "Transforming Nashik into India's first Quality City — embedding standards across civic services and industry.", badges: ['Nashik', 'Civic Quality', 'Model City'],    gradient: 'from-violet-600 to-pink-500', href: 'https://qcin.org/quality-city-nashik/' },
    { emoji: '🏭', tag: 'Make in India',     title: 'ZED Certification',  desc: 'Zero Defect Zero Effect — MSME certification programme targeting 1.25 million MSMEs for international quality standards.', badges: ['1.25M MSMEs', 'Zero Defect', 'Make in India'], gradient: 'from-teal-600 to-blue-600', href: 'https://zed.org.in/' },
  ]);

  const S = [
    // ── General ──────────────────────────────────────────────────────────────
    ['site_name',             'Quality Council of India',                                                  'Site Name',          'general'],
    ['site_tagline',          "India's National Accreditation Body",                                       'Site Tagline',       'general'],
    ['primary_color',         '#3791E5',                                                                   'Primary Color',      'general'],
    ['default_company',       'Quality Council of India',                                                  'Default Company',    'general'],
    ['default_location',      'New Delhi',                                                                 'Default Location',   'general'],
    ['currency_symbol',       '₹',                                                                         'Currency Symbol',    'general'],
    ['footer_about',          'Quality Council of India (QCI) is a non-profit autonomous body established under the aegis of DPIIT, Ministry of Commerce & Industry, Government of India. A unique Public-Private Partnership for quality standards.', 'Footer About', 'general'],
    ['footer_email',          'info@qcin.org',                                                             'Footer Email',       'general'],
    ['footer_phone',          '011-26186680',                                                              'Footer Phone',       'general'],
    ['footer_address',        'J 200, Block J, Nauroji Nagar, World Trade Centre, New Delhi – 110029',     'Footer Address',     'general'],
    ['footer_linkedin',       'https://www.linkedin.com/company/quality-council-of-india/',               'LinkedIn URL',       'general'],
    ['footer_twitter',        'https://twitter.com/qci_india',                                            'Twitter URL',        'general'],
    ['footer_instagram',      'https://www.instagram.com/qualitycouncilofindia/',                         'Instagram URL',      'general'],
    ['footer_facebook',       'https://www.facebook.com/QualityCouncilOfIndia/',                          'Facebook URL',       'general'],
    // ── Contact ──────────────────────────────────────────────────────────────
    ['contact_address',       'J 200, Block J, Nauroji Nagar, World Trade Centre, New Delhi – 110029',     'Address',            'contact'],
    ['contact_phone',         '011-26186680 to 83',                                                        'Phone',              'contact'],
    ['contact_email_general', 'info@qcin.org',                                                             'General Email',      'contact'],
    ['contact_email_hr',      'hrcareers@qcin.org',                                                        'HR Email',           'contact'],
    ['contact_hours',         'Monday – Friday, 9:00 am – 5:30 pm',                                       'Office Hours',       'contact'],
    // ── Home: Hero ───────────────────────────────────────────────────────────
    ['home_hero_badge',        'Established 1997 · Ministry of Commerce & Industry, Government of India',  'Hero Badge',         'home'],
    ['home_hero_title_1',      'One Portal.',                                                              'Hero Title Line 1',  'home'],
    ['home_hero_title_2',      'All of Quality India.',                                                    'Hero Title Line 2',  'home'],
    ['home_hero_subtitle',     'Search careers across NABH, NABL, NABCB, NABET & NBQP — every board, every division, all in one place.', 'Hero Subtitle', 'home'],
    ['home_search_placeholder','Role, board, skill, or department…',                                       'Search Placeholder', 'home'],
    // ── Home: Stats ──────────────────────────────────────────────────────────
    ['home_stat1_value', '500000', 'Stat 1 Value', 'home'], ['home_stat1_label', 'MSMEs Certified',       'Stat 1 Label', 'home'], ['home_stat1_sub', 'Under ZED Programme',  'Stat 1 Sub', 'home'],
    ['home_stat2_value', '29000',  'Stat 2 Value', 'home'], ['home_stat2_label', 'Healthcare Entities',   'Stat 2 Label', 'home'], ['home_stat2_sub', 'Accredited by NABH',   'Stat 2 Sub', 'home'],
    ['home_stat3_value', '14000',  'Stat 3 Value', 'home'], ['home_stat3_label', 'Laboratories',          'Stat 3 Label', 'home'], ['home_stat3_sub', 'Accredited by NABL',   'Stat 3 Sub', 'home'],
    ['home_stat4_value', '45000',  'Stat 4 Value', 'home'], ['home_stat4_label', 'Professionals Trained', 'Stat 4 Label', 'home'], ['home_stat4_sub', 'Across programmes',    'Stat 4 Sub', 'home'],
    // ── Home: JSON arrays ────────────────────────────────────────────────────
    ['home_announcements', announcements, 'Announcements (JSON)', 'home'],
    ['home_events',        events,        'Events (JSON)',         'home'],
    ['home_initiatives',   initiatives,   'Initiatives (JSON)',    'home'],
    // ── Home: CTA ────────────────────────────────────────────────────────────
    ['home_cta_title',    'Be Part of Quality India',                                                      'CTA Title',          'home'],
    ['home_cta_subtitle', 'Open roles across all five boards and four core divisions. Upload your resume and let our matcher find the best fit.', 'CTA Subtitle', 'home'],
    // ── About: Hero ──────────────────────────────────────────────────────────
    ['about_hero_badge',    'Established 1997 · Ministry of Commerce & Industry, Government of India',    'Hero Badge',         'about'],
    ['about_hero_title',    'Quality Council of India',                                                    'Hero Title',         'about'],
    ['about_hero_subtitle', "India's apex body for quality standards — operating through NABCB, NABH, NABET, NABL, and NBQP to accredit hospitals, laboratories, educational institutions, and certification bodies.", 'Hero Subtitle', 'about'],
    // ── About: Stats ─────────────────────────────────────────────────────────
    ['about_stat1_value', '27+',     'Stat 1 Value', 'about'], ['about_stat1_label', 'Years of Excellence', 'Stat 1 Label', 'about'],
    ['about_stat2_value', '5',       'Stat 2 Value', 'about'], ['about_stat2_label', 'National Boards',     'Stat 2 Label', 'about'],
    ['about_stat3_value', '10,000+', 'Stat 3 Value', 'about'], ['about_stat3_label', 'Accredited Entities', 'Stat 3 Label', 'about'],
    ['about_stat4_value', '39',      'Stat 4 Value', 'about'], ['about_stat4_label', 'Council Members',     'Stat 4 Label', 'about'],
    // ── About: Mission & Vision ───────────────────────────────────────────────
    ['about_mission',  'To create a Quality Mindset across all sectors and ensure quality across products and services that touch every citizen — developing accreditation standards, improving processes, and ensuring compliance to quality benchmarks for inclusive and sustainable development.', 'Mission Statement', 'about'],
    ['about_vision',   'To enhance quality across all sectors for inclusive and sustainable development — building "Quality for National Wellbeing" as a way of life for every Indian organisation, product, and service.', 'Vision Statement', 'about'],
    ['about_ppp_note', 'QCI is a non-profit autonomous body established through a Cabinet decision in 1996 under the Ministry of Commerce & Industry, Government of India, and registered under the Societies Registration Act. It operates on a unique Public-Private Partnership model with equal representation from Government, Industry, and Stakeholders across 39 council members.', 'PPP Note', 'about'],
    // ── About: JSON arrays ────────────────────────────────────────────────────
    ['about_leaders',      leaders,      'Leadership (JSON)',   'about'],
    ['about_board_chairs', boardChairs,  'Board Chairs (JSON)', 'about'],
    ['about_milestones',   milestones,   'Milestones (JSON)',   'about'],
    ['about_testimonials', testimonials, 'Testimonials (JSON)', 'about'],
    // ── Legacy (kept for backward compat) ────────────────────────────────────
    ['hero_title',          'Build Your Career with QCI',                                                  'Hero Title (Legacy)', 'general'],
    ['hero_subtitle',       "Discover meaningful opportunities at India's premier national accreditation body.", 'Hero Subtitle (Legacy)', 'general'],
    ['hero_gradient_from',  '#012249',                                                                     'Gradient From (Legacy)', 'general'],
    ['hero_gradient_to',    '#3791E5',                                                                     'Gradient To (Legacy)',   'general'],
  ];

  for (const [key, value, lbl, category] of S) {
    await query(
      'INSERT INTO settings (key, value, label, category) VALUES ($1, $2, $3, $4) ON CONFLICT (key) DO NOTHING',
      [key, value, lbl, category]
    );
  }

  // Force-update specific settings that were corrected after initial seed
  const FORCE_UPDATE = ['about_leaders', 'about_board_chairs'];
  const forceMap = { about_leaders: leaders, about_board_chairs: boardChairs };
  for (const key of FORCE_UPDATE) {
    await query('UPDATE settings SET value = $1 WHERE key = $2', [forceMap[key], key]);
  }
  console.log('[startup] settings seeded (' + S.length + ' keys)');
}

seedSettings().catch(err => console.error('[startup] seedSettings error:', err));

module.exports = app;
