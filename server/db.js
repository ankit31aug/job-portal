const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'jobportal.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    pincode TEXT,
    city TEXT,
    state TEXT,
    role TEXT NOT NULL DEFAULT 'jobseeker',
    company_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employer_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    job_type TEXT NOT NULL DEFAULT 'Full-time',
    category TEXT NOT NULL,
    experience_min INTEGER DEFAULT 0,
    experience_max INTEGER DEFAULT 5,
    salary_min INTEGER,
    salary_max INTEGER,
    description TEXT NOT NULL,
    requirements TEXT NOT NULL,
    skills TEXT NOT NULL,
    openings INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(employer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    applicant_id INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    pincode TEXT NOT NULL,
    city TEXT,
    state TEXT,
    experience_years INTEGER DEFAULT 0,
    current_company TEXT,
    current_ctc TEXT,
    expected_ctc TEXT,
    notice_period TEXT,
    cover_letter TEXT,
    resume_path TEXT,
    skills TEXT,
    status TEXT DEFAULT 'pending',
    match_score INTEGER DEFAULT 0,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(job_id) REFERENCES jobs(id),
    FOREIGN KEY(applicant_id) REFERENCES users(id)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    label TEXT,
    category TEXT DEFAULT 'general'
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    job_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, job_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(job_id) REFERENCES jobs(id)
  );
`);

// Migration: add department column if not present
try { db.exec('ALTER TABLE jobs ADD COLUMN department TEXT DEFAULT "General"'); } catch (e) { /* already exists */ }

// Always migrate old seed data to QCI format
db.exec(`
  UPDATE jobs
  SET company = 'Quality Council of India', location = 'New Delhi'
  WHERE company IN ('TechCorp Solutions', 'InfoSys Ltd', 'StartupHub Inc')
`);

const bcrypt = require('bcryptjs');

// Seed default site settings
const defaultSettings = [
  ['site_name',           'Quality Council of India',           'Site Name',                   'branding'],
  ['site_tagline',        "India's National Accreditation Body", 'Site Tagline',                'branding'],
  ['hero_title',          'Build Your Career with QCI',          'Hero Title',                  'hero'],
  ['hero_subtitle',       "Discover meaningful opportunities at India's premier national accreditation body — across NABH, NABET, and NABL divisions.", 'Hero Subtitle', 'hero'],
  ['hero_gradient_from',  '#1e3a5f',                             'Hero Background Start Color', 'hero'],
  ['hero_gradient_to',    '#1d4ed8',                             'Hero Background End Color',   'hero'],
  ['primary_color',       '#2563eb',                             'Primary Accent Color',        'branding'],
  ['footer_about',        'Quality Council of India (QCI) is a non-profit autonomous body established under the aegis of the Department for Promotion of Industry and Internal Trade (DPIIT), Ministry of Commerce & Industry, Government of India, to spearhead the quality movement in India.', 'Footer About Text', 'footer'],
  ['footer_email',        'careers@qci.org',                     'Contact Email',               'footer'],
  ['footer_phone',        '+91-11-45010102',                     'Contact Phone',               'footer'],
  ['footer_address',      'ITPI Building, 4th Floor, 4A Ring Road, I.P. Estate, New Delhi – 110002', 'Address', 'footer'],
  ['footer_linkedin',     'https://www.linkedin.com/company/quality-council-of-india', 'LinkedIn URL', 'footer'],
  ['footer_twitter',      '',                                    'Twitter/X URL',               'footer'],
  ['footer_instagram',    '',                                    'Instagram URL',               'footer'],
  ['footer_facebook',     '',                                    'Facebook URL',                'footer'],
  ['default_company',     'Quality Council of India',           'Default Company Name',        'jobs'],
  ['default_location',    'New Delhi',                          'Default Location',            'jobs'],
  ['currency_symbol',     '₹',                                  'Currency Symbol',             'jobs'],
];

const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value, label, category) VALUES (?, ?, ?, ?)');
for (const [key, value, label, category] of defaultSettings) {
  insertSetting.run(key, value, label, category);
}
const QCI = 'Quality Council of India';
const ND = 'New Delhi';

// Seed HR admin account if not present
const hrUser = db.prepare("SELECT id FROM users WHERE email = 'hr-admin@qci.org'").get();
let hrAdminId = hrUser ? hrUser.id : null;
if (!hrUser) {
  const result = db.prepare(`
    INSERT INTO users (name, email, password, role, company_name, phone, city, state, pincode)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('QCI HR Admin', 'hr-admin@qci.org', bcrypt.hashSync('HRAdmin@123', 10),
    'hr', QCI, '9876500000', 'New Delhi', 'Delhi', '110001');
  hrAdminId = result.lastInsertRowid;
}

