import { Op } from "sequelize";
import express from 'express';
import {  Faculty, Course, User, Department  } from '../models/index.js';
import {  authenticate, authorize  } from '../middleware/auth.js';

const router = express.Router();

// GET /api/faculty
router.get('/', authenticate, async (req, res) => {
    try {
        const { department, status, search } = req.query;
        const where = {};
        if (department) where.department = department;
        if (status) where.status = status;

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
            ];
        }

        const faculty = await Faculty.findAll({
            where,
            include: [
                { model: Course, as: 'courses', attributes: ['id', 'code', 'title'] },
                { model: Department, as: 'departmentRef', attributes: ['name', 'code'] }
            ],
            order: [['name', 'ASC']],
        });
        res.json(faculty);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/faculty/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const faculty = await Faculty.findByPk(req.params.id, {
            include: [{ model: Course, as: 'courses' }],
        });
        if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
        res.json(faculty);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/faculty
router.post('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const faculty = await Faculty.create(req.body);
        res.status(201).json(faculty);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/faculty/:id
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const faculty = await Faculty.findByPk(req.params.id);
        if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
        await faculty.update(req.body);
        res.json(faculty);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/faculty/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const faculty = await Faculty.findByPk(req.params.id);
        if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
        await faculty.destroy();
        res.json({ message: 'Faculty deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
