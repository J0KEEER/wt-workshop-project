import { Op } from "sequelize";
import express from 'express';
import {  Course, Faculty, Student, Enrollment  } from '../models/index.js';
import {  authenticate, authorize  } from '../middleware/auth.js';

const router = express.Router();

// GET /api/courses
router.get('/', authenticate, async (req, res) => {
    try {
        const { department, semester, status, search } = req.query;
        const where = {};
        if (department) where.department = department;
        if (semester) where.semester = parseInt(semester);
        if (status) where.status = status;

        if (search) {
            where[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { code: { [Op.like]: `%${search}%` } },
            ];
        }

        const courses = await Course.findAll({
            where,
            include: [{ model: Faculty, as: 'faculty', attributes: ['id', 'name', 'department'] }],
            order: [['code', 'ASC']],
        });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/courses/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id, {
            include: [
                { model: Faculty, as: 'faculty' },
                { model: Student, as: 'students', through: { attributes: ['status', 'term'] } },
            ],
        });
        if (!course) return res.status(404).json({ error: 'Course not found' });
        res.json(course);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/courses/:id/roster — Get enrolled students
router.get('/:id/roster', authenticate, authorize('admin', 'faculty', 'staff'), async (req, res) => {
    try {
        const enrollments = await Enrollment.findAll({
            where: { courseId: req.params.id, status: 'active' },
            include: [{ model: Student, as: 'student' }],
        });
        res.json(enrollments.map(e => e.student));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/courses
router.post('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const course = await Course.create(req.body);
        res.status(201).json(course);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/courses/:id
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found' });
        await course.update(req.body);
        res.json(course);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/courses/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ error: 'Course not found' });
        await course.destroy();
        res.json({ message: 'Course deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
