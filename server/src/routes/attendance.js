import { Op } from "sequelize";
import express from 'express';
import {  Attendance, Student, Course, Enrollment  } from '../models/index.js';
import {  authenticate, authorize  } from '../middleware/auth.js';
import {  sequelize  } from '../db.js';

const router = express.Router();

// GET /api/attendance — List attendance (filter by date, courseId, studentId)
router.get('/', authenticate, async (req, res) => {
    try {
        const { date, courseId, studentId, startDate, endDate } = req.query;
        const where = {};
        if (date) where.date = date;
        if (courseId) where.courseId = parseInt(courseId);
        if (studentId) where.studentId = parseInt(studentId);
        if (startDate && endDate) {
            where.date = { [Op.between]: [startDate, endDate] };
        }

        const records = await Attendance.findAll({
            where,
            include: [
                { model: Student, as: 'student', attributes: ['id', 'rollNo', 'name'] },
                { model: Course, as: 'course', attributes: ['id', 'code', 'title'] },
            ],
            order: [['date', 'DESC'], ['studentId', 'ASC']],
        });
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/attendance — Bulk mark attendance for a course on a date
router.post('/', authenticate, authorize('admin', 'faculty'), async (req, res) => {
    try {
        const { courseId, date, records } = req.body;
        // records = [{ studentId, status }]
        if (!courseId || !date || !records || !records.length) {
            return res.status(400).json({ error: 'courseId, date, and records are required' });
        }

        // Delete existing records for this date/course, then bulk create
        await Attendance.destroy({ where: { courseId, date } });

        const entries = records.map(r => ({
            studentId: r.studentId,
            courseId,
            date,
            status: r.status || 'present',
            markedBy: req.user.id,
            remarks: r.remarks || null,
        }));

        const created = await Attendance.bulkCreate(entries);
        res.status(201).json(created);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /api/attendance/report — Attendance summary per student for a course
router.get('/report', authenticate, async (req, res) => {
    try {
        const { courseId, studentId } = req.query;
        const where = {};
        if (courseId) where.courseId = parseInt(courseId);
        if (studentId) where.studentId = parseInt(studentId);

        const records = await Attendance.findAll({ where });

        // Group by student
        const report = {};
        records.forEach(r => {
            const key = r.studentId;
            if (!report[key]) report[key] = { studentId: key, total: 0, present: 0, absent: 0, late: 0, excused: 0 };
            report[key].total++;
            report[key][r.status]++;
        });

        // Calculate percentage
        Object.values(report).forEach(r => {
            r.percentage = r.total > 0 ? Math.round(((r.present + r.late) / r.total) * 100) : 0;
        });

        res.json(Object.values(report));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
