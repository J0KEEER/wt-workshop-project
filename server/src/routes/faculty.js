import { Op } from "sequelize";
import express from 'express';
import { body, validationResult } from 'express-validator';
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

// Validation for faculty creation/update
const validateFaculty = [
    body('name').notEmpty().trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
    body('department').optional().isString(),
    body('designation').optional().isString(),
    body('status').optional().isIn(['active', 'inactive', 'on-leave']),
];

// POST /api/faculty
router.post('/', authenticate, authorize('admin'), validateFaculty, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: errors.array()
            });
        }

        const faculty = await Faculty.create(req.body);
        res.status(201).json(faculty);
    } catch (err) {
        next(err);
    }
});

// PUT /api/faculty/:id
router.put('/:id', authenticate, authorize('admin'), validateFaculty, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: errors.array()
            });
        }

        const faculty = await Faculty.findByPk(req.params.id);
        if (!faculty) {
            return res.status(404).json({
                error: 'Faculty not found',
                code: 'FACULTY_NOT_FOUND'
            });
        }
        await faculty.update(req.body);
        res.json(faculty);
    } catch (err) {
        next(err);
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

// GET /api/faculty/my-schedule — Full weekly timetable for logged-in faculty
router.get('/my-schedule', authenticate, async (req, res) => {
    try {
        const { id: userId } = req.user;
        const faculty = await Faculty.findOne({ where: { userId } });
        if (!faculty) return res.status(404).json({ error: 'Faculty profile not found' });

        const assignments = await CourseFaculty.findAll({ where: { facultyId: faculty.id } });
        const courseIds = assignments.map(a => a.courseId);

        const schedule = await Timetable.findAll({
            where: { courseId: { [Op.in]: courseIds } },
            include: [{ model: Course, as: 'course', attributes: ['id', 'code', 'title'] }],
            order: [['dayOfWeek', 'ASC'], ['startTime', 'ASC']]
        });

        res.json(schedule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
