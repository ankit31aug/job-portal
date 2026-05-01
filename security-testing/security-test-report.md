# QCI Job Portal — Security Test Report

**Date:** 2026-05-01  
**Tester:** Claude Code (automated)  
**Target:** QCI Job Portal — Express/PostgreSQL backend  
**Backend URL:** http://localhost:5000  
**Scope:** API security, authentication, authorization, injection, file upload, headers

---

## Executive Summary

| Category | Tests Run | Pass | Fail/Warn | Fixed |
|----------|-----------|------|-----------|-------|
| SQL Injection | 6 | 6 | 0 | — |
| JWT Security | 5 | 5 | 0 | — |
| Authorization / IDOR | 7 | 7 | 0 | — |
| XSS / Input Injection | 5 | 3 | 2 WARN | Noted |
| File Upload | 5 | 5 | 0 | — |
| Sensitive Data Exposure | 7 | 5 | 2 | 1 Fixed |
| Rate Limiting / Brute Force | 3 | 1 | 2 FAIL | 2 Fixed |
| Mass Assignment | 3 | 3 | 0 | — |
| CORS & Security Headers | 3 | 1 | 2 | 1 Fixed |
| Miscellaneous | 5 | 4 | 1 | — |

**Overall: 3 vulnerabilities fixed, 2 low-risk warnings remain.**

---

## Section 1 — SQL Injection

PostgreSQL parameterized queries (`$1`, `$2`) are used throughout. No interpolation found.

| Test | Payload | Result |
|------|---------|--------|
| 1.1 Login email | `admin@test.com' OR '1'='1` | PASS — rejected |
| 1.2 Login password | `' OR '1'='1'--` | PASS — rejected |
| 1.3 Job search | `' OR '1'='1` | PASS — 0 jobs returned |
| 1.3b | `'; DROP TABLE jobs;--` | PASS — 0 jobs returned |
| 1.3c | `1 UNION SELECT * FROM users--` | PASS — 0 jobs returned |
| 1.4 Job ID param | `1 OR 1=1` | PASS — server error (no data leak) |

**Verdict: PASS** — All SQL injection attempts blocked by parameterized queries.

---

## Section 2 — JWT Token Security

| Test | Result |
|------|--------|
| 2.1 Tampered payload (role → super_admin) | PASS — rejected (invalid signature) |
| 2.2 None algorithm attack (`alg:none`) | PASS — rejected |
| 2.3 Expired token | PASS — rejected |
| 2.4 Missing Bearer prefix | PASS — rejected |
| 2.5 Empty Authorization header | PASS — "No token provided" |

**Verdict: PASS** — `jsonwebtoken` library correctly validates all JWT properties.

---

## Section 3 — Authorization / IDOR

| Test | Result |
|------|--------|
| 3.1 Jobseeker → Super Admin endpoint | PASS — 403 |
| 3.2 Jobseeker → HR Admin endpoint | PASS — 403 |
| 3.3 Employer → Super Admin endpoint | PASS — 403 |
| 3.4 NABL edits NABH's job (IDOR) | PASS — "Job not found or unauthorized" |
| 3.5 NABL deletes NABH's job (IDOR) | PASS — "Job not found or unauthorized" |
| 3.6 NABL views NABH's applications (IDOR) | PASS — 404 |
| 3.7 Jobseeker sets own status to hired | PASS — 403 |

**Verdict: PASS** — Role-based and ownership-based access control is correctly enforced.

---

## Section 4 — XSS & Input Injection

| Test | Result | Notes |
|------|--------|-------|
| 4.1 Stored XSS in job title | WARN | `<script>alert(...)` stored raw in DB |
| 4.2 Stored XSS in description | WARN | `<img onerror=...>` stored raw |
| 4.3 SQL injection via search | PASS | Parameterized queries block it |
| 4.4 SQL injection via job ID | PASS | Rejected |
| 4.5 NoSQL prototype injection | PASS | Rejected |

**Verdict: LOW RISK** — Raw HTML is stored in DB but React escapes text content by default. No `dangerouslySetInnerHTML` usage found in the codebase. Risk exists only if a future developer adds unsafe rendering. **Recommendation:** Add server-side input sanitization (e.g., `DOMPurify` on server side for text fields in admin contexts).

---

## Section 5 — File Upload Security

