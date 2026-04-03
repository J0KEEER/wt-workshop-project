import { Op } from "sequelize";
import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
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
        batchExpiresAt: user.batchExpiresAt 
    };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
    return { accessToken, refreshToken };
}

// POST /api/auth/login
router.post('/login', [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

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
                    if (password === student.rollNo || password === 'password123') {
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
                    }
                }
            } else {
                // Check Faculty by email
                let faculty = await Faculty.findOne({ where: { email: username } });
                if (faculty) {
                    if (!faculty.userId) {
                        // First time login for faculty: check default password (email)
                        if (password === faculty.email || password === 'password123') {
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
                        }
                    }
                }
            }
        }

        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        if (!user.isActive) return res.status(403).json({ error: 'Account is disabled' });
        if (!user.isApproved) return res.status(403).json({ error: 'Account pending admin approval' });

        const isValid = await user.validatePassword(password);
        if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

        const tokens = generateTokens(user);
        res.json({ user: user.toJSON(), ...tokens });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/auth/register
router.post('/register', [
    body('username').isLength({ min: 3 }),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').notEmpty(),
    body('role').isIn(['admin', 'faculty', 'student', 'librarian', 'staff']),
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { username, email, password, firstName, lastName, role } = req.body;
        const existing = await User.findOne({ where: { username } });
        if (existing) return res.status(409).json({ error: 'Username already exists' });

        const user = await User.create({
            username, email, passwordHash: password, firstName, lastName, role,
            isApproved: false, // Self-registration must be approved
        });
        const tokens = generateTokens(user);
        res.status(201).json({ user: user.toJSON(), ...tokens });
    } catch (err) {
        res.status(500).json({ error: err.message });
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
        res.status(500).json({ error: err.message });
    }
});

export default router;
