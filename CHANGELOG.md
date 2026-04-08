# Changelog

All notable changes to the **College ERP System** will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
adhering to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] — Security & Quality Hardening

### 🔴 Critical Security Fixes

- **BREAKING**: Removed `server/.env` from version control (was exposing `JWT_SECRET`, `JWT_REFRESH_SECRET`, DB credentials)
- **BREAKING**: Removed `node_modules/` directories from git tracking (client and server)
- **BREAKING**: Removed `database.sqlite` files from git history (contained production-like data)
- **BREAKING**: Removed `client/dist/` build artifacts from version control
- Fixed Socket.IO CORS accepting **all origins** (`callback(null, true)`) — now restricted to allowed origins
- Fixed registration endpoint issuing JWT tokens to **unapproved** users (tokens were generated before approval check)
- Fixed mass-assignment vulnerability in `Fee.create(req.body)` and `student.update(req.body)` — now uses allowlisted fields
- Added `express.json({ limit: '10kb' })` body size limit to prevent payload-based DoS

### 🟡 Security Improvements

- Added runtime validation for `JWT_SECRET` and `JWT_REFRESH_SECRET` on startup
- Applied `generalLimiter` rate limiting to **all** API routes (previously only `/api/auth` and `/api/students`)
- Added Socket.IO authentication middleware (was completely unauthenticated)
- Removed hardcoded demo credentials from `Login.jsx` UI (moved to `.env.example` docs only)
- Added `.DS_Store`, `*.sqlite`, `*.db`, `dist/`, `node_modules/` to `.gitignore`
- Fixed broken `validation.js` middleware (imports non-existent `sanitize` from `express-validator`)

### 🐛 Bug Fixes

- Fixed `ProtectedRoute` rendering empty `<div>` with only a spinner class during loading — now shows a proper full-page loading state
- Fixed `ProtectedRoute` silently redirecting unauthorized users to `/` with no feedback — now redirects to `/unauthorized` or shows toast
- Fixed fees route ordering: `/api/fees/my-fees`, `/api/fees/defaulters`, `/api/fees/stats` must be registered **before** `/:id` or they get swallowed by the param route
- Fixed `AuthContext` not validating stored JWT on app load — stale/expired tokens in localStorage keep user "authenticated" until next API call
- Fixed notification dropdown never closing when clicking outside
- Fixed `getPageTitle()` not matching nested paths like `/faculty/schedule`

### ⚡ Performance Optimizations

- Added server-side pagination to Students, Fees, Library, and Personnel endpoints
- Added debounced search inputs (300ms) across all list/table views
- Added `React.lazy()` code-splitting for all page components (22 pages)
- Memoized Recharts components in Dashboard with `React.memo`
- Added `Suspense` boundaries with skeleton loading fallbacks

### 🎨 UI/UX Improvements

#### Login
- Added password visibility toggle
- Added role-specific placeholder hints
- Added "session expired" message when redirected from 401

#### Dashboard
- Added "Last Updated" timestamps on all stat cards
- Added empty state illustrations when no data

#### Students
- Added skeleton table loader during fetch
- Added bulk action checkboxes with "Select All"
- Added student avatar with initials fallback

#### Attendance
- Added "Mark All Present" bulk action button
- Added attendance percentage color gradient (red < 75% < yellow < 90% < green)

#### Exams & Grades
- Added grade distribution histogram per exam
- Added audit trail UI for grade modifications

#### Fees & Payments
- Added color-coded status badges (Paid ✅ / Pending ⏳ / Overdue 🔴)
- Added payment receipt generation

#### Library
- Added visual availability bar (copies available / total)
- Added "Due Soon" warning badges

#### All Tabs
- Added proper error boundary with retry button
- Added empty state components for zero-data scenarios
- Added accessible `aria-label` attributes to all interactive elements
- Improved mobile sidebar overlay auto-close on route change

### 🧪 Testing

- Added `ProtectedRoute` unit test with role-based assertions
- Added auth middleware unit tests (valid token, expired token, missing token)
- Added API endpoint integration tests for Students CRUD
- Added security regression tests (rate limiting, CORS, CSRF)

### 📚 Documentation

- Created `IMPLEMENTATION_GUIDE.md` with all fixes, code snippets, and rationale
- Updated `README.md` with accurate setup instructions and architecture
- Created `.env.example` for both client and server
- Added deployment checklist and rollback procedures

### 🔧 Infrastructure

- Added `scripts/setup-security.sh` for first-time secure setup
- Added `.env.example` template files
- Configured proper `.gitignore` for all artifact types

---

## [1.0.0] — 2026-04-03 (Initial Release)

### Added
- Full-stack College ERP with React 18 + Vite frontend and Express.js backend
- 22 page modules: Dashboard, Students, Courses, Faculty, Attendance, Exams, Fees, Library, Users, Departments, Feedback, Register, Approvals, ExamAnalytics, Events, Personnel, StudentPerformance, HostelManagement, TransportManagement, FacultySchedule, InventoryManagement
- Role-based access control: Admin, Faculty, Student, Staff, Librarian
- JWT authentication with access/refresh token flow
- Sequelize ORM with SQLite (33 models, full associations)
- Socket.IO real-time dashboard update broadcasts
- Dark/light theme toggle with localStorage persistence
- Rate limiting on auth endpoints
- Helmet.js security headers
- Express-validator input validation
- Bcrypt password hashing (12 rounds)
- Recharts data visualization
- Lucide React icons

---

## Security Policy

### Supported Versions

| Version | Status |
|---------|--------|
| 1.x (Unreleased hardened) | ✅ Active development |
| 1.0.0 | ⚠️ Known vulnerabilities — upgrade immediately |

### Reporting Vulnerabilities

1. **Do NOT** open a public issue
2. Email the maintainer directly with reproduction steps
3. Allow 72 hours for initial response
4. Responsible disclosure will be credited
