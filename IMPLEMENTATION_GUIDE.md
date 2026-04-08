# 🛠️ Implementation Guide — Bug Fixes, Security Hardening & UI/UX Improvements

> **Project**: wt-workshop-project (College ERP System)  
> **Date**: 2026-04-09  
> **Scope**: 22 frontend tabs, 20 API route files, 33 Sequelize models  
> **Priority**: 🔴 Critical → 🟡 Medium → 🟢 Low

---

## Table of Contents

1. [🔴 Critical Security Fixes](#-critical-security-fixes)
2. [🐛 Bug Fixes](#-bug-fixes)
3. [⚡ Performance Optimizations](#-performance-optimizations)
4. [🎨 UI/UX Improvements by Tab](#-uiux-improvements-by-tab)
5. [🧪 Testing](#-testing)
6. [📦 Deployment Checklist](#-deployment-checklist)

---

## 🔴 Critical Security Fixes

### SEC-01: `.gitignore` Is Incomplete — Sensitive Files Committed

**Problem**: `database.sqlite`, `.DS_Store`, `node_modules/`, `client/dist/`, and `server/.env` are tracked in git.  
**File**: `/.gitignore`

```diff
- node_modules/
- .env
- mcp.json
- mcp_config.json
- .agents/
+ # Dependencies
+ node_modules/
+
+ # Environment (CRITICAL — never commit secrets)
+ .env
+ .env.local
+ .env.production
+
+ # Database files
+ *.sqlite
+ *.sqlite3
+ *.db
+ database.sqlite
+ server/database.sqlite
+ server/college.db
+
+ # Build artifacts
+ client/dist/
+ dist/
+
+ # OS files
+ .DS_Store
+ Thumbs.db
+ *.log
+
+ # IDE / Tool configs
+ .agents/
+ mcp.json
+ mcp_config.json
+ .code-review-graph/
+ .planning/
+ G0DM0D3/
```

**After updating `.gitignore`, remove tracked files**:
```bash
# Remove from git index only (keeps local files)
git rm --cached -r server/node_modules/ client/node_modules/
git rm --cached -r client/dist/
git rm --cached database.sqlite server/database.sqlite server/college.db
git rm --cached .DS_Store client/.DS_Store
git rm --cached server/.env
git commit -m "chore: remove sensitive/generated files from tracking"
```

---

### SEC-02: Socket.IO CORS Accepts ALL Origins

**Problem**: `server/src/socket.js` line 8 accepts every origin.  
**Risk**: Any malicious site can open a WebSocket to your server and receive real-time data.

**File**: `server/src/socket.js`

```diff
+ import dotenv from 'dotenv';
+ dotenv.config();
+
+ const ALLOWED_ORIGINS = [
+     'http://localhost:5173',
+     'http://127.0.0.1:5173',
+     ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
+ ];
+
  export function initSocket(httpServer) {
      io = new Server(httpServer, {
          cors: {
-             origin: (origin, callback) => callback(null, true),
+             origin: (origin, callback) => {
+                 if (!origin || ALLOWED_ORIGINS.includes(origin)) {
+                     callback(null, true);
+                 } else {
+                     callback(new Error('WebSocket origin not allowed'));
+                 }
+             },
              credentials: true,
          },
          pingTimeout: 60000,
          pingInterval: 25000,
      });

+     // Authenticate WebSocket connections
+     io.use((socket, next) => {
+         const token = socket.handshake.auth?.token;
+         if (!token) {
+             return next(new Error('Authentication required'));
+         }
+         try {
+             const decoded = jwt.verify(token, process.env.JWT_SECRET);
+             socket.user = decoded;
+             next();
+         } catch {
+             next(new Error('Invalid token'));
+         }
+     });

      io.on('connection', (socket) => {
-         console.log(`🔌 Client connected: ${socket.id}`);
+         console.log(`🔌 Client connected: ${socket.id} (${socket.user?.username})`);
          socket.on('disconnect', () => {
              console.log(`🔌 Client disconnected: ${socket.id}`);
          });
      });

      return io;
  }
```

**Frontend update** — `client/src/components/Layout.jsx` line 65:

```diff
  useEffect(() => {
+     const token = localStorage.getItem('erp_token');
      const socket = io(import.meta.env.VITE_API_URL || window.location.origin, {
          transports: ['websocket'],
          reconnectionAttempts: 5,
          timeout: 3000,
+         auth: { token },
      });
```

---

### SEC-03: Registration Issues Tokens to Unapproved Users

**Problem**: `server/src/routes/auth.js` line 215-219 creates user with `isApproved: false` but then immediately generates and returns JWT tokens. An unapproved user receives a valid access token.

**File**: `server/src/routes/auth.js`

```diff
      const user = await User.create({
          username: data.username,
          email: data.email,
          passwordHash: data.password,
          firstName: data.firstName,
          lastName: data.lastName || null,
          role: data.role,
          isApproved: false,
      });

-     const tokens = generateTokens(user);
-     res.status(201).json({ user: user.toJSON(), ...tokens });
+     // Do NOT issue tokens — user must wait for admin approval
+     res.status(201).json({
+         message: 'Registration successful. Your account is pending admin approval.',
+         user: user.toJSON(),
+     });
  } catch (err) {
```

---

### SEC-04: Mass Assignment Vulnerabilities

**Problem**: Several routes pass `req.body` directly to Sequelize `create()` / `update()`, allowing attackers to set any field (e.g., `role`, `isApproved`, `isActive`).

**File**: `server/src/routes/fees.js` (line 95) and `server/src/routes/students.js` (line 79, 108)

```javascript
// ❌ BEFORE — server/src/routes/fees.js line 95
const fee = await Fee.create(req.body);

// ✅ AFTER — allowlist specific fields
const { studentId, amount, dueDate, type, status, description } = req.body;
const fee = await Fee.create({ studentId, amount, dueDate, type, status, description });
```

```javascript
// ❌ BEFORE — server/src/routes/students.js line 79
const student = await Student.create(req.body);

// ✅ AFTER
const { name, rollNo, email, phone, department, semester, status, departmentId } = req.body;
const student = await Student.create({
    name, rollNo, email, phone, department, semester, status, departmentId
});
```

```javascript
// ❌ BEFORE — server/src/routes/students.js line 108
await student.update(req.body);

// ✅ AFTER
const allowedFields = ['name', 'email', 'phone', 'department', 'semester', 'status', 'departmentId'];
const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
);
await student.update(updates);
```

**Apply this pattern to ALL routes**: `fees.js:121`, `courses.js`, `faculty.js`, `events.js`, `hostels.js`, `inventory.js`, `transport.js`, `personnel.js`.

---

### SEC-05: JWT Storage in localStorage

**Problem**: `client/src/context/AuthContext.jsx` stores tokens in `localStorage`, which is accessible to any XSS payload.

**Current** (AuthContext.jsx line 24-26):
```javascript
localStorage.setItem('erp_token', accessToken);
localStorage.setItem('erp_refresh_token', refreshToken);
localStorage.setItem('erp_user', JSON.stringify(userData));
```

**Recommended fix**: Use HTTP-only cookies set by the server. This requires backend changes:

```javascript
// server/src/routes/auth.js — in the login handler, replace token JSON response
// ❌ BEFORE
res.json({ user: user.toJSON(), ...tokens });

// ✅ AFTER — set HTTP-only cookies
res.cookie('accessToken', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 min
});
res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth/refresh-token', // Only sent to refresh endpoint
});
res.json({ user: user.toJSON() });
```

Then update `server/src/middleware/auth.js` to read from cookies:
```javascript
export function authenticate(req, res, next) {
    // Try cookie first, then Authorization header (for backward compat)
    const token = req.cookies?.accessToken
        || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    // ... rest unchanged
}
```

> **Note**: Add `cookie-parser` middleware: `npm install cookie-parser` and `app.use(cookieParser())` in `server/src/index.js`.

---

### SEC-06: Missing Rate Limiting on Most Routes

**Problem**: `server/src/index.js` only applies rate limiting to `/api/auth` (line 139) and `/api/students` (line 140). The other 17 route groups have **no rate limiting**.

```diff
  // server/src/index.js — Apply generalLimiter to ALL routes
  app.use('/api/auth', authLimiter, authRoutes);
- app.use('/api/students', generalLimiter, studentRoutes);
- app.use('/api/courses', courseRoutes);
- app.use('/api/attendance', attendanceRoutes);
- app.use('/api/exams', examRoutes);
- app.use('/api/fees', feeRoutes);
- app.use('/api/library', libraryRoutes);
+ app.use('/api/students', generalLimiter, studentRoutes);
+ app.use('/api/courses', generalLimiter, courseRoutes);
+ app.use('/api/attendance', generalLimiter, attendanceRoutes);
+ app.use('/api/exams', generalLimiter, examRoutes);
+ app.use('/api/fees', generalLimiter, feeRoutes);
+ app.use('/api/library', generalLimiter, libraryRoutes);
+ app.use('/api/faculty', generalLimiter, facultyRoutes);
+ app.use('/api/dashboard', generalLimiter, dashboardRoutes);
+ app.use('/api/users', generalLimiter, userRoutes);
+ app.use('/api/departments', generalLimiter, departmentRoutes);
+ app.use('/api/holidays', generalLimiter, holidayRoutes);
+ app.use('/api/feedback', generalLimiter, feedbackRoutes);
+ app.use('/api/admin/approvals', generalLimiter, approvalRoutes);
+ app.use('/api/events', generalLimiter, eventRoutes);
+ app.use('/api/personnel', generalLimiter, personnelRoutes);
+ app.use('/api/performance', generalLimiter, performanceRoutes);
+ app.use('/api/hostels', generalLimiter, hostelRoutes);
+ app.use('/api/transport', generalLimiter, transportRoutes);
+ app.use('/api/inventory', generalLimiter, inventoryRoutes);
```

---

### SEC-07: Add Startup Environment Validation

**File**: `server/src/index.js` — add before `start()` call at line 239:

```javascript
// === Environment Validation ===
function validateEnv() {
    const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
        console.error('   Create a .env file in /server with these values.');
        process.exit(1);
    }

    if (process.env.JWT_SECRET.length < 32) {
        console.error('❌ JWT_SECRET must be at least 32 characters');
        process.exit(1);
    }

    if (process.env.JWT_SECRET === 'your_jwt_secret_here_change_this') {
        console.error('❌ JWT_SECRET is still the default placeholder. Generate a real secret:');
        console.error('   node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
        process.exit(1);
    }

    console.log('✅ Environment validation passed');
}

// Add body size limit to prevent DoS
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

validateEnv();
start();
```

---

### SEC-08: Fix Broken Validation Middleware

**Problem**: `server/src/middleware/validation.js` imports `sanitize` from `express-validator` which doesn't exist in v7+. The `stringRules` object is also broken.

**File**: `server/src/middleware/validation.js`

```javascript
// ✅ COMPLETE REWRITE
import { body, validationResult } from 'express-validator';

/**
 * Sanitize request body strings to prevent XSS
 */
export const sanitizeBody = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        for (const key of Object.keys(req.body)) {
            const value = req.body[key];
            if (typeof value === 'string') {
                req.body[key] = value
                    .trim()
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+\s*=/gi, '');
            }
        }
    }
    next();
};

/**
 * Common validation chains
 */
export const rules = {
    email: body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    password: body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    name: body('name').notEmpty().trim().escape().withMessage('Name is required'),
    id: body('id').optional().isInt({ min: 1 }).withMessage('ID must be a positive integer'),
};

/**
 * Middleware to handle validation results
 */
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errors.array().map(e => ({
                field: e.path,
                message: e.msg,
            })),
        });
    }
    next();
};
```

---

### SEC-09: Remove Hardcoded Demo Credentials from Login UI

**File**: `client/src/pages/Login.jsx` — remove lines 71-76:

```diff
- <div className="login-hint">
-     <strong>Demo Credentials:</strong><br />
-     Admin: admin / admin123<br />
-     Faculty: shivangi / fac123<br />
-     Student: alice / stu123
- </div>
+ {/* Demo credentials documented in .env.example only */}
```

Move to `server/.env.example`:
```bash
# Demo credentials (development only — change in production!)
# Admin:   admin / admin123
# Faculty: shivangi / fac123
# Student: alice / stu123
```

---

## 🐛 Bug Fixes

### BUG-01: Fee Route Ordering — Param Routes Swallow Named Routes

**Problem**: In `server/src/routes/fees.js`, routes like `/my-fees` (line 10), `/defaulters` (line 189), and `/stats` (line 211) are defined **after** `/:id` would be if it existed, but more importantly, `/:studentId/summary` (line 51) will match `/defaulters` and `/stats` treating the string as a `studentId`.

**Fix**: Reorder routes — named routes MUST come before parameterized routes.

```javascript
// server/src/routes/fees.js — ensure this order:
router.get('/my-fees', authenticate, ...);      // 1. Named routes first
router.get('/defaulters', authenticate, ...);    // 2. Named routes
router.get('/stats', authenticate, ...);         // 3. Named routes
router.get('/:studentId/summary', authenticate, ...); // 4. Param routes LAST
```

---

### BUG-02: AuthContext Trusts Stale localStorage Data

**Problem**: `client/src/context/AuthContext.jsx` line 11-18 reads stored user data from `localStorage` on mount but never validates whether the JWT is still valid. A user with an expired token appears "authenticated" until their first API call fails.

**File**: `client/src/context/AuthContext.jsx`

```diff
  useEffect(() => {
      const token = localStorage.getItem('erp_token');
      const savedUser = localStorage.getItem('erp_user');
      if (token && savedUser) {
          try {
-             setUser(JSON.parse(savedUser));
+             // Validate token is not expired by calling /auth/me
+             api.get('/auth/me')
+                 .then(res => setUser(res.data))
+                 .catch(() => {
+                     // Token invalid/expired — clear everything
+                     localStorage.removeItem('erp_token');
+                     localStorage.removeItem('erp_refresh_token');
+                     localStorage.removeItem('erp_user');
+                     setUser(null);
+                 })
+                 .finally(() => setLoading(false));
+             return; // Don't call setLoading(false) below
          } catch { /* ignore */ }
      }
      setLoading(false);
  }, []);
```

---

### BUG-03: Notification Dropdown Never Closes on Outside Click

**Problem**: `client/src/components/Layout.jsx` — the notification dropdown toggles on button click but has no "click outside to close" handler.

Add after line 57:

```javascript
const notificationRef = useRef(null);

useEffect(() => {
    const handleClickOutside = (e) => {
        if (notificationRef.current && !notificationRef.current.contains(e.target)) {
            setShowNotifications(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

Then wrap the notification `<div>` (line 169) with `ref={notificationRef}`.

---

### BUG-04: `getPageTitle()` Fails for Nested Paths

**Problem**: `Layout.jsx` line 84 does exact match `i.path === location.pathname`, but `/faculty/schedule` or `/exams/123/analytics` won't match.

```diff
  const getPageTitle = () => {
      const flat = allNavItems.flatMap(s => s.items);
-     const current = flat.find(i => i.path === location.pathname);
+     const current = flat.find(i =>
+         i.path === location.pathname ||
+         (i.path !== '/' && location.pathname.startsWith(i.path))
+     );
      return current?.label || 'Dashboard';
  };
```

---

## ⚡ Performance Optimizations

### PERF-01: Lazy-Load All Page Components

**File**: `client/src/App.jsx` — replace static imports with lazy:

```javascript
import { lazy, Suspense } from 'react';

// Replace all page imports with lazy versions
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));
const Courses = lazy(() => import('./pages/Courses'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Exams = lazy(() => import('./pages/Exams'));
const Fees = lazy(() => import('./pages/Fees'));
const Library = lazy(() => import('./pages/Library'));
const Users = lazy(() => import('./pages/Users'));
const Faculty = lazy(() => import('./pages/Faculty'));
const Departments = lazy(() => import('./pages/Departments'));
const Feedback = lazy(() => import('./pages/Feedback'));
const Register = lazy(() => import('./pages/Register'));
const Approvals = lazy(() => import('./pages/Approvals'));
const ExamAnalytics = lazy(() => import('./pages/ExamAnalytics'));
const Events = lazy(() => import('./pages/Events'));
const Personnel = lazy(() => import('./pages/Personnel'));
const StudentPerformance = lazy(() => import('./pages/StudentPerformance'));
const HostelManagement = lazy(() => import('./pages/HostelManagement'));
const TransportManagement = lazy(() => import('./pages/TransportManagement'));
const FacultySchedule = lazy(() => import('./pages/FacultySchedule'));
const InventoryManagement = lazy(() => import('./pages/InventoryManagement'));

// Skeleton loader component
function PageSkeleton() {
    return (
        <div className="page-skeleton fade-in" style={{ padding: '24px' }}>
            <div className="skeleton-bar" style={{ width: '30%', height: '28px', marginBottom: '24px' }} />
            <div className="skeleton-bar" style={{ width: '100%', height: '200px', marginBottom: '16px' }} />
            <div className="skeleton-bar" style={{ width: '100%', height: '400px' }} />
        </div>
    );
}

// Wrap each route element:
// <Route index element={<Suspense fallback={<PageSkeleton />}><Dashboard /></Suspense>} />
```

Add to `client/src/index.css`:

```css
/* Skeleton loading */
.skeleton-bar {
    background: linear-gradient(90deg, var(--card-bg) 25%, rgba(255,255,255,0.08) 50%, var(--card-bg) 75%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s infinite;
    border-radius: 8px;
}
@keyframes skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
```

---

### PERF-02: Server-Side Pagination

Add pagination helper used across all list endpoints:

**New file**: `server/src/utils/pagination.js`

```javascript
/**
 * Parse pagination params from query string.
 * @param {object} query - req.query
 * @returns {{ limit: number, offset: number, page: number }}
 */
export function parsePagination(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

/**
 * Format paginated response.
 */
export function paginatedResponse(rows, count, { page, limit }) {
    return {
        data: rows,
        pagination: {
            page,
            limit,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            hasNext: page * limit < count,
            hasPrev: page > 1,
        },
    };
}
```

**Example usage in** `server/src/routes/students.js`:

```javascript
import { parsePagination, paginatedResponse } from '../utils/pagination.js';

router.get('/', authenticate, authorize('admin', 'faculty', 'staff'), async (req, res) => {
    try {
        const { page, limit, offset } = parsePagination(req.query);
        const { department, semester, status, search } = req.query;
        const where = {};
        // ... existing where clause building ...

        const { count, rows } = await Student.findAndCountAll({
            where,
            include: [/* existing includes */],
            order: [['name', 'ASC']],
            limit,
            offset,
        });

        res.json(paginatedResponse(rows, count, { page, limit }));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
```

---

### PERF-03: Debounced Search Utility

**New file**: `client/src/utils/debounce.js`

```javascript
/**
 * Debounce a function call.
 * @param {Function} fn
 * @param {number} ms - delay in milliseconds
 */
export function debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}
```

**Usage in any list page** (e.g., `Students.jsx`):

```javascript
import { debounce } from '../utils/debounce';

const debouncedSearch = useMemo(
    () => debounce((value) => {
        setSearchTerm(value);
        setPage(1); // reset to page 1 on new search
    }, 300),
    []
);

// In JSX:
<input
    type="text"
    placeholder="Search students..."
    onChange={(e) => debouncedSearch(e.target.value)}
    className="form-control"
/>
```

---

## 🎨 UI/UX Improvements by Tab

### 🔐 Login Tab (`client/src/pages/Login.jsx`)

| Issue | Fix |
|-------|-----|
| No password visibility toggle | Add eye icon toggle |
| No session-expired feedback | Check URL params for `?session=expired` |
| Hardcoded demo creds shown to everyone | Remove from UI (SEC-09) |

**Password toggle snippet**:
```jsx
const [showPassword, setShowPassword] = useState(false);

<div className="form-group" style={{ position: 'relative' }}>
    <label>Password</label>
    <input
        className="form-control"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        id="login-password"
        autoComplete="current-password"
    />
    <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        style={{
            position: 'absolute', right: '12px', top: '38px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)',
        }}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
</div>
```

---

### 📊 Dashboard Tab (`client/src/pages/Dashboard.jsx`)

| Issue | Fix |
|-------|-----|
| No "last updated" on data cards | Add timestamp below each stat card |
| Charts re-render on every parent render | Wrap with `React.memo` |
| No empty state for new installations | Add empty state component |

**Memoized chart wrapper**:
```jsx
const MemoizedChart = React.memo(({ data, ...props }) => (
    <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} {...props}>
            {/* chart config */}
        </BarChart>
    </ResponsiveContainer>
));
```

---

### 👥 Students Tab (`client/src/pages/Students.jsx`)

| Issue | Fix |
|-------|-----|
| Client-side filtering only | Add server-side pagination (PERF-02) |
| No bulk actions | Add checkbox column + bulk delete/export |
| No avatar/initials | Add avatar circle with student initials |

**Student avatar component**:
```jsx
function StudentAvatar({ name }) {
    const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const color = `hsl(${name.charCodeAt(0) * 7 % 360}, 60%, 45%)`;

    return (
        <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: color, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700,
        }}>
            {initials}
        </div>
    );
}
```

---

### ✅ Attendance Tab (`client/src/pages/Attendance.jsx`)

| Issue | Fix |
|-------|-----|
| No "Mark All Present" shortcut | Add bulk action button |
| Attendance % not color coded | Add gradient color based on percentage |
| No date range presets | Add "This Week / This Month" quick-select |

**Color-coded attendance percentage**:
```jsx
function AttendancePercent({ value }) {
    const color = value >= 90 ? 'var(--success)'
        : value >= 75 ? 'var(--warning)'
        : 'var(--danger)';

    return (
        <span style={{ color, fontWeight: 700, fontSize: '14px' }}>
            {value.toFixed(1)}%
        </span>
    );
}
```

---

### 📝 Exams Tab (`client/src/pages/Exams.jsx`)

| Issue | Fix |
|-------|-----|
| No grade change audit trail | Log `modifiedBy`, `modifiedAt` on grade updates |
| No result publish confirmation | Add confirmation modal before publishing |

**Grade audit column** (backend — add to ExamResult model):
```javascript
// server/src/models/ExamResult.js — add fields:
gradedBy: { type: DataTypes.INTEGER, allowNull: true },
gradedAt: { type: DataTypes.DATE, allowNull: true },
previousScore: { type: DataTypes.FLOAT, allowNull: true },
```

---

### 💰 Fees Tab (`client/src/pages/Fees.jsx`)

| Issue | Fix |
|-------|-----|
| No status badges | Add color-coded badges |
| Payment route not role-gated | Students should only pay their own fees |

**Status badge component**:
```jsx
function FeeStatusBadge({ status }) {
    const config = {
        paid:    { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', label: 'Paid' },
        pending: { bg: 'rgba(234,179,8,0.15)',  color: '#eab308', label: 'Pending' },
        partial: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'Partial' },
        overdue: { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', label: 'Overdue' },
    };
    const c = config[status] || config.pending;

    return (
        <span style={{
            padding: '4px 10px', borderRadius: '12px', fontSize: '12px',
            fontWeight: 600, background: c.bg, color: c.color,
        }}>
            {c.label}
        </span>
    );
}
```

---

### 📖 Library Tab (`client/src/pages/Library.jsx`)

| Issue | Fix |
|-------|-----|
| No visual availability indicator | Add copies progress bar |
| No "due soon" warning | Flag books due within 3 days |

**Availability bar**:
```jsx
function AvailabilityBar({ available, total }) {
    const pct = total > 0 ? (available / total) * 100 : 0;
    const color = pct > 50 ? 'var(--success)' : pct > 20 ? 'var(--warning)' : 'var(--danger)';

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span>{available} available</span>
                <span>{total} total</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px' }}>
                <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: '3px',
                    background: color, transition: 'width 0.3s ease',
                }} />
            </div>
        </div>
    );
}
```

---

### 🏢 Departments, 🏠 Hostel, 🚌 Transport, 📦 Inventory Tabs

| Common Issue | Fix |
|-------------|-----|
| No empty states | Add `<EmptyState icon={...} message="..." />` component |
| No loading skeletons | Add `<TableSkeleton rows={10} cols={5} />` |
| No error recovery | Add error boundary with "Retry" button |

**Reusable EmptyState component** — `client/src/components/ui/EmptyState.jsx`:

```jsx
export default function EmptyState({ icon: Icon, title, message, action }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '60px 24px',
            color: 'var(--text-muted)', textAlign: 'center',
        }}>
            {Icon && <Icon size={48} style={{ opacity: 0.4, marginBottom: '16px' }} />}
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text)' }}>
                {title || 'No data yet'}
            </h3>
            <p style={{ fontSize: '14px', maxWidth: '400px', marginBottom: '20px' }}>
                {message || 'Data will appear here once records are created.'}
            </p>
            {action}
        </div>
    );
}
```

**Reusable ErrorBoundary** — `client/src/components/ui/ErrorBoundary.jsx`:

```jsx
import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px', textAlign: 'center',
                    background: 'var(--card-bg)', borderRadius: '12px',
                    border: '1px solid var(--border)', margin: '24px',
                }}>
                    <h3 style={{ color: 'var(--danger)', marginBottom: '12px' }}>
                        Something went wrong
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                        {this.state.error?.message || 'An unexpected error occurred.'}
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
```

---

## 🧪 Testing

### Test: ProtectedRoute

**File**: `client/src/pages/__tests__/ProtectedRoute.test.jsx`

```jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock('../../context/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
    AuthProvider: ({ children }) => children,
}));

