import express from 'express';
import { Exam, ExamResult, Course, Student, Enrollment } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const GRADE_POINTS = {
    'A+': 4.0, 'A': 3.7, 'B+': 3.3, 'B': 3.0, 'C': 2.0, 'D': 1.0, 'F': 0.0
};

// GET /api/performance/my-results — Get all results for the logged-in student
router.get('/my-results', authenticate, async (req, res) => {
    try {
        const student = await Student.findOne({ where: { userId: req.user.id } });
        if (!student) return res.status(404).json({ error: 'Student profile not found' });

        const results = await ExamResult.findAll({
            where: { studentId: student.id },
            include: [
                { 
                    model: Exam, 
                    as: 'exam',
                    include: [{ model: Course, as: 'course', attributes: ['code', 'title', 'credits'] }]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/performance/summary — Grouped results and GPA
router.get('/summary', authenticate, async (req, res) => {
    try {
        const student = await Student.findOne({ where: { userId: req.user.id } });
        if (!student) return res.status(404).json({ error: 'Student profile not found' });

        const results = await ExamResult.findAll({
            where: { studentId: student.id },
            include: [
                { 
                    model: Exam, 
                    as: 'exam',
                    include: [{ model: Course, as: 'course' }]
                }
            ]
        });

        // Group by course to find "Final" or latest grade for GPA
        const courseGrades = {};
        results.forEach(r => {
            const courseId = r.exam.courseId;
            if (!courseGrades[courseId] || r.exam.type === 'final') {
                courseGrades[courseId] = {
                    grade: r.grade,
                    credits: r.exam.course.credits,
                    courseName: r.exam.course.title,
                    courseCode: r.exam.course.code
                };
            }
        });

        let totalPoints = 0;
        let totalCredits = 0;
        const subjectStrengths = [];

        Object.values(courseGrades).forEach(cg => {
            const points = GRADE_POINTS[cg.grade] || 0;
            totalPoints += points * cg.credits;
            totalCredits += cg.credits;
            subjectStrengths.push({ subject: cg.courseCode, score: points * 25 }); // 0-100 scale for radar
        });

        const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

        res.json({
            gpa,
            totalCredits,
            subjectStrengths,
            results: results.map(r => ({
                id: r.id,
                exam: r.exam.title,
                course: r.exam.course.code,
                marks: r.marksObtained,
                total: r.exam.totalMarks,
                grade: r.grade,
                date: r.exam.date
            }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
