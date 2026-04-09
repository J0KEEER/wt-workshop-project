# Security Fixes & Bug Fixes Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Address critical and high-priority security vulnerabilities and bug fixes in the College ERP System

**Architecture:** Sequential implementation following the priority order: SEC-01, SEC-07, then SEC-02-04, SEC-06/08, BUG-01/04

**Tech Stack:** Node.js, Express, Sequelize, React, Socket.IO

---

## Priority 1: Critical Security Fixes (SEC-01, SEC-07)

### Task 1.1: Update `.gitignore` to prevent sensitive files from being committed

**Files:**
- Modify: `/Users/mridulgupta2911/webtechproject/.gitignore`

- [ ] **Step 1: Update `.gitignore`**

```diff
# IDE / Tool configs
.agents/
mcp.json
mcp_config.json
.code-review-graph/
.planning/
G0DM0D3/

+ # Security: Never commit environment files with secrets
+ .env
+ .env.*
+ !.env.example
+ 
+ # Database files (can contain sensitive data)
+ *.sqlite
+ *.sqlite3
+ *.db
+ server/*.db
+ server/*.sqlite
```

- [ ] **Step 2: Remove sensitive files from git tracking**

```bash
git rm --cached -f database.sqlite
git rm --cached -f server/college.db
git rm --cached -f server/database.sqlite
git commit -m "chore: update .gitignore and remove sensitive db files from tracking"
```

---

### Task 1.2: Add Environment Validation at Startup