// Import after mock
import App from '../../App';

describe('ProtectedRoute', () => {
    test('redirects unauthenticated users to /login', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: false, user: null, loading: false,
        });

        render(
            <MemoryRouter initialEntries={['/students']}>
                <Routes>
                    <Route path="/login" element={<div>Login Page</div>} />
                    <Route path="/students" element={<div>Students</div>} />
                </Routes>
            </MemoryRouter>
        );
        // Should redirect
    });

    test('shows loading spinner while checking auth', () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: false, user: null, loading: true,
        });
        // Should show spinner, not redirect
    });
});
```

### Test: Auth Middleware

**File**: `server/src/middleware/__tests__/auth.test.js`

```javascript
import jwt from 'jsonwebtoken';
import { authenticate } from '../auth.js';

const SECRET = 'test_secret_32_chars_long_for_sec';
process.env.JWT_SECRET = SECRET;

function mockReqRes(token) {
    return {
        req: {
            headers: {
                authorization: token ? `Bearer ${token}` : undefined,
            },
        },
        res: {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        },
        next: jest.fn(),
    };
}

describe('authenticate middleware', () => {
    test('rejects request with no token', () => {
        const { req, res, next } = mockReqRes(null);
        authenticate(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('accepts valid token', () => {
        const token = jwt.sign({ id: 1, role: 'admin' }, SECRET, { expiresIn: '1h' });
        const { req, res, next } = mockReqRes(token);
        authenticate(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.user.id).toBe(1);
    });

    test('rejects expired token', () => {
        const token = jwt.sign({ id: 1 }, SECRET, { expiresIn: '-1s' });
        const { req, res, next } = mockReqRes(token);
        authenticate(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
    });
});
```

---

## 📦 Deployment Checklist

### Pre-Deploy

- [ ] All items in `.gitignore` confirmed (no secrets committed)
- [ ] `JWT_SECRET` is 64+ characters, randomly generated
- [ ] `JWT_REFRESH_SECRET` is separate from `JWT_SECRET`
- [ ] `NODE_ENV=production` set
- [ ] Rate limiting applied to all routes
- [ ] CORS restricted to production domain only
- [ ] Socket.IO CORS restricted
- [ ] `npm audit` shows 0 high/critical vulnerabilities
- [ ] All tests pass (`npm test` in both client & server)
- [ ] `client/dist/` built with `npm run build`

### Environment Variables Template (`server/.env.example`)

```bash
# Server
NODE_ENV=development
PORT=5000
DB_PATH=./database.sqlite

# Auth — GENERATE STRONG VALUES before deploying!
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=CHANGE_ME_64_CHAR_MINIMUM
JWT_REFRESH_SECRET=CHANGE_ME_64_CHAR_MINIMUM_DIFFERENT
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Demo credentials (dev only):
# Admin:   admin / admin123
# Faculty: shivangi / fac123
# Student: alice / stu123
```

### Post-Deploy

```bash
# Verify security headers
curl -sI https://your-domain.com/api/health | grep -i "x-content-type\|strict-transport\|x-frame"

# Verify rate limiting
for i in $(seq 1 10); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST https://your-domain.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}'
done
# Should see 429 after 5 attempts

# Verify DB not accessible
curl -s https://your-domain.com/database.sqlite
# Should return 404
```

---

> **Implementation order**: SEC-01 → SEC-02 → SEC-03 → SEC-04 → SEC-06 → SEC-07 → SEC-08 → SEC-09 → BUG-01 → BUG-02 → BUG-03 → BUG-04 → PERF-01 → PERF-02 → PERF-03 → UI improvements
