import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { initDB } from './db.js';
import { initSocket, getIO } from './socket.js';
import './models/index.js'; // Load associations

import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import courseRoutes from './routes/courses.js';
import attendanceRoutes from './routes/attendance.js';
import examRoutes from './routes/exams.js';
import feeRoutes from './routes/fees.js';
import libraryRoutes from './routes/library.js';
import facultyRoutes from './routes/faculty.js';
import dashboardRoutes from './routes/dashboard.js';
import userRoutes from './routes/users.js';
import departmentRoutes from './routes/departments.js';
import holidayRoutes from './routes/holidays.js';
import feedbackRoutes from './routes/feedback.js';
import approvalRoutes from './routes/approvals.js';
import eventRoutes from './routes/events.js';
import personnelRoutes from './routes/personnel.js';
import performanceRoutes from './routes/performance.js';
import hostelRoutes from './routes/hostels.js';
import transportRoutes from './routes/transport.js';
import inventoryRoutes from './routes/inventory.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

if (process.env.CORS_ORIGIN) {
    allowedOrigins.push(...process.env.CORS_ORIGIN.split(','));
}

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// Security Headers with Helmet
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Rate limiting - stricter for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { error: 'Too many login attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window per IP
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - start;
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
    });
    next();
});

// Broadcast middleware — notify dashboard clients on data mutations
const MUTATION_METHODS = new Set(['POST', 'PUT', 'DELETE']);
app.use((req, res, next) => {
    if (!MUTATION_METHODS.has(req.method)) return next();

    const originalJson = res.json.bind(res);
    res.json = function (body) {
        // Only broadcast on successful mutations (2xx), skip auth routes
        if (res.statusCode >= 200 && res.statusCode < 300 && !req.originalUrl.startsWith('/api/auth')) {
            try {
                getIO().emit('dashboard:update', {
                    resource: req.originalUrl.split('/')[2] || 'unknown',
                    action: req.method,
                    timestamp: Date.now(),
                });
            } catch { /* socket not ready yet */ }
        }
        return originalJson(body);
    };
    next();
});

// API Routes - Apply rate limiting to auth endpoints
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/students', generalLimiter, studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin/approvals', approvalRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/personnel', personnelRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/inventory', inventoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Serve React Frontend (Static Build)
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

// Catch-all for React Router (Serves index.html for non-API routes)
app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
        return next(); // Let the 404 handler handle unmatched API routes
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
});

// 404 handler for API routes
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler with structured error codes
app.use((err, req, res, next) => {
    const timestamp = new Date().toISOString();
    const requestId = req.headers['x-request-id'] || 'N/A';

    // Log full error for debugging
    console.error(`[${timestamp}] [RequestID: ${requestId}]`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });

    // Determine status code and safe error message
    const statusCode = err.status || err.statusCode || 500;
    const errorCode = err.code || 'INTERNAL_ERROR';

    // Don't expose internal errors in production
    const message = statusCode === 500
        ? 'An unexpected error occurred. Our team has been notified.'
        : err.message;

    res.status(statusCode).json({
        error: true,
        code: errorCode,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        timestamp,
        requestId,
    });
});

// Get local network IP
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const alias of iface) {
            if (alias.family === 'IPv4' && !alias.internal) return alias.address;
        }
    }
    return 'localhost';
}

// Start
async function start() {
    await initDB();
    initSocket(server);
    server.listen(PORT, HOST, () => {
        const ip = getLocalIP();
        console.log(`\n🚀 College ERP API running on:`);
        console.log(`   Local:   http://localhost:${PORT}`);
        console.log(`   Network: http://${ip}:${PORT}`);
        console.log(`   Health:  http://localhost:${PORT}/api/health\n`);
    });
}

start();
