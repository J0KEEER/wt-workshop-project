import { Op } from "sequelize";
import express from 'express';
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

// PUT /api/users/:id — Update user
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        const { password, ...rest } = req.body;
        if (password) rest.passwordHash = password;
        await user.update(rest);
        res.json(user.toJSON());
    } catch (err) {
        res.status(400).json({ error: err.message });
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
