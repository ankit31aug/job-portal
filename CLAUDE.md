# Quality Council of India — Job Portal

## Project Overview
A full-stack job portal web application where job seekers can find jobs, upload resumes for auto-fill and job matching. Employers can post jobs and manage applications.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + React Router v6
- **Backend**: Node.js + Express + better-sqlite3 (SQLite) + JWT + bcryptjs
- **File Upload**: Multer (resume upload)
- **Resume Parsing**: pdf-parse (extracts name, email, phone, pincode, skills from PDF)

## Project Structure
```
job-portal/
├── client/                        # React frontend (port 5173)
│   └── src/
│       ├── pages/
│       │   ├── Home.tsx           # Job listings with search & filters
│       │   ├── JobDetails.tsx     # Single job detail page
│       │   ├── Apply.tsx          # Apply form with resume upload + auto-fill
│       │   ├── Login.tsx          # Login page
│       │   ├── Register.tsx       # Register (jobseeker or employer)
│       │   ├── PostJob.tsx        # Employer job posting form
│       │   ├── Dashboard.tsx      # Employer & jobseeker dashboards
│       │   └── ResumeMatch.tsx    # Upload resume → find matching jobs
│       ├── components/
│       │   ├── Navbar.tsx         # Top navigation bar
│       │   ├── JobCard.tsx        # Job listing card component
│       │   ├── FormInput.tsx      # Reusable input with validation display
│       │   └── ResumeUpload.tsx   # Drag & drop resume upload component
│       ├── context/
│       │   └── AuthContext.tsx    # JWT auth state (login, register, logout)
│       ├── utils/
│       │   ├── api.ts             # Axios instance with JWT interceptor
│       │   └── validation.ts      # All form validation functions
│       └── types/
│           └── index.ts           # TypeScript interfaces (User, Job, Application)
└── server/                        # Express backend (port 5000)
    ├── server.js                  # Main Express app entry point
    ├── db.js                      # SQLite setup + seed data (8 sample jobs)
    ├── middleware/
    │   └── auth.js                # JWT verify middleware
    └── routes/
        ├── auth.js                # POST /register, POST /login, GET /me
        ├── jobs.js                # GET/POST/PUT/DELETE /jobs
        ├── applications.js        # POST /applications, GET /my, GET /job/:id
        └── resume.js              # POST /parse (auto-fill), POST /match (job match)
```

## Key Features
1. **Resume Auto-Fill** — Upload PDF on Apply page → backend parses it → form fields auto-filled
2. **Resume Job Matching** — Upload PDF on ResumeMatch page → scored against all jobs by skill overlap
3. **Job Match Score** — Calculated by comparing applicant skills vs job required skills (percentage)
4. **Role-based Auth** — Two roles: `jobseeker` and `employer` with different dashboards

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| GET | /api/jobs | List jobs (search, filter, paginate) |
| GET | /api/jobs/:id | Single job |
| POST | /api/jobs | Post job (employer only) |
| POST | /api/applications | Submit application (with resume file) |
| GET | /api/applications/my | Jobseeker's applications |
| GET | /api/applications/job/:id | Employer view applications |
| PATCH | /api/applications/:id/status | Update status (employer) |
| POST | /api/resume/parse | Parse PDF → extract info |
| POST | /api/resume/match | Find matching jobs from resume |

## Validation Rules
| Field | Rule |
|-------|------|
| Name | Letters + spaces only, 2–100 chars |
| Email | Valid email format |
| Phone | 10-digit Indian mobile (starts 6–9) |
| Pincode | Exactly 6 digits |
| Password | Min 8 chars, must have letter + number |
| Salary | Positive number |
| Experience | 0–60 years |

## Database Tables
- `users` — id, name, email, password, phone, pincode, city, state, role, company_name
- `jobs` — id, employer_id, title, company, location, job_type, category, experience_min/max, salary_min/max, description, requirements, skills, openings, is_active
- `applications` — id, job_id, applicant_id, full_name, email, phone, pincode, experience_years, skills, resume_path, status, match_score

## Application Status Flow
`pending` → `shortlisted` → `interviewed` → `hired` or `rejected`

## Demo Accounts
- Employer: `hr@techcorp.com` / `Admin@123`
- Employer: `recruit@infosys.com` / `Admin@123`

## How to Run
```bash
# Backend
cd server && npm install && node server.js   # http://localhost:5000

# Frontend
cd client && npm install && npm run dev      # http://localhost:5173
```

## Branding
- Project name: **Quality Council of India**
- Primary color: Blue (`blue-600` / `#2563eb`)
- Logo style: Text logo — "Quality Council" + "of India" in blue
