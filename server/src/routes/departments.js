import { Op } from "sequelize";
import express from 'express';
import {  Department  } from '../models/index.js';
import {  authenticate, authorize  } from '../middleware/auth.js';

const router = express.Router();

// GET /api/departments
router.get('/', authenticate, async (req, res) => {
    try {
        const { search } = req.query;
        const where = {};
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { code: { [Op.like]: `%${search}%` } },
            ];
        }
        const departments = await Department.findAll({ where, order: [['name', 'ASC']] });
        res.json(departments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/departments/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const dept = await Department.findByPk(req.params.id);
        if (!dept) return res.status(404).json({ error: 'Department not found' });
        res.json(dept);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/departments
router.post('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const dept = await Department.create(req.body);
        res.status(201).json(dept);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/departments/:id
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const dept = await Department.findByPk(req.params.id);
        if (!dept) return res.status(404).json({ error: 'Department not found' });
        await dept.update(req.body);
        res.json(dept);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/departments/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const dept = await Department.findByPk(req.params.id);
        if (!dept) return res.status(404).json({ error: 'Department not found' });
        await dept.destroy();
        res.json({ message: 'Department deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
