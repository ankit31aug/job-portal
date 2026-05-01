# QCI Job Portal — Super Admin E2E Test Report

**Date:** 2026-05-01  
**Tester:** Claude Code (automated)  
**Credentials:** superadmin@qci.org / Admin@123  
**Test file:** `server/tests/superadmin.test.js`  
**Total tests:** 47 | **All passing**

---

## Summary

| Section | Tests | Pass | Fail | Bugs Found |
|---------|-------|------|------|-----------|
| Access Control | 4 | 4 | 0 | — |
| Dashboard Stats | 2 | 2 | 0 | — |
| HR Role Management | 6 | 6 | 0 | — |
| User Management | 9 | 9 | 0 | BUG-02 (fixed) |
| Gallery Management | 6 | 6 | 0 | — |
| Board Configuration | 4 | 4 | 0 | — |
| Settings Management | 3 | 3 | 0 | — |
| Job Management | 8 | 8 | 0 | BUG-01 (fixed) |

---

## API Endpoints Tested

### Authentication & Access Control

| Endpoint | Method | Expected | Actual | Result |
|----------|--------|----------|--------|--------|
| /api/superadmin/stats | GET (no token) | 401 | 401 | PASS |
| /api/superadmin/stats | GET (HR token) | 403 | 403 | PASS |
| /api/superadmin/stats | GET (employer token) | 403 | 403 | PASS |
| /api/superadmin/stats | GET (super admin token) | 200 | 200 | PASS |

### Dashboard Stats — GET /api/superadmin/stats

Returns: `totalUsers`, `totalJobs`, `totalApplications`, `hired`, `hrRoles`, `galleryItems`

| Test | Result |
|------|--------|
| All 6 stat fields present | PASS |
| All values are non-negative integers | PASS |

### HR Role Management

| Endpoint | Method | Test | Result |
|----------|--------|------|--------|
| /api/superadmin/hr-roles | GET | Lists roles with parsed permissions array | PASS |
| /api/superadmin/hr-roles | POST | Creates role with name + permissions | PASS |
| /api/superadmin/hr-roles | POST | Rejects missing name (400) | PASS |
| /api/superadmin/hr-roles/:id | PUT | Updates name and permissions | PASS |
| /api/superadmin/hr-roles/:id | PUT | Returns 404 for non-existent ID | PASS |
| /api/superadmin/hr-roles/:id | DELETE | Deletes role, nulls hr_role_id in users | PASS |

**Available permissions:** `manage_jobs`, `view_applications`, `update_application_status`, `manage_users`, `manage_settings`, `manage_gallery`

### User Management

| Endpoint | Method | Test | Result |
|----------|--------|------|--------|
| /api/superadmin/users | GET | Pagination (page, limit, total, pages) | PASS |
| /api/superadmin/users?role=hr | GET | Role filter | PASS |
| /api/superadmin/users?search=admin | GET | Name/email search | PASS |
| /api/superadmin/users/create-hr | POST | Creates HR user (role='hr', is_verified=1) | PASS |
| /api/superadmin/users/create-hr | POST | Rejects duplicate email (409) | PASS |
| /api/superadmin/users/create-hr | POST | Rejects missing name/email/password (400) | PASS |
| /api/superadmin/users/:id/role | PUT | Changes user role | PASS |
| /api/superadmin/users/:id/role | PUT | Rejects invalid role value (400) | PASS |
| /api/superadmin/users/:id/password | PUT | Changes user password | PASS |
| /api/superadmin/users/:id/password | PUT | Rejects password < 6 chars (400) | PASS |
| /api/superadmin/users/:id | DELETE | Blocks deleting super_admin (403) | PASS |
| /api/superadmin/users/:id | DELETE | Returns 404 for non-existent user | PASS |
| /api/superadmin/users/:id | DELETE | Deletes user + FK data (job_alerts, bookmarks, applications) | PASS |

### Gallery Management

| Endpoint | Method | Test | Result |
|----------|--------|------|--------|
| /api/superadmin/gallery | GET | Lists all gallery items (ordered) | PASS |
| /api/superadmin/gallery | POST | Creates item without image | PASS |
| /api/superadmin/gallery | POST | Rejects missing title (400) | PASS |
| /api/superadmin/gallery/:id | PUT | Updates title, is_active | PASS |
| /api/superadmin/gallery/reorder/batch | PUT | Batch reorder by display_order | PASS |
| /api/superadmin/gallery/:id | PUT | Returns 404 for non-existent item | PASS |
| /api/superadmin/gallery/:id | DELETE | Deletes item | PASS |

