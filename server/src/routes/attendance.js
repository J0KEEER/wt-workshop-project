import { Op } from "sequelize";
import express from 'express';
import { AttendanceSession, AttendanceRecord, Student, Course, Faculty } from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { sequelize } from '../db.js';

const router = express.Router();

// GET /api/attendance/suggest - determine current scheduled class
router.get('/suggest', authenticate, async (req, res) => {
    try {
        const { Faculty, Course, Timetable } = await import('../models/index.js');
        
        if (req.user.role !== 'faculty') return res.json(null);
        
        const faculty = await Faculty.findOne({ where: { userId: req.user.id } });
        if (!faculty) return res.status(404).json({ error: 'Faculty profile not found' });

        const now = new Date();
        const dayOfWeek = now.getDay(); // 0-6
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${hours}:${minutes}`;

        // Find timetable entry that overlaps with current time
        const suggestion = await Timetable.findOne({
            where: {
                dayOfWeek,
                startTime: { [Op.lte]: currentTime },
                endTime: { [Op.gte]: currentTime }
            },
            include: [{
                model: Course,
                as: 'course',
                required: true,
                include: [{
                    model: Faculty,
                    as: 'faculties',
                    where: { id: faculty.id },
                    through: { attributes: [] }
                }]
            }]
        });

        if (!suggestion) return res.json(null);

        // Helper to map time to Period name if period isn't in DB
        const getPeriodName = (time) => {
            const h = parseInt(time.split(':')[0]);
            if (h < 10) return 'Period 1';
            if (h < 11) return 'Period 2';
            if (h < 12) return 'Period 3';
            if (h < 13) return 'Period 4';
            if (h < 15) return 'Period 5';
            if (h < 16) return 'Period 6';
            return 'Afternoon';
        };

        res.json({
            courseId: suggestion.course.id,
            courseTitle: suggestion.course.title,
            courseCode: suggestion.course.code,
            startTime: suggestion.startTime,
            endTime: suggestion.endTime,
            period: getPeriodName(suggestion.startTime),
            isLive: true
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/attendance - fetch sessions with nested records
router.get('/', authenticate, async (req, res) => {
    try {
        const { date, courseId, startDate, endDate } = req.query;
        const where = {};
        if (date) where.date = date;
        if (courseId) where.courseId = parseInt(courseId);
        if (startDate && endDate) {
            where.date = { [Op.between]: [startDate, endDate] };
        }

        const sessions = await AttendanceSession.findAll({
            where,
            include: [
                { model: Course, as: 'course', attributes: ['id', 'code', 'title'] },
                { 
                    model: AttendanceRecord, 
                    as: 'records',
                    include: [{ model: Student, as: 'student', attributes: ['id', 'rollNo', 'name'] }]
                }
            ],
            order: [['date', 'DESC']],
        });
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/attendance/session - create or get attendance session
router.post('/session', authenticate, authorize('admin', 'faculty'), async (req, res) => {
    try {
        const { courseId, date, period } = req.body;
        if (!courseId || !date || !period) {
            return res.status(400).json({ error: 'courseId, date, period required' });
        }
        
        let session = await AttendanceSession.findOne({ where: { courseId, date, period } });
        if (!session) {
            let teacherId = null;
            if (req.user.role === 'faculty') {
                const faculty = await Faculty.findOne({ where: { userId: req.user.id } });
                if (faculty) teacherId = faculty.id;
            }

            session = await AttendanceSession.create({
                courseId, date, period, teacherId
            });
        }
        
        // Return session with its existing records if any
        session = await AttendanceSession.findByPk(session.id, {
            include: [{ model: AttendanceRecord, as: 'records' }]
        });
        
        res.status(201).json(session);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/attendance/save - bulk save records for a session
router.post('/save', authenticate, authorize('admin', 'faculty'), async (req, res) => {
    try {
        const { sessionId, records } = req.body;
        if (!sessionId || !records || !records.length) {
            return res.status(400).json({ error: 'sessionId and records required' });
        }
        
        // Quick verification session exists
        const session = await AttendanceSession.findByPk(sessionId);
        if (!session) return res.status(404).json({ error: 'Session not found' });
        
        // Delete old and recreate
        await AttendanceRecord.destroy({ where: { sessionId } });
        
        const entries = records.map(r => ({
            sessionId,
            studentId: r.studentId,
            status: r.status || 'present',
            remarks: r.remarks || null
        }));
        
        const created = await AttendanceRecord.bulkCreate(entries);
        res.status(201).json({ message: "Attendance saved successfully", records: created });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /api/attendance/student/:studentId
router.get('/student/:studentId', authenticate, async (req, res) => {
    try {
        const studentId = parseInt(req.params.studentId);
        const records = await AttendanceRecord.findAll({
            where: { studentId },
            include: [{
                model: AttendanceSession,
                as: 'session',
                include: [{ model: Course, as: 'course', attributes: ['id', 'code', 'title'] }]
            }]
        });
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/attendance/report - percentage calculated per student
router.get('/report', authenticate, async (req, res) => {
    try {
        const { courseId, studentId } = req.query;
        const sessionWhere = {};
        if (courseId) sessionWhere.courseId = parseInt(courseId);
        
        const recordWhere = {};
        if (studentId) recordWhere.studentId = parseInt(studentId);
        
        const sessions = await AttendanceSession.findAll({
             where: sessionWhere,
             include: [{
                 model: AttendanceRecord,
                 as: 'records',
                 where: Object.keys(recordWhere).length > 0 ? recordWhere : undefined,
                 required: false
             }]
        });
        
        const report = {};
        sessions.forEach(session => {
             session.records.forEach(r => {
                 const key = r.studentId;
                 if (!report[key]) report[key] = { studentId: key, total: 0, present: 0, absent: 0, late: 0, excused: 0 };
                 report[key].total++;
                 report[key][r.status]++;
             });
        });
        
        Object.values(report).forEach(r => {
             r.percentage = r.total > 0 ? Math.round(((r.present + r.late) / r.total) * 100) : 0;
        });
        
        res.json(Object.values(report));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
