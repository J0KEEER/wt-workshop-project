import { Op } from "sequelize";
import express from 'express';
import { body, validationResult } from 'express-validator';
import {  User  } from '../models/index.js';
import {  authenticate, authorize  } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users — Admin only
router.get('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { role, search } = req.query;
        const where = {};
        if (role) where.role = role;
        if (search) {
            where[Op.or] = [
                { username: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { firstName: { [Op.like]: `%${search}%` } },
            ];
        }
        const users = await User.findAll({ where, order: [['createdAt', 'DESC']] });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Validation for user update
const validateUserUpdate = [
    body('username').optional().trim().escape(),
    body('email').optional().isEmail().normalizeEmail(),
    body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').optional().trim().escape(),
    body('lastName').optional().trim().escape(),
    body('role').optional().isIn(['admin', 'faculty', 'student', 'librarian', 'staff']),
    body('isActive').optional().isBoolean(),
    body('isApproved').optional().isBoolean(),
];

// PUT /api/users/:id — Update user
router.put('/:id', authenticate, authorize('admin'), validateUserUpdate, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: errors.array()
            });
        }

        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({
                error: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        const { password, ...rest } = req.body;
        if (password) rest.passwordHash = password;

        await user.update(rest);
        res.json(user.toJSON());
    } catch (err) {
        next(err);
    }
});

// DELETE /api/users/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        await user.destroy();
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
