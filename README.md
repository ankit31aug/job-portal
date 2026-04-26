# JobPortal - Full Stack Job Portal Application

A complete job portal built with React + Node.js + SQLite featuring resume upload, auto-fill, job matching, and full validation.

## Features
- **Job Listings** — Search, filter by category/type/location/experience
- **Job Details** — Full description, requirements, skills, apply button
- **Apply with Resume** — Upload PDF resume → auto-fills the entire application form
- **Resume Job Matching** — Upload resume to find best-matching jobs by skill score
- **Employer Dashboard** — Post jobs, view applications, update applicant status
- **Jobseeker Dashboard** — Track all applications and their statuses
- **Full Validations** — Name, email, phone (10-digit Indian), pincode (6-digit), password, salary
- **JWT Auth** — Secure login/register for both jobseekers and employers

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6
- **Backend**: Node.js, Express, better-sqlite3, JWT, bcryptjs, Multer, pdf-parse

## Quick Start

### 1. Start the Backend
```bash
cd server
npm install
npm run dev    # runs on http://localhost:5000
```

### 2. Start the Frontend
```bash
cd client
npm install
npm run dev    # runs on http://localhost:5173
```

Open http://localhost:5173

## Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Employer | hr@techcorp.com | Admin@123 |
| Employer | recruit@infosys.com | Admin@123 |

Or register a new account as either a jobseeker or employer.

## Validation Rules
| Field | Rule |
|-------|------|
| Name | Letters & spaces only, 2–100 chars |
| Email | Valid format (x@x.x) |
| Phone | 10-digit Indian mobile (starts with 6-9) |
| Pincode | 6-digit numeric |
| Password | Min 8 chars, must have letter + number |
| Salary | Positive number |
| Experience | 0–60 years |

## API Endpoints
- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login
- `GET /api/jobs` — List jobs (supports search, filter, pagination)
- `POST /api/jobs` — Post a job (employer)
- `POST /api/applications` — Apply for a job (with resume upload)
- `POST /api/resume/parse` — Parse PDF resume → extract name/email/phone/pincode/skills
- `POST /api/resume/match` — Find matching jobs from resume
