import { Op } from "sequelize";
import express from 'express';
import { body, validationResult } from 'express-validator';
import { Course, Faculty, Student, Enrollment, Department, Timetable } from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/courses
router.get('/', authenticate, async (req, res) => {
    try {
        const { department, semester, status, search, dayOfWeek } = req.query;
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

        const include = [
            { model: Faculty, as: 'faculties', attributes: ['id', 'name', 'department'] },
            { model: Department, as: 'departmentRef', attributes: ['name', 'code'] }
        ];

        if (dayOfWeek !== undefined) {
            include.push({
                model: Timetable,
                as: 'schedule',
                where: { dayOfWeek: parseInt(dayOfWeek) },
                required: true // Join to only show courses with this schedule
            });
        }

        const courses = await Course.findAll({
            where,
            include,
            order: [['title', 'ASC']],
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
                { model: Faculty, as: 'faculties' },
                { model: Student, as: 'students', through: { attributes: ['status', 'term'] } },
                { model: Timetable, as: 'schedule' }
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

// Validation for course creation/update
const validateCourse = [
    body('title').notEmpty().trim().escape(),
    body('code').notEmpty().trim().escape(),
    body('credits').optional().isInt({ min: 1, max: 10 }),
    body('department').optional().isString(),
    body('semester').optional().isInt({ min: 1, max: 10 }),
    body('capacity').optional().isInt({ min: 1 }),
    body('status').optional().isIn(['active', 'inactive', 'archived']),
    body('facultyIds').optional().isArray().withMessage('facultyIds must be an array')
];

// POST /api/courses
router.post('/', authenticate, authorize('admin'), validateCourse, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: errors.array()
            });
        }

        const { facultyIds, ...courseData } = req.body;
        const course = await Course.create(courseData);
        if (facultyIds && Array.isArray(facultyIds)) {
            await course.setFaculties(facultyIds);
        }
        res.status(201).json(course);
    } catch (err) {
        next(err);
    }
});

// PUT /api/courses/:id
router.put('/:id', authenticate, authorize('admin'), validateCourse, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: errors.array()
            });
        }

        const { facultyIds, ...courseData } = req.body;
        const course = await Course.findByPk(req.params.id);
        if (!course) {
            return res.status(404).json({
                error: 'Course not found',
                code: 'COURSE_NOT_FOUND'
            });
        }
        await course.update(courseData);
        if (facultyIds && Array.isArray(facultyIds)) {
            await course.setFaculties(facultyIds);
        }
        res.json(course);
    } catch (err) {
        next(err);
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