**Image upload:** Accepts JPEG/PNG/GIF up to 5 MB. Stored at `/uploads/gallery/`.

### Board Configuration

| Endpoint | Method | Test | Result |
|----------|--------|------|--------|
| /api/superadmin/boards | GET | Lists 8 boards ordered by display_order | PASS |
| /api/superadmin/boards/:id | PUT | Updates description, is_active, color | PASS |
| /api/superadmin/boards/reorder/batch | PUT | Batch reorder | PASS |
| /api/superadmin/boards/:id | PUT | Returns 404 for non-existent board | PASS |

**Boards in DB:** NABCB, NABH, NABL, NABET, NBQP, NDIE, PADD, PPID

### Settings Management

| Endpoint | Method | Test | Result |
|----------|--------|------|--------|
| /api/superadmin/settings | GET | Returns array of `{key, value, label, category}` | PASS |
| /api/superadmin/settings | PUT | Upserts one or many settings | PASS |
| Persistence | — | Saved setting is retrievable in next GET | PASS |

### Job Management (Full Control)

| Endpoint | Method | Test | Result |
|----------|--------|------|--------|
| /api/superadmin/jobs | GET | Pagination + total | PASS |
| /api/superadmin/jobs?department=NABH | GET | Department filter | PASS |
| /api/superadmin/jobs?search=engineer | GET | Title/company search | PASS |
| /api/superadmin/jobs | POST | Creates job | PASS |
| /api/superadmin/jobs | POST | Rejects missing required fields (400) | PASS |
| /api/superadmin/jobs/:id | PUT | **Partial update** (only title) preserves other fields | PASS |
| /api/superadmin/jobs/:id | PUT | Returns 404 for non-existent job | PASS |
| /api/superadmin/jobs/:id | DELETE | Deactivates job (sets is_active=0) | PASS |

---

## Bugs Found & Fixed

### BUG-01 — PUT /api/superadmin/jobs/:id required ALL fields (FIXED)

**Severity:** Medium  
**File:** `server/routes/superadmin.js`  
**Root cause:** UPDATE query used raw destructured values without `?? job.fieldName` fallbacks. Partial updates (e.g., only changing title) caused PostgreSQL NOT NULL constraint violations on `company`, `location`, etc.  
**Fix:** All fields now use `fieldFromBody ?? job.fieldFromDB` so partial patches work correctly.

### BUG-02 — DELETE /api/superadmin/users/:id failed for users with FK data (FIXED)

**Severity:** Medium  
**File:** `server/routes/superadmin.js`  
**Root cause:** Delete handler only cleared `bookmarks` before deleting the user. Users with `job_alerts`, `applications`, or `application_status_history` records caused a PostgreSQL FK constraint error.  
**Fix:** Cascade-delete in correct order: `job_alerts` → `bookmarks` → `application_status_history` → `applications` → `users`.

### BUG-03 — Wrong default password shown on login page (FIXED)

**Severity:** Low (UX bug)  
**File:** `client/src/pages/SuperAdminLogin.tsx`  
**Root cause:** Displayed hint "superadmin@qci.org / SuperAdmin@123" but actual password is "Admin@123".  
**Fix:** Updated displayed hint to show correct password.

---

## Frontend Super Admin Dashboard

**File:** `client/src/pages/SuperAdminDashboard.tsx` (770 lines)

The dashboard has 7 tabs:

| Tab | Functionality |
|-----|--------------|
| Dashboard | Stats tiles: total users, jobs, applications, hired, HR roles, gallery items |
| Jobs | Paginated list with search, create/edit/deactivate |
| Users | Paginated list with role filter and search, create HR user, change password |
| HR Roles | Create/edit/delete roles with granular permission checkboxes |
| Gallery | Upload images, set display order, toggle active/inactive, drag reorder |
| Boards | Edit board descriptions, images, colors, toggle visibility |
| Settings | Edit all site branding settings (name, tagline, colors, footer, social links) |

**Login route:** `/superadmin-login`  
**Dashboard route:** `/superadmin`  
**Auth guard:** Redirects to `/superadmin-login` if `user.role !== 'super_admin'`

---

## How to Run Super Admin Tests

```bash
cd Job-Portal/server
npm test -- tests/superadmin.test.js
```

**Prerequisites:**
- PostgreSQL running: `postgresql://localhost:5432/qci_portal`
- Super admin user exists: `superadmin@qci.org` / `Admin@123`
- HR admin user exists: `hr-admin@qci.org` / `Admin@123`
- Employer user exists: `nabh@qci.org` / `Admin@123`

Tests clean up all data they create (HR roles, users, gallery items, jobs) in `afterAll`.
