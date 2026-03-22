import { Op } from "sequelize";
import express from 'express';
import {  Student, Course, Faculty, Enrollment, Attendance, Exam, Fee, Book, BookLoan, User  } from '../models/index.js';
import {  authenticate, authorize  } from '../middleware/auth.js';
import {  sequelize  } from '../db.js';

const router = express.Router();

// GET /api/dashboard/stats — Aggregate dashboard statistics
router.get('/stats', authenticate, async (req, res) => {
    try {
        const totalStudents = await Student.count({ where: { status: 'active' } });
        const totalFaculty = await Faculty.count({ where: { status: 'active' } });
        const totalCourses = await Course.count({ where: { status: 'active' } });
        const totalBooks = await Book.count();

        // Today's attendance
        const today = new Date().toISOString().split('T')[0];
        const todayAttendance = await Attendance.findAll({ where: { date: today } });
        const presentToday = todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
        const attendanceRate = todayAttendance.length > 0 ? Math.round((presentToday / todayAttendance.length) * 100) : 0;

        // Fee collection
        const fees = await Fee.findAll();
        const totalFeeAmount = fees.reduce((acc, f) => acc + f.amount, 0);
        const totalCollected = fees.reduce((acc, f) => acc + f.paidAmount, 0);
        const pendingFees = totalFeeAmount - totalCollected;

        // Active book loans
        const activeLoans = await BookLoan.count({ where: { status: 'active' } });

        // Department-wise student count
        const departmentStats = await Student.findAll({
            attributes: [
                [sequelize.col('departmentRef.name'), 'department'],
                [sequelize.fn('COUNT', sequelize.col('Student.id')), 'count']
            ],
            where: { status: 'active' },
            include: [{ model: Department, as: 'departmentRef', attributes: [] }],
            group: ['department_id'],
            raw: true,
        });

        // Recent enrollments (last 5)
        const recentEnrollments = await Enrollment.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [
                { model: Student, as: 'student', attributes: ['id', 'rollNo', 'name'] },
                { model: Course, as: 'course', attributes: ['id', 'code', 'title'] },
            ],
        });

        // Monthly enrollment trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        res.json({
            overview: {
                totalStudents,
                totalFaculty,
                totalCourses,
                totalBooks,
                attendanceRate,
                totalFeeAmount,
                totalCollected,
                pendingFees,
                activeLoans,
            },
            departmentStats,
            recentEnrollments,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
