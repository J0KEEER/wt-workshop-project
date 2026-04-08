import { Op } from "sequelize";
import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult, matchedData } from 'express-validator';
import { User, Student, Faculty } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

function generateTokens(user) {
    const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        batchExpiresAt: user.batchExpiresAt,
        jti: crypto.randomUUID() // Unique token ID for potential revocation
    };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '15m' // Shorter expiry for better security
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    });
    return { accessToken, refreshToken };
}

// POST /api/auth/login
router.post('/login', [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: errors.array()
            });
        }

        const { username, password } = req.body;

        // 1. Try to find the user in the User table first
        let user = await User.findOne({
            where: {
                [Op.or]: [
                    { username },
                    { email: username }
                ]
            },
            include: [
                { model: Student, as: 'studentProfile' },
                { model: Faculty, as: 'facultyProfile' }
            ]
        });

        // 2. If not found, try fallback to Student/Faculty tables
        if (!user) {
            // Check Student by rollNo or email
            let student = await Student.findOne({
                where: {
                    [Op.or]: [
                        { rollNo: username },
                        { email: username }
                    ]
                }
            });

            if (student) {
                if (!student.userId) {
                    // First time login for student: check default password (rollNo)
                    if (password === student.rollNo) {
                        user = await User.create({
                            username: student.rollNo,
                            email: student.email,
                            passwordHash: password,
                            firstName: student.name.split(' ')[0],
                            lastName: student.name.split(' ').slice(1).join(' ') || null,
                            role: 'student',
                        });
                        await student.update({ userId: user.id });
                        user = await User.findByPk(user.id, {
                            include: [{ model: Student, as: 'studentProfile' }]
                        });
                    } else {
                        // Track failed attempt
                        console.log(`[${new Date().toISOString()}] Failed student auto-registration attempt for rollNo: ${username}`);
                        return res.status(401).json({
                            error: 'Invalid credentials',
                            code: 'INVALID_CREDENTIALS'
                        });
                    }
                }
            } else {
                // Check Faculty by email
                let faculty = await Faculty.findOne({ where: { email: username } });
                if (faculty) {
                    if (!faculty.userId) {
                        // First time login for faculty: check default password (email)
                        if (password === faculty.email) {
                            user = await User.create({
                                username: faculty.email.split('@')[0],
                                email: faculty.email,
                                passwordHash: password,
                                firstName: faculty.name.split(' ')[0],
                                lastName: faculty.name.split(' ').slice(1).join(' ') || null,
                                role: 'faculty',
                            });
                            await faculty.update({ userId: user.id });
                            user = await User.findByPk(user.id, {
                                include: [{ model: Faculty, as: 'facultyProfile' }]
                            });
                        } else {
                            console.log(`[${new Date().toISOString()}] Failed faculty auto-registration attempt for email: ${username}`);
                            return res.status(401).json({
                                error: 'Invalid credentials',
                                code: 'INVALID_CREDENTIALS'
                            });
                        }
                    }
                }
            }
        }

        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }
        if (!user.isActive) {
            return res.status(403).json({
                error: 'Account is disabled',
                code: 'ACCOUNT_DISABLED'
            });
        }
        if (!user.isApproved) {
            return res.status(403).json({
                error: 'Account pending admin approval',
                code: 'ACCOUNT_PENDING_APPROVAL'
            });
        }

        const isValid = await user.validatePassword(password);
        if (!isValid) {
            console.log(`[${new Date().toISOString()}] Failed login attempt for user: ${username}`);
            return res.status(401).json({
                error: 'Invalid credentials',
                code: 'INVALID_CREDENTIALS'
            });
        }

        const tokens = generateTokens(user);
        res.json({ user: user.toJSON(), ...tokens });
    } catch (err) {
        console.error('Login error:', err);
        // Let global error handler deal with it, or:
        const status = err.status || 500;
        res.status(status).json({
            error: err.message || 'Internal server error',
            code: err.code || 'LOGIN_FAILED',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        });
    }
});

// POST /api/auth/register
router.post('/register', [
    body('username').isLength({ min: 3, max: 30 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('firstName').notEmpty().trim().escape(),
    body('lastName').optional({ nullable: true }).trim().escape(),
    body('role').isIn(['admin', 'faculty', 'student', 'librarian', 'staff']),
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: errors.array()
            });
        }

        const data = matchedData(req);

        const existing = await User.findOne({
            where: {
                [Op.or]: [
                    { username: data.username },
                    { email: data.email }
                ]
            }
        });
        if (existing) {
            return res.status(409).json({
                error: 'Username or email already exists',
                code: 'USER_EXISTS'
            });
        }

        const user = await User.create({
            username: data.username,
            email: data.email,
            passwordHash: data.password,
            firstName: data.firstName,
            lastName: data.lastName || null,
            role: data.role,
            isApproved: false, // Self-registration must be approved
        });

        const tokens = generateTokens(user);
        res.status(201).json({ user: user.toJSON(), ...tokens });
    } catch (err) {
        console.error('Registration error:', err);
        next(err); // Pass to global error handler
    }
});

// POST /api/auth/refresh-token
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findByPk(decoded.id);
        if (!user) return res.status(401).json({ error: 'User not found' });

        const tokens = generateTokens(user);
        res.json(tokens);
    } catch (err) {
        console.error('Refresh token error:', err);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [
                { model: Student, as: 'studentProfile' },
                { model: Faculty, as: 'facultyProfile' },
            ],
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user.toJSON());
    } catch (err) {
        console.error('Auth me error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