**Files:**
- Modify: `/Users/mridulgupta2911/webtechproject/server/src/index.js` (lines 239-264 - already exists, verify it's correct)

- [ ] **Step 1: Verify environment validation is in place**

The code at lines 239-262 already exists with:
- JWT_SECRET and JWT_REFRESH_SECRET required
- Minimum 32 character length check
- Placeholder value detection

If needed, ensure it's called BEFORE `start()`:
```javascript
// === Environment Validation ===
function validateEnv() {
    const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'NODE_ENV'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
        console.error('   Create a .env file in /server with these values.');
        process.exit(1);
    }

    if (process.env.JWT_SECRET.length < 64) {
        console.error('❌ JWT_SECRET must be at least 64 characters for production');
        process.exit(1);
    }

    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && process.env.JWT_SECRET.length < 64) {
        console.error('❌ JWT_SECRET must be at least 64 characters in production');
        process.exit(1);
    }

    if (process.env.JWT_SECRET?.includes('your_jwt_secret') || 
        process.env.JWT_SECRET?.length < 32) {
        console.error('❌ JWT_SECRET is still the default placeholder or too weak');
        process.exit(1);
    }

    console.log('✅ Environment validation passed');
}

validateEnv();
start();
```

- [ ] **Step 2: Verify .env.example has strong placeholder**

Check `/Users/mridulgupta2911/webtechproject/server/.env.example` contains:
```bash
# Generate using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=CHANGE_ME_WITH_64_PLUS_CHARACTERS
JWT_REFRESH_SECRET=CHANGE_ME_WITH_64_PLUS_CHARACTERS
```

---

## Priority 2: High Priority Security Fixes (SEC-02, SEC-03, SEC-04)

### Task 2.1: Verify Socket.IO CORS Configuration

**Files:**
- Read: `/Users/mridulgupta2911/webtechproject/server/src/socket.js`

- [ ] **Step 1: Verify CORS configuration is correct**

The current code (lines 8-23) already has:
```javascript
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
];
```

✅ Already implemented correctly - no changes needed.

- [ ] **Step 2: Verify authentication middleware exists (line 30-43)**

The socket authentication using tokens is already in place. No changes needed.

---

### Task 2.2: Fix Registration to NOT Issue Tokens to Unapproved Users

**Files:**
- Read: `/Users/mridulgupta2911/webtechproject/server/src/routes/auth.js` (lines 172-227)

- [ ] **Step 1: Verify registration doesn't issue tokens**

The current code (lines 208-222) already correctly:
1. Creates user with `isApproved: false`
2. Does NOT call `generateTokens()`
3. Returns message: "Registration successful. Your account is pending admin approval."

✅ Already implemented correctly - no changes needed.

---

### Task 2.3: Verify Mass Assignment Protection in All Routes

**Files:**
- Check: `/Users/mridulgupta2911/webtechproject/server/src/routes/fees.js`
- Check: `/Users/mridulgupta2911/webtechproject/server/src/routes/students.js`
- Check: `/Users/mridulgupta2911/webtechproject/server/src/routes/courses.js`
- Check: `/Users/mridulgupta2911/webtechproject/server/src/routes/faculty.js`

- [ ] **Step 1: Verify fees.js has mass assignment protection**

Current code (line 144, 170-174):
```javascript
// POST - already uses explicit destructuring
const { studentId, amount, dueDate, type, status, description } = req.body;
const fee = await Fee.create({ studentId, amount, dueDate, type, status, description });

// PUT - already uses allowedFields pattern
const allowedFields = ['amount', 'dueDate', 'type', 'status', 'description'];
const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
);
await fee.update(updates);
```

✅ Already protected - no changes needed.

- [ ] **Step 2: Verify students.js has mass assignment protection**

Current code (line 80, 109-113):
```javascript
// POST - explicit destructuring
const { name, rollNo, email, phone, department, semester, status, departmentId } = req.body;
const student = await Student.create({ name, rollNo, email, phone, department, semester, status, departmentId });

// PUT - allowedFields pattern
const allowedFields = ['name', 'email', 'phone', 'department', 'semester', 'status', 'departmentId'];
const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
);
await student.update(updates);
```

✅ Already protected - no changes needed.

- [ ] **Step 3: Check other routes for mass assignment issues**

Run subagent to audit remaining routes:
- `courses.js`
- `faculty.js`
- `attendance.js`
- `exams.js`
- `library.js`
- `hostels.js`
- `transport.js`
- `inventory.js`
- `personnel.js`

If issues found, apply the same pattern:
```javascript
// Instead of: await Model.create(req.body)
// Use:
const { field1, field2, field3 } = req.body;
await Model.create({ field1, field2, field3 });

// Or:
const allowedFields = ['field1', 'field2', 'field3'];
const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
);
await Model.update(updates, { where: { id } });
```

---

### Task 2.4: Verify Rate Limiting on ALL Routes

**Files:**
- Check: `/Users/mridulgupta2911/webtechproject/server/src/index.js` (lines 138-158)

- [ ] **Step 1: Verify rate limiting is applied to all API routes**

Current code shows all routes have `generalLimiter`:
```javascript
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/students', generalLimiter, studentRoutes);
app.use('/api/courses', generalLimiter, courseRoutes);
app.use('/api/attendance', generalLimiter, attendanceRoutes);
app.use('/api/exams', generalLimiter, examRoutes);
app.use('/api/fees', generalLimiter, feeRoutes);
// ... all other routes have generalLimiter
```

✅ Already implemented correctly - no changes needed.

- [ ] **Step 2: Add rate limiting to admin routes if missing**

Check that `/api/admin/approvals` has `generalLimiter` - it does (line 152).

✅ Already protected - no changes needed.

---

### Task 2.5: Fix Validation Middleware (SEC-08)

**Files:**
- Check: `/Users/mridulgupta2911/webtechproject/server/src/middleware/validation.js`

- [ ] **Step 1: Verify validation.js is correct**

Current implementation (lines 1-49):
```javascript
import { body, validationResult } from 'express-validator';

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

export const rules = {
    email: body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    password: body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    name: body('name').trim().notEmpty().escape().withMessage('Name is required'),
    id: body('id').optional().isInt({ min: 1 }).withMessage('ID must be a positive integer'),
};

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

✅ Already properly implemented - no changes needed.

- [ ] **Step 2: Verify all routes use validation correctly**

Check each route file imports and uses validation:
```javascript
import { sanitizeBody, rules, handleValidationErrors } from '../middleware/validation.js';
```

- [ ] **Step 3: Add validation middleware to routes that need it**

Routes that might need validation middleware:
- `attendance.js`
- `exams.js`
- `library.js`
- `hostels.js`
- `transport.js`
- `inventory.js`
- `personnel.js`

Apply pattern:
```javascript
import { sanitizeBody, handleValidationErrors } from '../middleware/validation.js';

// Apply before validation chains
app.use(sanitizeBody);
```

---

## Priority 3: Bug Fixes (BUG-01, BUG-04)

### Task 3.1: Fix Fee Route Ordering (BUG-01)

**Files:**
- Check: `/Users/mridulgupta2911/webtechproject/server/src/routes/fees.js`

- [ ] **Step 1: Verify route order is correct**

Current order (lines 9-120):
```javascript
10: router.get('/my-fees', ...)           // Named routes FIRST
52: router.get('/defaulters', ...)        // Named routes
74: router.get('/stats', ...)             // Named routes
99: router.get('/:studentId/summary', ...) // Param routes LAST
```

✅ Already implemented correctly - no changes needed.

- [ ] **Step 2: Add comment for future maintainers**

Add note at top of route file:
```javascript
// NOTE: Named routes MUST be registered before parameterized routes
// to prevent /:id from matching "/defaulters", "/stats", etc.
```

---

### Task 3.2: Fix Layout.js `getPageTitle()` for Nested Paths (BUG-04)

**Files:**
- Read: `/Users/mridulgupta2911/webtechproject/client/src/components/Layout.jsx`

- [ ] **Step 1: Locate `getPageTitle()` function**

Search for `const getPageTitle = () =>` in Layout.jsx

- [ ] **Step 2: Update the function to handle nested paths**

**Current (likely):**
```javascript
const current = flat.find(i => i.path === location.pathname);
```

**Fix:**
```javascript
const current = flat.find(i =>
    i.path === location.pathname ||
    (i.path !== '/' && location.pathname.startsWith(i.path))
);
```

- [ ] **Step 3: Test the fix**

Navigate to:
- `/faculty/schedule`
- `/exams/123/analytics`
- `/students/123/summary`

Verify page title correctly identifies the section.

---

## Priority 4: UI/UX Improvements (After Security/Bug Fixes)

### Task 4.1: Password Visibility Toggle in Login

**Files:**
- `/Users/mridulgupta2911/webtechproject/client/src/pages/Login.jsx`

- [ ] **Step 1: Add state for password visibility**
```javascript
const [showPassword, setShowPassword] = useState(false);
```

- [ ] **Step 2: Add toggle button in password field**
```javascript
<div className="form-group" style={{ position: 'relative' }}>
    <label>Password</label>
    <input
        className="form-control"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
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
    >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
</div>
```

- [ ] **Step 3: Add imports**
```javascript
import { Eye, EyeOff } from 'lucide-react';
```

---

### Task 4.2: Lazy Load Page Components

**Files:**
- `/Users/mridulgupta2911/webtechproject/client/src/App.jsx`

- [ ] **Step 1: Replace static imports with lazy**

```javascript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));
const Courses = lazy(() => import('./pages/Courses'));
// ... all other pages
```

- [ ] **Step 2: Wrap routes in Suspense**
```javascript
<Route 
    path="/dashboard" 
    element={
        <Suspense fallback={<div>Loading...</div>}>
            <Dashboard />
        </Suspense>
    } 
