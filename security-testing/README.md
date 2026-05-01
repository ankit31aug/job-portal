# QCI Job Portal — Security Testing

This folder contains all security testing artifacts for the QCI Job Portal.

## Contents

| File | Description |
|------|-------------|
| `security-test-report.md` | Full security test report — all 50 test cases across 10 categories |
| `superadmin-test-report.md` | Super admin E2E test report — all 47 tests, bugs found and fixed |

## Automated Tests

The Jest test files are in `server/tests/`:

| File | Tests | Coverage |
|------|-------|----------|
| `auth.test.js` | 15 | Registration, login, /me endpoint |
| `jobs.test.js` | 15 | Job CRUD, employer/jobseeker access |
| `applications.test.js` | 16 | Application submit, status updates, access control |
| `superadmin.test.js` | 47 | All super admin API endpoints |

**Total: 93 automated tests — all passing.**

```bash
cd server
npm test                                    # run all 4 suites
npm test -- tests/superadmin.test.js       # super admin only
```

## Security Issues Found & Fixed

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | No rate limiting on login endpoint | High | FIXED |
| 2 | No rate limiting on OTP verification | High | FIXED |
| 3 | Timing attack on forgot-password (3.2s gap) | Medium | FIXED |
| 4 | X-Powered-By header leaks Express version | Medium | FIXED |
| 5 | Missing X-Frame-Options, X-Content-Type-Options | Medium | FIXED |
| 6 | Superadmin PUT /jobs required all fields (partial update crashed) | Medium | FIXED |
| 7 | Delete user failed with FK constraint when user had data | Medium | FIXED |
| 8 | Wrong default password shown on super admin login page | Low (UX) | FIXED |

## What Passed (No Changes Needed)

- SQL injection via all inputs (parameterized queries throughout)
- JWT tampering, alg:none, expired tokens
- IDOR between employers
- Role escalation via registration or profile update
- Password hash never exposed in any API response
- File upload: type validation, size limits, path traversal
- Mass assignment protection
- CORS correctly restricts unauthorized origins
- Bcrypt cost factor 12 (strong)
