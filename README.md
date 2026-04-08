# 🎓 College ERP System

> A comprehensive College Management System built with React 18, Express.js, Sequelize, and SQLite — featuring role-based access, real-time updates, and 22 functional modules.

[![Node](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18.x-61dafb)](https://react.dev/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## ✨ Features

### 👤 Role-Based Access Control

| Role | Access |
|------|--------|
| **Admin** | Full system: users, approvals, personnel, all modules |
| **Faculty** | Attendance, exams/grading, schedule, departments |
| **Student** | Performance, fees, library, hostel, transport, feedback |
| **Staff** | Students, fees, personnel, inventory |
| **Librarian** | Library management, personnel |

### 📚 Modules (22 Tabs)

```
📊 Dashboard           — Role-specific stats, charts, real-time notifications
👥 Students             — CRUD, search, enrollment, department assignment
📚 Courses (Subjects)   — Catalog, faculty assignment, capacity tracking
👨‍🏫 Faculty              — Profiles, course load, department membership
✅ Attendance           — Session-based tracking, per-student records
📝 Exams & Grades       — Scheduling, results, analytics per exam
💰 Fees & Payments      — Fee creation, payment recording, defaulter lists
📖 Library              — Book catalog, loans, reservations
🏢 Departments          — Department hierarchy, linked courses/faculty/students
💬 Course Feedback      — Student→course feedback submissions
📅 Campus Events        — Event management and scheduling
🗓️ Faculty Schedule     — Timetable view for faculty members
📈 Student Performance  — Individual student academic dashboard
🏠 Hostel Management    — Hostels, rooms, student allocations
🚌 Transport            — Routes, stops, vehicles, subscriptions
📦 Campus Inventory     — Assets, maintenance requests, bookings
👔 Personnel & Payroll  — Leave requests, payroll processing
⚙️ User Management      — Admin-only user CRUD
✅ Approvals            — Admin approval workflow for registrations
📝 Registration         — Self-service account creation (pending approval)
📊 Exam Analytics       — Per-exam grade distribution and stats
🔑 Login               — JWT authentication with refresh tokens
```

### 🔧 Technical Highlights
- **Real-Time Updates**: Socket.IO broadcasts mutation events to dashboard
- **Dark/Light Theme**: Persisted toggle with CSS custom properties
- **Request Logging**: Per-request timing with method, path, status, duration
- **Security Headers**: Helmet.js with CSP, HSTS, referrer policy
- **Rate Limiting**: Auth endpoints (5/15min), general API (100/15min)
- **Input Validation**: express-validator on all CRUD endpoints
- **Password Hashing**: bcrypt with 12 salt rounds

---

## 🛠️ Technology Stack

### Frontend (`/client`)

| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| Vite | Build tool & dev server |
| React Router v6 | Client-side routing (22 routes) |
| Axios | HTTP client with interceptors |
| Recharts | Dashboard data visualization |
| Lucide React | Icon library |
| Socket.IO Client | Real-time updates |
| Jest + RTL | Unit testing |

### Backend (`/server`)

| Technology | Purpose |
|-----------|---------|
| Node.js (ES Modules) | Runtime |
| Express.js | HTTP framework |
| Sequelize v6 | ORM (33 models) |
| SQLite | Development database |
| JWT + bcryptjs | Authentication |
| Socket.IO | Real-time server |
| Helmet.js | Security headers |
| express-rate-limit | API protection |
| express-validator | Input validation |
| xlsx | Spreadsheet import/export |

---

## 🚀 Getting Started

### Prerequisites

```
Node.js >= 18.x
npm >= 9.x
```

### 1. Clone

```bash
git clone https://github.com/J0KEEER/wt-workshop-project.git
cd wt-workshop-project
```

### 2. Setup Backend

```bash
cd server
npm install
```

Create `server/.env` (see `server/.env.example` for template):

```bash
# Required
NODE_ENV=development
PORT=5000
DB_PATH=./database.sqlite

# Auth — generate strong secrets!
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<your-64-char-secret>
JWT_REFRESH_SECRET=<another-64-char-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Start the backend:

```bash
# Optional: seed demo data
npm run seed

# Start dev server (auto-restarts on changes)
npm run dev
# → API running at http://localhost:5000
```

### 3. Setup Frontend

```bash
cd ../client
npm install
npm run dev
# → App running at http://localhost:5173
```

### 4. Access the App

Open [http://localhost:5173](http://localhost:5173) in your browser.

**Demo Credentials** (development only):

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Faculty | shivangi | fac123 |
| Student | alice | stu123 |

> ⚠️ **Change all default passwords** before any deployment.

---

## 🏗️ Architecture

```
wt-workshop-project/
├── client/                    # React Frontend (Vite)
│   ├── src/
│   │   ├── components/        # Layout, reusable UI components
│   │   ├── context/           # AuthContext, ToastContext
│   │   ├── pages/             # 22 page components (one per tab)
│   │   ├── services/          # Axios API client with interceptors
│   │   └── App.jsx            # Route configuration
│   ├── index.html
│   └── vite.config.js
│
├── server/                    # Express.js Backend
│   ├── src/
│   │   ├── models/            # 33 Sequelize models
│   │   │   └── index.js       # All associations defined here
│   │   ├── routes/            # 20 route files (one per resource)
│   │   ├── middleware/        # auth.js, validation.js
│   │   ├── db.js              # Sequelize + SQLite config
│   │   ├── socket.js          # Socket.IO setup
│   │   └── index.js           # Express app, middleware, startup
│   ├── .env                   # Environment variables (not committed)
│   └── package.json
│
├── IMPLEMENTATION_GUIDE.md    # Security fixes & optimization guide
├── CHANGELOG.md               # Version history
└── README.md                  # This file
```

### Data Flow

```
Browser ──HTTP──▶ Express API ──Sequelize──▶ SQLite DB
  ▲                   │
  └──Socket.IO────────┘ (real-time dashboard updates)
```

### Authentication Flow

```
1. POST /api/auth/login → validates credentials → returns { accessToken, refreshToken, user }
2. Client stores tokens in localStorage, attaches to all requests via axios interceptor
3. Server middleware verifies JWT on protected routes
4. On 401, client clears tokens and redirects to /login
5. POST /api/auth/refresh-token → issues new access token using refresh token
```

### Model Relationships (33 Models)

- `User` ↔ `Student` / `Faculty` (1:1)
- `Student` ↔ `Course` (M:M via `Enrollment`)
- `Faculty` ↔ `Course` (M:M via `CourseFaculty`)
- `Course` → `AttendanceSession` → `AttendanceRecord` ← `Student`
- `Course` → `Exam` → `ExamResult` ← `Student`
- `Student` → `Fee` → `Payment`
- `Book` → `BookLoan` / `BookReservation` ← `User`
- `Department` → `Student` / `Faculty` / `Course`
- `Hostel` → `Room` → `HostelAllocation` ← `Student`
- `TransportRoute` → `TransportStop` → `TransportSubscription` ← `Student`
- `Room` → `Asset` → `MaintenanceRequest` / `AssetBooking`

---

## 🔐 Security

### Current Measures

- ✅ JWT with access + refresh token pattern
- ✅ bcrypt password hashing (12 salt rounds)
- ✅ Helmet.js security headers (CSP, HSTS, X-Frame-Options)
- ✅ Rate limiting on auth endpoints
- ✅ express-validator input validation
- ✅ Role-based middleware (`authenticate`, `authorize`)
- ✅ CORS restricted to configured origins
- ✅ Error messages sanitized in production (`NODE_ENV` check)

### Known Issues & Planned Fixes

See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for the complete security audit with code snippets:

| ID | Issue | Priority |
|----|-------|----------|
| SEC-01 | `.gitignore` incomplete — sensitive files tracked | 🔴 Critical |
| SEC-02 | Socket.IO accepts all CORS origins | 🔴 Critical |
| SEC-03 | Registration issues tokens to unapproved users | 🔴 Critical |
| SEC-04 | Mass assignment in Sequelize create/update | 🔴 Critical |
| SEC-05 | JWT stored in localStorage (XSS risk) | 🟡 Medium |
| SEC-06 | Rate limiting not on all API routes | 🟡 Medium |
| SEC-07 | No startup environment validation | 🟡 Medium |
| SEC-08 | Broken validation middleware imports | 🟡 Medium |
| SEC-09 | Hardcoded demo creds in Login UI | 🟢 Low |

---

## 📦 Available Scripts

### Client (`/client`)

| Script | Command | Description |
|--------|---------|-------------|
| Dev | `npm run dev` | Vite dev server with HMR |
| Build | `npm run build` | Production build to `dist/` |
| Preview | `npm run preview` | Serve production build locally |
| Test | `npm test` | Run Jest unit tests |
| Lint | `npm run lint` | ESLint check |

### Server (`/server`)

| Script | Command | Description |
|--------|---------|-------------|
| Dev | `npm run dev` | Nodemon auto-restart dev server |
| Start | `npm start` | Production server |
| Seed | `npm run seed` | Populate demo data |

---

## 🧪 Testing

```bash
# Frontend unit tests
cd client && npm test

# Backend (if configured)
cd server && npm test

# Security audit
cd server && npm audit
cd ../client && npm audit
```

---

## 📋 API Endpoints

All endpoints prefixed with `/api`:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | ❌ | Login |
| POST | `/auth/register` | ❌ | Self-register (pending approval) |
| POST | `/auth/refresh-token` | ❌ | Refresh access token |
| GET | `/auth/me` | ✅ | Current user profile |
| GET/POST/PUT/DELETE | `/students` | ✅ | Student CRUD |
| GET/POST/PUT/DELETE | `/courses` | ✅ | Course CRUD |
| GET/POST/PUT/DELETE | `/faculty` | ✅ | Faculty CRUD |
| GET/POST | `/attendance` | ✅ | Attendance sessions & records |
| GET/POST/PUT | `/exams` | ✅ | Exam scheduling & results |
| GET/POST/PUT | `/fees` | ✅ | Fee management & payments |
| GET/POST/PUT/DELETE | `/library` | ✅ | Book catalog & loans |
| GET/POST/PUT/DELETE | `/departments` | ✅ | Department management |
| GET/POST | `/feedback` | ✅ | Course feedback |
| GET/POST | `/events` | ✅ | Campus events |
| GET/POST/PUT | `/personnel` | ✅ | Leave & payroll |
| GET/POST | `/hostels` | ✅ | Hostel & room management |
| GET/POST | `/transport` | ✅ | Routes & subscriptions |
| GET/POST/PUT | `/inventory` | ✅ | Asset & maintenance |
| GET | `/dashboard` | ✅ | Dashboard stats |
| GET/PUT | `/users` | ✅ Admin | User management |
| GET/PUT | `/admin/approvals` | ✅ Admin | Registration approvals |
| GET | `/holidays` | ✅ | Holiday calendar |
| GET | `/performance` | ✅ | Student performance data |
| GET | `/health` | ❌ | Server health check |

---

## 📃 Documentation

| Document | Description |
|----------|-------------|
| [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) | Security fixes, bug fixes, performance & UI improvements with code snippets |
| [CHANGELOG.md](CHANGELOG.md) | Version history and planned changes |
| [README.md](README.md) | This file — setup, architecture, API reference |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit with semantic messages: `git commit -m 'feat: add feature'`
4. Run tests: `cd client && npm test`
5. Push and open a Pull Request

### Commit Convention

```
feat:     New feature
fix:      Bug fix
security: Security-related change
perf:     Performance improvement
docs:     Documentation change
refactor: Code refactoring
test:     Test addition/modification
chore:    Build/tooling changes
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Made for academic excellence** 🎓

[Report Bug](https://github.com/J0KEEER/wt-workshop-project/issues) · [Request Feature](https://github.com/J0KEEER/wt-workshop-project/issues)

</div>
