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

// Seed sample jobs if none exist
const jobCount = db.prepare('SELECT COUNT(*) as count FROM jobs').get();
if (jobCount.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role, company_name, phone, city, state)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync('Admin@123', 10);

  const employer1 = insertUser.run('TechCorp HR', 'hr@techcorp.com', hashedPassword, 'employer', 'TechCorp Solutions', '9876543210', 'Bangalore', 'Karnataka');
  const employer2 = insertUser.run('InfoSys Recruiter', 'recruit@infosys.com', hashedPassword, 'employer', 'InfoSys Ltd', '9876543211', 'Pune', 'Maharashtra');
  const employer3 = insertUser.run('StartupHub HR', 'hr@startuphub.com', hashedPassword, 'employer', 'StartupHub Inc', '9876543212', 'Mumbai', 'Maharashtra');

  const insertJob = db.prepare(`
    INSERT INTO jobs (employer_id, title, company, location, job_type, category, experience_min, experience_max,
      salary_min, salary_max, description, requirements, skills, openings)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertJob.run(employer1.lastInsertRowid, 'Senior React Developer', 'TechCorp Solutions', 'Bangalore, Karnataka', 'Full-time', 'Technology', 3, 7, 1200000, 2000000,
    'We are looking for a Senior React Developer to join our dynamic team. You will be responsible for building cutting-edge web applications using React.js and related technologies.',
    'Bachelor degree in CS or related field\n3+ years of React.js experience\nStrong knowledge of JavaScript ES6+\nExperience with REST APIs and GraphQL\nGit proficiency required',
    'React,JavaScript,TypeScript,Redux,HTML,CSS,Node.js,Git', 3);

  insertJob.run(employer1.lastInsertRowid, 'Full Stack Developer', 'TechCorp Solutions', 'Bangalore, Karnataka', 'Full-time', 'Technology', 2, 5, 800000, 1500000,
    'Join our team as a Full Stack Developer and work on exciting products used by millions. You will build features end-to-end from database to UI.',
    'Experience with React and Node.js\n2+ years of full stack development\nKnowledge of SQL and NoSQL databases\nStrong problem-solving skills',
    'React,Node.js,JavaScript,MongoDB,MySQL,Express,Git,Docker', 2);

  insertJob.run(employer2.lastInsertRowid, 'Python Backend Developer', 'InfoSys Ltd', 'Pune, Maharashtra', 'Full-time', 'Technology', 1, 4, 600000, 1200000,
    'We are hiring Python developers to work on our data engineering platform. You will design and build scalable backend systems.',
    'Proficiency in Python 3.x\nExperience with Django or FastAPI\nDatabase design skills (PostgreSQL/MySQL)\nREST API development experience',
    'Python,Django,FastAPI,PostgreSQL,Redis,Docker,AWS,Git', 5);

  insertJob.run(employer2.lastInsertRowid, 'Data Scientist', 'InfoSys Ltd', 'Hyderabad, Telangana', 'Full-time', 'Data Science', 2, 5, 1000000, 1800000,
    'Exciting opportunity for a Data Scientist to work on AI/ML projects. You will build predictive models and derive insights from large datasets.',
    'Masters or PhD in Statistics/CS/Math\n2+ years ML/data science experience\nPython proficiency (pandas, sklearn, TensorFlow)\nStrong statistical knowledge',
    'Python,Machine Learning,TensorFlow,PyTorch,SQL,pandas,scikit-learn,Statistics', 2);

  insertJob.run(employer3.lastInsertRowid, 'UI/UX Designer', 'StartupHub Inc', 'Mumbai, Maharashtra', 'Full-time', 'Design', 1, 4, 600000, 1000000,
    'We are looking for a creative UI/UX Designer to design beautiful and intuitive user interfaces for our products.',
    'Portfolio showcasing UI/UX projects\nProficiency in Figma and Adobe XD\nUnderstanding of user research and usability testing\nHTML/CSS knowledge preferred',
    'Figma,Adobe XD,UI Design,UX Research,Prototyping,CSS,HTML,Wireframing', 1);

  insertJob.run(employer3.lastInsertRowid, 'DevOps Engineer', 'StartupHub Inc', 'Remote', 'Full-time', 'Technology', 2, 6, 1000000, 1800000,
    'Looking for a skilled DevOps Engineer to manage our cloud infrastructure and CI/CD pipelines. You will ensure high availability and performance.',
    '2+ years DevOps experience\nStrong AWS/GCP/Azure knowledge\nKubernetes and Docker expertise\nCI/CD pipeline experience (Jenkins/GitHub Actions)',
    'AWS,Docker,Kubernetes,CI/CD,Jenkins,Terraform,Linux,Python,Git', 2);

  insertJob.run(employer1.lastInsertRowid, 'Android Developer', 'TechCorp Solutions', 'Bangalore, Karnataka', 'Full-time', 'Mobile', 1, 4, 700000, 1400000,
    'Join our mobile team to build innovative Android applications. You will work on consumer-facing apps with millions of users.',
    '1+ years Android development experience\nProficiency in Kotlin and Java\nKnowledge of Android SDK and Jetpack components\nREST API integration experience',
    'Android,Kotlin,Java,Jetpack Compose,REST APIs,Firebase,Git,MVVM', 3);

  insertJob.run(employer2.lastInsertRowid, 'Product Manager', 'InfoSys Ltd', 'Chennai, Tamil Nadu', 'Full-time', 'Product', 3, 8, 1500000, 2500000,
    'We need an experienced Product Manager to lead product development for our enterprise SaaS platform. You will define product vision and roadmap.',
    '3+ years product management experience\nTechnical background preferred\nExperience with Agile methodologies\nStrong analytical and communication skills',
    'Product Management,Agile,Scrum,Jira,Analytics,SQL,Stakeholder Management', 1);
}

module.exports = db;