/>
```

- [ ] **Step 3: Add loading skeleton**
```css
/* Add to client/src/index.css */
.page-skeleton {
    padding: 24px;
}
.skeleton-bar {
    background: linear-gradient(90deg, var(--card-bg) 25%, #e0e0e0 50%, var(--card-bg) 75%);
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

## Verification Checklist

After all fixes, run:

```bash
# Backend
cd server
npm audit  # Check for vulnerabilities
node -e "require('dotenv').config(); console.log(process.env.JWT_SECRET ? 'JWT_SECRET set' : 'MISSING')"

# Frontend
cd client
npm run build  # Verify no TypeScript/compile errors
npm test  # Run existing tests

# Security
# Test rate limiting
for i in $(seq 1 10); do curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"wrong"}'; done

# Test CORS (should reject non-allowed origins)
curl -I -H "Origin: http://malicious.com" http://localhost:5000/api/health

# Test environment validation (restart should fail with missing secrets)
rm .env && npm run dev || echo "环境验证正常工作"
```

---

## Implementation Order Summary

1. **SEC-01** - Update `.gitignore` (5 min)
2. **SEC-07** - Verify environment validation (5 min)
3. **SEC-02** - Verify Socket.IO CORS (5 min) - Already done
4. **SEC-03** - Verify registration doesn't issue tokens (5 min) - Already done
5. **SEC-04** - Audit mass assignment protection (15 min)
6. **SEC-06** - Verify rate limiting (5 min) - Already done
7. **SEC-08** - Verify validation middleware (5 min) - Already done
8. **BUG-01** - Verify fee route order (2 min) - Already done
9. **BUG-04** - Fix `getPageTitle()` (5 min)
10. **UI-01** - Add password toggle (10 min)
11. **UI-02** - Lazy load pages (15 min)

**Estimated Total Time:** ~90 minutes