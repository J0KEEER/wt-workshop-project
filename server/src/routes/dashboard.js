import express from 'express';
import { Student, Course, Faculty, Enrollment, AttendanceSession, AttendanceRecord, Exam, Fee, Book, BookLoan, User, Department, Feedback, Timetable, CampusEvent, Holiday } from '../models/index.js';
import {  authenticate, authorize  } from '../middleware/auth.js';
import {  sequelize  } from '../db.js';
import { Op } from 'sequelize';

const router = express.Router();

// GET /api/dashboard/stats — Aggregate dashboard statistics
router.get('/stats', authenticate, async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        const totalStudents = await Student.count({ where: { status: 'active' } });
        const totalFaculty = await Faculty.count({ where: { status: 'active' } });
        const totalCourses = await Course.count({ where: { status: 'active' } });
        const totalBooks = await Book.count();

        // Attendance — prefer today, fall back to most recent weekday
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const dayOfWeek = today.getDay(); // 0-6

        let attendanceRate = 0;
        let attendanceDate = todayStr;

        let attendanceSessions = await AttendanceSession.findAll({ where: { date: todayStr }, include: [{model: AttendanceRecord, as: 'records'}] });
        // ... (existing fallback logic kept for admin but maybe tailored for user)
        if (attendanceSessions.length === 0) {
            const fallback = new Date();
            for (let i = 1; i <= 7; i++) {
                fallback.setDate(fallback.getDate() - 1);
                if (fallback.getDay() !== 0 && fallback.getDay() !== 6) {
                    const prevDate = fallback.toISOString().split('T')[0];
                    attendanceSessions = await AttendanceSession.findAll({ where: { date: prevDate }, include: [{model: AttendanceRecord, as: 'records'}] });
                    if (attendanceSessions.length > 0) {
                        attendanceDate = prevDate;
                        break;
                    }
                }
            }
        }
        if (attendanceSessions.length > 0) {
            let total = 0;
            let present = 0;
            attendanceSessions.forEach(session => {
                session.records.forEach(r => {
                    total++;
                    if (r.status === 'present' || r.status === 'late') present++;
                });
            });
            attendanceRate = total > 0 ? Math.round((present / total) * 100) : 0;
        }

        // Context-aware data
        let todaySchedule = [];
        let upcomingExams = [];

        if (role === 'student') {
            const student = await Student.findOne({ where: { userId } });
            if (student) {
                const enrollments = await Enrollment.findAll({ where: { studentId: student.id } });
                const courseIds = enrollments.map(e => e.courseId);
                
                todaySchedule = await Timetable.findAll({
                    where: { dayOfWeek, courseId: { [Op.in]: courseIds } },
                    include: [{ model: Course, as: 'course', attributes: ['title', 'code'] }],
                    order: [['startTime', 'ASC']]
                });

                upcomingExams = await Exam.findAll({
                    where: { 
                        courseId: { [Op.in]: courseIds },
                        date: { [Op.gte]: todayStr, [Op.lte]: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
                    },
                    include: [{ model: Course, as: 'course', attributes: ['title', 'code'] }],
                    order: [['date', 'ASC']]
                });
            }
        } else if (role === 'faculty') {
            const faculty = await Faculty.findOne({ where: { userId } });
            if (faculty) {
                const assignments = await sequelize.models.CourseFaculty.findAll({ where: { facultyId: faculty.id } });
                const courseIds = assignments.map(a => a.courseId);

                todaySchedule = await Timetable.findAll({
                    where: { dayOfWeek, courseId: { [Op.in]: courseIds } },
                    include: [{ model: Course, as: 'course', attributes: ['title', 'code'] }],
                    order: [['startTime', 'ASC']]
                });

                upcomingExams = await Exam.findAll({
                    where: { 
                        courseId: { [Op.in]: courseIds },
                        date: { [Op.gte]: todayStr, [Op.lte]: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
                    },
                    include: [{ model: Course, as: 'course', attributes: ['title', 'code'] }],
                    order: [['date', 'ASC']]
                });
            }
        }

        // Fee collection & other stats
        const feeAgg = await Fee.findOne({
            attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'totalFeeAmount'], [sequelize.fn('SUM', sequelize.col('paid_amount')), 'totalCollected']],
            raw: true,
        });
        const totalCollected = Number(feeAgg.totalCollected) || 0;
        const pendingFees = (Number(feeAgg.totalFeeAmount) || 0) - totalCollected;

        const departmentStats = await Student.findAll({
            attributes: [[sequelize.col('departmentRef.name'), 'department'], [sequelize.fn('COUNT', sequelize.col('Student.id')), 'count']],
            where: { status: 'active' },
            include: [{ model: Department, as: 'departmentRef', attributes: [] }],
            group: ['department_id'],
            raw: true,
        });

        const recentEnrollments = await Enrollment.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [{ model: Student, as: 'student', attributes: ['id', 'rollNo', 'name'] }, { model: Course, as: 'course', attributes: ['id', 'code', 'title'] }],
        });

        const feedbacks = await Feedback.findAll({ attributes: ['sentimentLabel', 'sentimentScore'] });
        const sentimentStats = {
            positive: feedbacks.filter(f => f.sentimentLabel === 'positive').length,
            negative: feedbacks.filter(f => f.sentimentLabel === 'negative').length,
            neutral: feedbacks.filter(f => f.sentimentLabel === 'neutral').length,
            avgScore: feedbacks.length > 0 ? Number((feedbacks.reduce((acc, f) => acc + f.sentimentScore, 0) / feedbacks.length).toFixed(2)) : 0
        };

        const upcomingEventsQuery = await CampusEvent.findAll({
            where: { date: { [Op.gte]: todayStr, [Op.lte]: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] } },
            limit: 10,
            order: [['date', 'ASC']]
        });

        const holidays = await Holiday.findAll({
            where: { date: { [Op.gte]: todayStr, [Op.lte]: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] } },
            limit: 10,
            order: [['date', 'ASC']]
        });

        const upcomingEvents = [
            ...upcomingEventsQuery.map(e => ({ ...e.toJSON(), isHoliday: false })),
            ...holidays.map(h => ({ ...h.toJSON(), isHoliday: true, type: 'holiday' }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5);

        res.json({
            overview: {
                totalStudents, totalFaculty, totalCourses, totalBooks,
                attendanceRate, attendanceDate, totalCollected, pendingFees,
                activeLoans: await BookLoan.count({ where: { status: 'active' } }),
                sentimentStats
            },
            departmentStats,
            recentEnrollments,
            sentimentStats,
            todaySchedule,
            upcomingExams,
            upcomingEvents
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
