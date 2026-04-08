import { Op } from "sequelize";
import express from 'express';
import { body, validationResult } from 'express-validator';
import {  Exam, ExamResult, Course, Student  } from '../models/index.js';
import {  authenticate, authorize  } from '../middleware/auth.js';

const router = express.Router();

// GET /api/exams
router.get('/', authenticate, async (req, res) => {
    try {
        const { courseId, type } = req.query;
        const where = {};
        if (courseId) where.courseId = parseInt(courseId);
        if (type) where.type = type;

        const exams = await Exam.findAll({
            where,
            include: [{ model: Course, as: 'course', attributes: ['id', 'code', 'title'] }],
            order: [['date', 'DESC']],
        });
        res.json(exams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/exams/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const exam = await Exam.findByPk(req.params.id, {
            include: [
                { model: Course, as: 'course' },
                { model: ExamResult, as: 'results', include: [{ model: Student, as: 'student', attributes: ['id', 'rollNo', 'name'] }] },
            ],
        });
        if (!exam) return res.status(404).json({ error: 'Exam not found' });
        res.json(exam);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Validation for exam creation/update
const validateExam = [
    body('courseId').isInt().withMessage('Course ID must be an integer'),
    body('title').notEmpty().trim().escape(),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('type').optional().isString(),
    body('maxMarks').optional().isFloat({ min: 0 }).withMessage('Max marks must be positive'),
    body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be positive integer'),
];

// Helper to check past date
const validateNotPastDate = (req, res, next) => {
    const examDate = new Date(req.body.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(examDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format', code: 'INVALID_DATE' });
    }
    if (examDate < today) {
        return res.status(400).json({ error: 'Cannot schedule exam in the past', code: 'DATE_IN_PAST' });
    }
    next();
};

// POST /api/exams
router.post('/', authenticate, authorize('admin', 'faculty'), validateExam, validateNotPastDate, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: errors.array()
            });
        }

        const exam = await Exam.create(req.body);
        res.status(201).json(exam);
    } catch (err) {
        next(err);
    }
});

// PUT /api/exams/:id
router.put('/:id', authenticate, authorize('admin', 'faculty'), validateExam, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: errors.array()
            });
        }

        const exam = await Exam.findByPk(req.params.id);
        if (!exam) {
            return res.status(404).json({
                error: 'Exam not found',
                code: 'EXAM_NOT_FOUND'
            });
        }
        await exam.update(req.body);
        res.json(exam);
    } catch (err) {
        next(err);
    }
});

// DELETE /api/exams/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const exam = await Exam.findByPk(req.params.id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });
        await exam.destroy();
        res.json({ message: 'Exam deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/exams/:id/results — Bulk submit grades
router.post('/:id/results', authenticate, authorize('admin', 'faculty'), async (req, res) => {
    try {
        const { results } = req.body;
        // results = [{ studentId, marksObtained, grade, remarks }]
        if (!results || !results.length) {
            return res.status(400).json({ error: 'Results array is required' });
        }

        const exam = await Exam.findByPk(req.params.id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        // Delete existing results and re-create
        await ExamResult.destroy({ where: { examId: exam.id } });

        const entries = results.map(r => {
            // Auto-calculate grade
            const pct = (r.marksObtained / exam.totalMarks) * 100;
            let grade = r.grade;
            if (!grade) {
                if (pct >= 90) grade = 'A+';
                else if (pct >= 80) grade = 'A';
                else if (pct >= 70) grade = 'B+';
                else if (pct >= 60) grade = 'B';
                else if (pct >= 50) grade = 'C';
                else if (pct >= 40) grade = 'D';
                else grade = 'F';
            }
            return { examId: exam.id, studentId: r.studentId, marksObtained: r.marksObtained, grade, remarks: r.remarks };
        });

        const created = await ExamResult.bulkCreate(entries);
        res.status(201).json(created);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /api/exams/:id/results
router.get('/:id/results', authenticate, async (req, res) => {
    try {
        const results = await ExamResult.findAll({
            where: { examId: req.params.id },
            include: [{ model: Student, as: 'student', attributes: ['id', 'rollNo', 'name'] }],
            order: [['marksObtained', 'DESC']],
        });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/exams/:id/enrollment — Fetch all students enrolled in the course associated with this exam
router.get('/:id/enrollment', authenticate, authorize('admin', 'faculty'), async (req, res) => {
    try {
        const exam = await Exam.findByPk(req.params.id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        const students = await Student.findAll({
            include: [{
                model: Course,
                as: 'courses',
                where: { id: exam.courseId },
                attributes: []
            }],
            attributes: ['id', 'rollNo', 'name']
        });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/exams/:id/analytics
router.get('/:id/analytics', authenticate, authorize('admin', 'faculty'), async (req, res) => {
    try {
        const exam = await Exam.findByPk(req.params.id, {
            include: [{ model: ExamResult, as: 'results', include: [{ model: Student, as: 'student', attributes: ['name', 'rollNo'] }] }]
        });
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        const results = exam.results || [];
        if (results.length === 0) {
            return res.json({
                summary: { totalStudents: 0, averageMarks: 0, passPercentage: 0, highestScore: 0, lowestScore: 0 },
                distribution: [],
                topPerformers: []
            });
        }

        const totalStudents = results.length;
        const totalMarksSum = results.reduce((sum, r) => sum + r.marksObtained, 0);
        const averageMarks = (totalMarksSum / totalStudents).toFixed(2);
        
        const marks = results.map(r => r.marksObtained);
        const highestScore = Math.max(...marks);
        const lowestScore = Math.min(...marks);
        
        const passedCount = results.filter(r => (r.marksObtained / exam.totalMarks) * 100 >= 40).length;
        const passPercentage = ((passedCount / totalStudents) * 100).toFixed(2);

        // Grade Distribution
        const grades = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
        results.forEach(r => {
            if (grades[r.grade] !== undefined) grades[r.grade]++;
            else grades['F']++;
        });

        const distribution = Object.entries(grades).map(([name, value]) => ({ name, value }));

        // Top 5
        const topPerformers = results
            .sort((a, b) => b.marksObtained - a.marksObtained)
            .slice(0, 5)
            .map(r => ({
                name: r.student.name,
                rollNo: r.student.rollNo,
                marks: r.marksObtained,
                grade: r.grade
            }));

        const atRisk = results
            .filter(r => r.grade === 'F' || r.grade === 'D')
            .map(r => ({
                name: r.student.name,
                rollNo: r.student.rollNo,
                grade: r.grade
            }));

        res.json({
            summary: { totalStudents, averageMarks, passPercentage, highestScore, lowestScore },
            distribution,
            topPerformers,
            atRisk
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