| Test | Result |
|------|--------|
| 5.1 Upload .sh executable | PASS — rejected ("Only PDF and Word documents") |
| 5.2 Upload .js as PDF MIME | PASS — rejected (extension check wins over MIME) |
| 5.3 Path traversal (`../../server.js`) | PASS — multer sanitizes filename |
| 5.4 6 MB file (>5 MB limit) | PASS — "File too large" |
| 5.5 Uploaded files publicly accessible | INFO — accessible at `/uploads/...` (by design for resumes) |

**Verdict: PASS** — Upload security is solid. File extension validated, not just MIME type.

---

## Section 6 — Sensitive Data Exposure

| Test | Result |
|------|--------|
| 6.1 `/api/auth/me` exposes password hash | PASS — no password field |
| 6.2 Login response exposes password hash | PASS — no password field |
| 6.3 Superadmin `/users` exposes password | PASS — no password field |
| 6.4 Admin `/users` exposes password | PASS — no password field |
| 6.5 `X-Powered-By: Express` header | **FIXED** — removed by helmet |
| 6.6 Reset token in forgot-password response | PASS — generic message only |
| 6.7 Timing attack on forgot-password | **FIXED** — email sent fire-and-forget (3ms vs 3200ms before) |

---

## Section 7 — Rate Limiting & Brute Force

| Test | Before | After Fix |
|------|--------|-----------|
| 7.1 Login brute force (10+ attempts) | FAIL — no limit | **FIXED** — 10 attempts / 15 min |
| 7.2 OTP brute force (5+ attempts) | FAIL — no limit | **FIXED** — 5 attempts / 10 min |
| 7.3 Password reset token reuse | PASS — token marked `used=1` | — |

---

## Section 8 — Mass Assignment / Privilege Escalation

| Test | Result |
|------|--------|
| 8.1 Register with `role=super_admin` | PASS — "Role must be jobseeker or employer" |
| 8.2 Register with `role=hr` | PASS — blocked at validation |
| 8.3 Update profile to set `role=super_admin` | PASS — role field ignored in PUT /profile |

---

## Section 9 — CORS & Security Headers

| Test | Before | After Fix |
|------|--------|-----------|
| 9.1 CORS from unauthorized origin | PASS — no Allow-Origin header | — |
| 9.2 Security headers | Missing X-Frame-Options, X-Content-Type-Options | **FIXED** by helmet |
| 9.3 X-Powered-By disclosure | Present | **FIXED** by helmet |

**Headers now set by helmet:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-DNS-Prefetch-Control: off`
- `X-Powered-By` removed

**Still missing (production concern only):**
- `Strict-Transport-Security` (HSTS) — add via reverse proxy on HTTPS
- `Content-Security-Policy` — manage via CDN/build for frontend

---

## Section 10 — Miscellaneous

| Test | Result |
|------|--------|
| 10.1 JWT secret length (37 chars) | PASS — sufficient (recommend 64+ in production) |
| 10.2 Bcrypt cost factor | PASS — factor 12 (strong) |
| 10.3 Unauthenticated admin access | PASS — all return 401 |
| 10.4 Passwords logged in console | PASS — not found in logs |
| 10.5 HTTP method override | PASS — not supported |

---

## Fixes Applied

### Fix 1 — Rate Limiting (HIGH)
**File:** `server/app.js`  
**Change:** Added `express-rate-limit` middleware:
- Login: 10 attempts / 15 minutes
- OTP verify: 5 attempts / 10 minutes  
- Forgot password: 5 requests / 1 hour
- All limiters skipped in `NODE_ENV=test`

### Fix 2 — Security Headers (MEDIUM)
**File:** `server/app.js`  
**Change:** Added `helmet` middleware. Removes `X-Powered-By`, sets `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, and other secure defaults.

### Fix 3 — Forgot Password Timing Attack (MEDIUM)
**File:** `server/routes/auth.js`  
**Change:** `sendMail()` call changed from `await` to fire-and-forget (`.catch(() => {})`). Response time for valid vs invalid email is now ~3ms vs 3200ms previously — eliminates email enumeration via timing.

---

## Remaining Warnings

| # | Issue | Severity | Recommendation |
|---|-------|----------|----------------|
| W1 | Raw HTML stored in job text fields | Low | Add DOMPurify on server for admin-entered content |
| W2 | HSTS / CSP headers missing | Low | Set via Nginx/Railway reverse proxy on production HTTPS |
| W3 | JWT secret is 37 chars | Info | Use 64+ random chars in production `.env` |
