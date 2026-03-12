import { Op } from "sequelize";
import express from 'express';
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

// POST /api/exams
router.post('/', authenticate, authorize('admin', 'faculty'), async (req, res) => {
    try {
        // Validate date is not in the past
        const examDate = new Date(req.body.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (examDate < today) {
            return res.status(400).json({ error: 'Cannot schedule exam in the past' });
        }
        const exam = await Exam.create(req.body);
        res.status(201).json(exam);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/exams/:id
router.put('/:id', authenticate, authorize('admin', 'faculty'), async (req, res) => {
    try {
        const exam = await Exam.findByPk(req.params.id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });
        await exam.update(req.body);
        res.json(exam);
    } catch (err) {
        res.status(400).json({ error: err.message });
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

export default router;