// Seed initial jobs if none exist
const jobCount = db.prepare('SELECT COUNT(*) as count FROM jobs').get();
if (jobCount.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role, company_name, phone, city, state)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const pw = bcrypt.hashSync('Admin@123', 10);
  const emp1 = insertUser.run('QCI NABH Manager', 'nabh@qci.org', pw, 'employer', QCI, '9876543210', 'New Delhi', 'Delhi');
  const emp2 = insertUser.run('QCI NABET Manager', 'nabet@qci.org', pw, 'employer', QCI, '9876543211', 'New Delhi', 'Delhi');
  const emp3 = insertUser.run('QCI NABL Manager', 'nabl@qci.org', pw, 'employer', QCI, '9876543212', 'New Delhi', 'Delhi');

  const ij = db.prepare(`
    INSERT INTO jobs (employer_id, title, company, location, job_type, category, department,
      experience_min, experience_max, salary_min, salary_max, description, requirements, skills, openings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  ij.run(emp1.lastInsertRowid, 'Senior React Developer', QCI, ND, 'Full-time', 'Technology', 'General', 3, 7, 1200000, 2000000,
    'QCI is looking for a Senior React Developer to build cutting-edge web applications for our accreditation management systems.',
    'Bachelor degree in CS or related field\n3+ years of React.js experience\nStrong knowledge of JavaScript ES6+\nExperience with REST APIs and GraphQL\nGit proficiency required',
    'React,JavaScript,TypeScript,Redux,HTML,CSS,Node.js,Git', 3);

  ij.run(emp1.lastInsertRowid, 'Full Stack Developer', QCI, ND, 'Full-time', 'Technology', 'General', 2, 5, 800000, 1500000,
    'Join QCI as a Full Stack Developer and work on our digital accreditation platforms. Build features end-to-end from database to UI.',
    'Experience with React and Node.js\n2+ years of full stack development\nKnowledge of SQL and NoSQL databases\nStrong problem-solving skills',
    'React,Node.js,JavaScript,MongoDB,MySQL,Express,Git,Docker', 2);

  ij.run(emp2.lastInsertRowid, 'Python Backend Developer', QCI, ND, 'Full-time', 'Technology', 'General', 1, 4, 600000, 1200000,
    'We are hiring Python developers to work on our data engineering platform for NABET accreditation systems.',
    'Proficiency in Python 3.x\nExperience with Django or FastAPI\nDatabase design skills (PostgreSQL/MySQL)\nREST API development experience',
    'Python,Django,FastAPI,PostgreSQL,Redis,Docker,AWS,Git', 5);

  ij.run(emp2.lastInsertRowid, 'Data Scientist', QCI, ND, 'Full-time', 'Technology', 'General', 2, 5, 1000000, 1800000,
    'Exciting opportunity for a Data Scientist to work on AI/ML projects for QCI accreditation analytics.',
    'Masters or PhD in Statistics/CS/Math\n2+ years ML/data science experience\nPython proficiency (pandas, sklearn, TensorFlow)\nStrong statistical knowledge',
    'Python,Machine Learning,TensorFlow,PyTorch,SQL,pandas,scikit-learn,Statistics', 2);

  ij.run(emp3.lastInsertRowid, 'UI/UX Designer', QCI, ND, 'Full-time', 'Design', 'General', 1, 4, 600000, 1000000,
    'QCI is looking for a creative UI/UX Designer to design intuitive interfaces for our accreditation portal.',
    'Portfolio showcasing UI/UX projects\nProficiency in Figma and Adobe XD\nUnderstanding of user research and usability testing\nHTML/CSS knowledge preferred',
    'Figma,Adobe XD,UI Design,UX Research,Prototyping,CSS,HTML,Wireframing', 1);

  ij.run(emp3.lastInsertRowid, 'DevOps Engineer', QCI, ND, 'Full-time', 'Technology', 'General', 2, 6, 1000000, 1800000,
    'QCI needs a DevOps Engineer to manage cloud infrastructure and CI/CD pipelines for our national accreditation systems.',
    '2+ years DevOps experience\nStrong AWS/GCP/Azure knowledge\nKubernetes and Docker expertise\nCI/CD pipeline experience (Jenkins/GitHub Actions)',
    'AWS,Docker,Kubernetes,CI/CD,Jenkins,Terraform,Linux,Python,Git', 2);

  ij.run(emp1.lastInsertRowid, 'Android Developer', QCI, ND, 'Full-time', 'Technology', 'General', 1, 4, 700000, 1400000,
    'Join QCI mobile team to build Android applications for the accreditation tracking and management system.',
    '1+ years Android development experience\nProficiency in Kotlin and Java\nKnowledge of Android SDK and Jetpack components\nREST API integration experience',
    'Android,Kotlin,Java,Jetpack Compose,REST APIs,Firebase,Git,MVVM', 3);

  ij.run(emp2.lastInsertRowid, 'Product Manager', QCI, ND, 'Full-time', 'Management', 'General', 3, 8, 1500000, 2500000,
    'QCI needs an experienced Product Manager to lead product development for our enterprise accreditation SaaS platform.',
    '3+ years product management experience\nTechnical background preferred\nExperience with Agile methodologies\nStrong analytical and communication skills',
    'Product Management,Agile,Scrum,Jira,Analytics,SQL,Stakeholder Management', 1);
}

// Seed QCI department-specific jobs if not present
const deptJobs = [
  // ── NABH ──────────────────────────────────────────────────
  {
    title: 'Hospital Accreditation Coordinator', department: 'NABH', category: 'Operations',
    exp_min: 1, exp_max: 3, sal_min: 400000, sal_max: 700000, openings: 3,
    description: 'Coordinate and facilitate NABH accreditation processes for hospitals and healthcare providers across India. Work closely with hospital management teams to implement quality standards and prepare for accreditation assessments.',
    requirements: '1+ years in healthcare administration or quality management\nKnowledge of NABH standards and healthcare regulations\nStrong documentation and reporting skills\nWillingness to travel for hospital site assessments\nExcellent written and verbal communication skills',
    skills: 'Healthcare,Quality Management,Documentation,Communication,MS Office,NABH Standards,Accreditation',
  },
  {
    title: 'Quality Analyst - Healthcare', department: 'NABH', category: 'Operations',
    exp_min: 2, exp_max: 4, sal_min: 500000, sal_max: 900000, openings: 2,
    description: 'Analyze hospital quality standards compliance, prepare detailed assessment reports, and support continuous quality improvement initiatives under the NABH accreditation framework.',
    requirements: '2+ years in quality assurance or healthcare quality management\nFamiliarity with NABH/JCI standards\nStrong analytical and data interpretation skills\nProficiency in MS Excel and report writing\nExperience conducting internal audits',
    skills: 'Quality Assurance,Data Analysis,Healthcare Standards,Excel,Report Writing,Audit,NABH,ISO',
  },
  {
    title: 'Associate Manager - NABH', department: 'NABH', category: 'Management',
    exp_min: 3, exp_max: 6, sal_min: 800000, sal_max: 1400000, openings: 2,
    description: 'Lead the NABH accreditation team to drive hospital quality improvement programs. Manage a team of coordinators and analysts while building relationships with healthcare institutions seeking NABH certification.',
    requirements: '3+ years in healthcare quality or accreditation management\nProven team leadership experience\nDeep knowledge of NABH standards and assessment processes\nExcellent stakeholder management skills\nMBA or healthcare management degree preferred',
    skills: 'Team Management,Healthcare Policy,Project Management,Quality Systems,Leadership,NABH,Stakeholder Management',
  },
  {
    title: 'Project Manager - Hospital Accreditation', department: 'NABH', category: 'Management',
    exp_min: 5, exp_max: 8, sal_min: 1200000, sal_max: 2000000, openings: 1,
    description: 'Lead end-to-end NABH accreditation projects for major hospital networks. Define project scope, manage timelines, coordinate multi-disciplinary teams, and ensure successful accreditation outcomes for healthcare clients.',
    requirements: '5+ years in healthcare project management\nPMP or equivalent certification preferred\nExtensive knowledge of NABH standards and healthcare regulations\nExperience managing large cross-functional teams\nStrong negotiation and conflict resolution skills',
    skills: 'Project Management,PMP,Healthcare,NABH,Stakeholder Management,Leadership,Risk Management,MS Project',
  },
  // ── NABET ─────────────────────────────────────────────────
  {
    title: 'Training Accreditation Coordinator', department: 'NABET', category: 'Operations',
    exp_min: 1, exp_max: 3, sal_min: 400000, sal_max: 700000, openings: 3,
    description: 'Coordinate NABET accreditation processes for educational institutions and training bodies. Support assessments, maintain accreditation records, and assist institutions in meeting NABET quality benchmarks.',
    requirements: '1+ years in education administration or quality assurance\nKnowledge of NABET standards and education sector regulations\nStrong coordination and documentation skills\nWillingness to travel for institution assessments\nGood communication and interpersonal skills',
    skills: 'Education,Training,Documentation,Communication,Quality Management,NABET Standards,Coordination',
  },
  {
    title: 'Education Quality Analyst', department: 'NABET', category: 'Operations',
    exp_min: 2, exp_max: 4, sal_min: 500000, sal_max: 900000, openings: 2,
    description: 'Assess quality standards compliance at educational institutions and training organizations. Prepare comprehensive evaluation reports and support institutions through the NABET accreditation journey.',
    requirements: '2+ years in education quality or institutional assessment\nFamiliarity with NABET/NBA standards\nAnalytical mindset with strong report writing skills\nExperience in conducting academic audits\nProficiency in data management tools',
    skills: 'Education Standards,Data Analysis,Quality Assurance,Excel,Report Writing,Audit,NABET,Curriculum Assessment',
  },
  {
    title: 'Associate Manager - NABET', department: 'NABET', category: 'Management',
    exp_min: 3, exp_max: 6, sal_min: 800000, sal_max: 1400000, openings: 2,
    description: 'Manage the NABET accreditation division, overseeing assessment teams and managing relationships with educational institutions nationwide. Drive process improvements and quality benchmarks across the accreditation lifecycle.',
    requirements: '3+ years in education quality management or accreditation\nTeam leadership experience of 3+ members\nIn-depth knowledge of NABET framework and education policy\nAbility to manage multiple institution assessments simultaneously\nMaster\'s degree in Education Management or related field',
    skills: 'Team Management,Education Policy,Project Management,Quality Systems,Leadership,NABET,Process Improvement',
  },
  {
    title: 'Project Manager - Education Accreditation', department: 'NABET', category: 'Management',
    exp_min: 5, exp_max: 8, sal_min: 1200000, sal_max: 2000000, openings: 1,
    description: 'Drive large-scale NABET accreditation projects for universities, vocational training bodies, and corporate learning institutions. Oversee full project lifecycles from initial gap analysis to final accreditation award.',
    requirements: '5+ years in education sector project management\nPMP or equivalent certification preferred\nComprehensive understanding of NABET standards and education regulations\nProven track record managing multi-stakeholder projects\nStrong written communication for executive-level reporting',
    skills: 'Project Management,PMP,Education,NABET,Stakeholder Management,Leadership,Risk Management,Strategic Planning',
  },
  // ── NABL ──────────────────────────────────────────────────
  {
    title: 'Laboratory Accreditation Coordinator', department: 'NABL', category: 'Operations',
    exp_min: 1, exp_max: 3, sal_min: 400000, sal_max: 700000, openings: 3,
    description: 'Support the NABL accreditation process for testing and calibration laboratories. Coordinate documentation, schedule assessments, and guide laboratories through ISO/IEC 17025 compliance requirements.',
    requirements: '1+ years in laboratory operations, quality, or scientific environment\nBasic knowledge of NABL/ISO 17025 standards\nStrong organizational and documentation skills\nWillingness to travel to laboratory sites\nScience or engineering graduate preferred',
    skills: 'Laboratory,Quality Management,Documentation,Communication,MS Office,NABL Standards,ISO 17025,Coordination',
  },
  {
    title: 'Technical Analyst - NABL', department: 'NABL', category: 'Operations',
    exp_min: 2, exp_max: 4, sal_min: 500000, sal_max: 900000, openings: 2,
    description: 'Conduct technical assessments of testing and calibration laboratories against NABL and ISO/IEC 17025 requirements. Prepare detailed technical evaluation reports and support laboratories in implementing corrective actions.',
    requirements: '2+ years in laboratory quality or technical assessments\nStrong knowledge of ISO/IEC 17025 and NABL accreditation criteria\nExperience in laboratory audits or inspections\nAbility to evaluate measurement uncertainty and calibration procedures\nDegree in science, engineering, or metrology',
    skills: 'Laboratory Standards,Data Analysis,Quality Assurance,Technical Writing,Audit,ISO 17025,NABL,Metrology,Calibration',
  },
  {
    title: 'Associate Manager - NABL', department: 'NABL', category: 'Management',
    exp_min: 3, exp_max: 6, sal_min: 800000, sal_max: 1400000, openings: 2,
    description: 'Lead the NABL accreditation team responsible for testing and calibration laboratories. Manage assessor panels, review technical reports, and maintain QCI\'s technical excellence in laboratory accreditation.',
    requirements: '3+ years in laboratory quality management or NABL accreditation\nTeam leadership with experience managing technical staff\nExpert-level knowledge of ISO/IEC 17025 and NABL requirements\nExperience in managing multiple laboratory assessments\nPostgraduate in science or engineering discipline',
    skills: 'Team Management,Laboratory Policy,Project Management,Quality Systems,Leadership,NABL,ISO 17025,Technical Review',
  },
  {
    title: 'Project Manager - Laboratory Accreditation', department: 'NABL', category: 'Management',
    exp_min: 5, exp_max: 8, sal_min: 1200000, sal_max: 2000000, openings: 1,
    description: 'Manage large-scale NABL accreditation projects for government labs, FMCG testing labs, and industrial calibration centres. Own the full accreditation project lifecycle and drive strategic growth of NABL\'s accredited laboratory network.',
    requirements: '5+ years in laboratory management or quality systems\nPMP or equivalent certification highly preferred\nMastery of NABL standards, ISO/IEC 17025, and related regulatory requirements\nExperience managing 10+ concurrent laboratory assessments\nExcellent client-facing and executive communication skills',
    skills: 'Project Management,PMP,Laboratory,NABL,Stakeholder Management,Leadership,Risk Management,ISO 17025,Strategic Planning',
  },
  // ── PADD ──────────────────────────────────────────────────
  {
    title: 'Documentation & Compliance Coordinator', department: 'PADD', category: 'Operations',
    exp_min: 1, exp_max: 3, sal_min: 400000, sal_max: 700000, openings: 3,
    description: 'Support the Project Analysis and Documentation Division in maintaining conformity assessment frameworks including IndiaGHP and Ayush Mark. Coordinate documentation workflows, prepare compliance reports, and assist in voluntary certification programmes.',
    requirements: '1+ years in documentation, compliance, or quality administration\nStrong proficiency in MS Office (Word, Excel, PowerPoint)\nExcellent written communication for report drafting\nAbility to manage and organise large volumes of technical documents\nGraduate in any discipline; science or commerce preferred',
    skills: 'Documentation,Compliance,MS Office,Report Writing,Quality Management,Coordination,Technical Writing,Data Entry',
  },
  {
    title: 'Project Analyst - Documentation', department: 'PADD', category: 'Operations',
    exp_min: 2, exp_max: 4, sal_min: 500000, sal_max: 900000, openings: 2,
    description: 'Analyse project documentation for QCI voluntary certification schemes, evaluate compliance against established frameworks, and produce detailed analytical reports. Support the division in identifying process improvements and documentation gaps.',
    requirements: '2+ years in project analysis, documentation review, or quality systems\nStrong analytical and critical thinking skills\nExperience with compliance frameworks or voluntary certification programmes\nProficiency in data analysis tools (Excel, Power BI preferred)\nAbility to manage multiple project documentation streams simultaneously',
    skills: 'Project Analysis,Documentation,Quality Systems,Data Analysis,Excel,Compliance,Report Writing,Process Improvement',
  },
  {
    title: 'Associate Manager - PADD', department: 'PADD', category: 'Management',
    exp_min: 3, exp_max: 6, sal_min: 800000, sal_max: 1400000, openings: 2,
    description: 'Lead a team managing conformity assessment documentation projects for QCI certification schemes. Oversee documentation quality, manage stakeholder relationships, and drive process standardisation across the division.',
    requirements: '3+ years in documentation management or conformity assessment\nTeam leadership experience with 3+ direct reports\nIn-depth understanding of voluntary certification standards and regulatory frameworks\nStrong stakeholder management and communication skills\nMaster\'s degree in management, quality, or a related field preferred',
    skills: 'Team Management,Documentation Strategy,Quality Systems,Stakeholder Management,Leadership,Process Standardisation,Conformity Assessment',
  },
  {
    title: 'Project Manager - Conformity Assessment', department: 'PADD', category: 'Management',
    exp_min: 5, exp_max: 8, sal_min: 1200000, sal_max: 2000000, openings: 1,
    description: 'Drive end-to-end management of conformity assessment documentation projects including IndiaGHP, Ayush Mark, and other voluntary certification schemes. Manage cross-functional teams, government interfaces, and programme roadmaps.',
    requirements: '5+ years in project management within quality or government sectors\nPMP or equivalent certification preferred\nProven track record managing multi-stakeholder government documentation projects\nExpert-level knowledge of conformity assessment and voluntary certification frameworks\nExcellent written and verbal communication for policy-level reporting',
    skills: 'Project Management,PMP,Conformity Assessment,Government Liaison,Leadership,Risk Management,Strategic Planning,Documentation',
  },
  // ── PPID ──────────────────────────────────────────────────
  {
    title: 'Project Implementation Coordinator', department: 'PPID', category: 'Operations',
    exp_min: 1, exp_max: 3, sal_min: 400000, sal_max: 700000, openings: 3,
    description: 'Support the Project Planning & Implementation Division in executing quality improvement programmes for central and state government clients. Coordinate project timelines, track deliverables, and maintain project dashboards.',
    requirements: '1+ years in project coordination, government projects, or programme management\nStrong MS Office and project tracking skills\nAbility to work with multiple government stakeholders simultaneously\nGood communication and follow-up skills\nGraduate in management, engineering, or science',
    skills: 'Project Coordination,Government Projects,MS Office,Stakeholder Communication,Tracking,Reporting,MS Project,Documentation',
  },
  {
    title: 'Project Analyst - Implementation', department: 'PPID', category: 'Operations',
    exp_min: 2, exp_max: 4, sal_min: 500000, sal_max: 900000, openings: 2,
    description: 'Analyse programme implementation progress, identify execution gaps, and prepare detailed status reports for government quality projects managed by PPID. Support project planning with data-driven insights and risk assessments.',
    requirements: '2+ years in government project analysis or programme implementation\nStrong analytical skills with experience in data-driven reporting\nFamiliarity with project management methodologies (Agile, Waterfall)\nExperience working with central or state government departments\nProficiency in project management tools',
    skills: 'Project Analysis,Programme Management,Government Projects,Risk Assessment,Data Analysis,Excel,Reporting,Agile,MS Project',
  },
  {
    title: 'Associate Manager - PPID', department: 'PPID', category: 'Management',
    exp_min: 3, exp_max: 6, sal_min: 800000, sal_max: 1400000, openings: 2,
    description: 'Manage a portfolio of quality improvement projects for state and central governments. Lead a team of project coordinators and analysts, interface with government clients, and ensure timely delivery of project milestones.',
    requirements: '3+ years managing government-funded or public sector quality projects\nTeam leadership with experience managing 4+ members\nStrong knowledge of government project procurement and execution frameworks\nExcellent stakeholder management skills across bureaucratic and technical teams\nMBA or equivalent postgraduate qualification preferred',
    skills: 'Team Management,Government Projects,Project Portfolio,Stakeholder Management,Leadership,Public Sector,Risk Management,Planning',
  },
  {
    title: 'Senior Project Manager - Government Quality Programmes', department: 'PPID', category: 'Management',
    exp_min: 5, exp_max: 8, sal_min: 1200000, sal_max: 2000000, openings: 1,
    description: 'Lead strategic quality improvement programmes commissioned by state and central government bodies. Define project architecture, manage large cross-functional teams, and ensure high-impact delivery across India-wide quality initiatives.',
    requirements: '5+ years leading government-contracted quality or infrastructure projects\nPMP certification strongly preferred\nExtensive experience navigating government procurement and administration\nAbility to manage project budgets exceeding ₹5 Cr\nStrong executive presence and reporting capability',
    skills: 'Senior Project Management,PMP,Government Strategy,Leadership,Budget Management,Risk Management,Stakeholder Management,Quality Frameworks',
  },
  // ── NDIE ──────────────────────────────────────────────────
  {
    title: 'Industry Quality Coordinator', department: 'NDIE', category: 'Operations',
    exp_min: 1, exp_max: 3, sal_min: 400000, sal_max: 700000, openings: 3,
    description: 'Support the National Division for Industry Excellence in coordinating quality benchmarking programmes and industry excellence initiatives. Assist in organising industry workshops, collecting benchmarking data, and preparing progress reports.',
    requirements: '1+ years in industry quality, manufacturing excellence, or benchmarking programmes\nGood understanding of industrial quality standards (ISO 9001 preferred)\nStrong coordination and event management skills\nWillingness to travel to industry sites across India\nEngineering or science graduate preferred',
    skills: 'Industry Quality,Benchmarking,ISO 9001,Coordination,Documentation,MS Office,Event Management,Quality Management',
  },
  {
    title: 'Industry Standards Analyst', department: 'NDIE', category: 'Operations',
    exp_min: 2, exp_max: 4, sal_min: 500000, sal_max: 900000, openings: 2,
    description: 'Analyse industrial quality performance data, conduct benchmarking assessments against national and international standards, and prepare detailed industry excellence reports. Support NDIE in identifying best practices and areas for improvement across sectors.',
    requirements: '2+ years in industrial quality assurance or standards compliance\nStrong knowledge of ISO 9001, manufacturing best practices, and industry benchmarking\nAnalytical skills with experience in quality data interpretation\nExperience conducting industry audits or assessments\nDegree in engineering, operations management, or related field',
    skills: 'Industry Standards,Benchmarking,ISO 9001,Data Analysis,Quality Assurance,Audit,Report Writing,Manufacturing,Lean',
  },
  {
    title: 'Associate Manager - NDIE', department: 'NDIE', category: 'Management',
    exp_min: 3, exp_max: 6, sal_min: 800000, sal_max: 1400000, openings: 2,
    description: 'Lead NDIE\'s industry excellence programmes, managing teams that conduct benchmarking studies and quality improvement initiatives across manufacturing, services, and MSMEs. Drive partnerships with industry bodies and sector associations.',
    requirements: '3+ years in industrial quality management, manufacturing excellence, or sector benchmarking\nTeam leadership with 3+ direct reports\nIn-depth understanding of quality frameworks (ISO 9001, Six Sigma, Lean preferred)\nStrong industry network and stakeholder management capability\nPostgraduate in industrial engineering, operations, or quality management',
    skills: 'Team Management,Industry Quality,Benchmarking,ISO 9001,Six Sigma,Lean,Stakeholder Management,Leadership,Industry Partnerships',
  },
  {
    title: 'Project Manager - Industry Excellence', department: 'NDIE', category: 'Management',
    exp_min: 5, exp_max: 8, sal_min: 1200000, sal_max: 2000000, openings: 1,
    description: 'Drive national-level industry excellence and benchmarking programmes across key sectors including manufacturing, MSMEs, and services. Own the full programme lifecycle from design to implementation, working closely with industry bodies and government departments.',
    requirements: '5+ years in industrial quality or sector excellence programme management\nPMP or Six Sigma Black Belt certification preferred\nProven experience managing multi-sector quality improvement programmes\nStrong government and industry stakeholder management at senior levels\nExcellent presentation and executive communication skills',
    skills: 'Project Management,PMP,Six Sigma,Industry Excellence,Benchmarking,Manufacturing Quality,Leadership,Strategic Planning,Government Liaison',
  },
];

const ijDept = db.prepare(`
  INSERT INTO jobs (employer_id, title, company, location, job_type, category, department,
    experience_min, experience_max, salary_min, salary_max, description, requirements, skills, openings)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const j of deptJobs) {
  const exists = db.prepare('SELECT id FROM jobs WHERE title = ? AND department = ?').get(j.title, j.department);
  if (!exists) {
    ijDept.run(hrAdminId, j.title, QCI, ND, 'Full-time', j.category, j.department,
      j.exp_min, j.exp_max, j.sal_min, j.sal_max, j.description, j.requirements, j.skills, j.openings);
  }
}

module.exports = db;
