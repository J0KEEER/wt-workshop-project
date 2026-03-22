import { Op } from "sequelize";
import express from 'express';
import {  Student, Course, Enrollment, User, Department  } from '../models/index.js';
import {  authenticate, authorize  } from '../middleware/auth.js';

const router = express.Router();

// GET /api/students — List all students
router.get('/', authenticate, authorize('admin', 'faculty', 'staff'), async (req, res) => {
    try {
        const { department, semester, status, search } = req.query;
        const where = {};
        if (department) where.department = department;
        if (semester) where.semester = parseInt(semester);
        if (status) where.status = status;

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { rollNo: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
            ];
        }

        const students = await Student.findAll({
            where,
            include: [
                { model: Course, as: 'courses', through: { attributes: ['status', 'term'] } },
                { model: Department, as: 'departmentRef', attributes: ['name', 'code'] }
            ],
            order: [['name', 'ASC']],
        });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/students/:id — Get single student
router.get('/:id', authenticate, async (req, res) => {
    try {
        const student = await Student.findByPk(req.params.id, {
            include: [
                { model: Course, as: 'courses', through: { attributes: ['status', 'term'] } },
                { model: User, as: 'user', attributes: ['id', 'username', 'email', 'role'] },
            ],
        });
        if (!student) return res.status(404).json({ error: 'Student not found' });
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/students — Create student
router.post('/', authenticate, authorize('admin', 'staff'), async (req, res) => {
    try {
        const student = await Student.create(req.body);
        console.log(`[${new Date().toISOString()}] 👤 Student Created: ${student.name} (Roll: ${student.rollNo}) by User ID ${req.user.id}`);
        res.status(201).json(student);
    } catch (err) {
        console.error(`[${new Date().toISOString()}] ❌ Student Creation Failed:`, err.message);
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/students/:id — Update student
router.put('/:id', authenticate, authorize('admin', 'staff'), async (req, res) => {
    try {
        const student = await Student.findByPk(req.params.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });
        
        const oldData = { ...student.toJSON() };
        await student.update(req.body);
        
        console.log(`[${new Date().toISOString()}] 📝 Student Updated: ${student.name} (ID: ${student.id}) by User ID ${req.user.id}`);
        console.log(`   Changes:`, req.body);
        
        res.json(student);
    } catch (err) {
        console.error(`[${new Date().toISOString()}] ❌ Student Update Failed (ID: ${req.params.id}):`, err.message);
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/students/:id — Delete student
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const student = await Student.findByPk(req.params.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });
        
        const studentName = student.name;
        const studentRoll = student.rollNo;
        
        await student.destroy();
        console.log(`[${new Date().toISOString()}] 🗑️ Student Deleted: ${studentName} (Roll: ${studentRoll}) by User ID ${req.user.id}`);
        
        res.json({ message: 'Student deleted' });
    } catch (err) {
        console.error(`[${new Date().toISOString()}] ❌ Student Deletion Failed (ID: ${req.params.id}):`, err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/students/:id/enroll — Enroll student in a course
router.post('/:id/enroll', authenticate, authorize('admin', 'staff'), async (req, res) => {
    try {
        const { courseId, term } = req.body;
        const student = await Student.findByPk(req.params.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const course = await Course.findByPk(courseId);
        if (!course) return res.status(404).json({ error: 'Course not found' });

        // Check capacity
        const enrolledCount = await Enrollment.count({ where: { courseId, status: 'active' } });
        if (enrolledCount >= course.capacity) {
            return res.status(400).json({ error: 'Course is full' });
        }

        const enrollment = await Enrollment.create({
            studentId: student.id,
            courseId,
            term: term || '2024-Spring',
            enrollmentDate: new Date().toISOString().split('T')[0],
        });
        
        console.log(`[${new Date().toISOString()}] 📚 Student Enrolled: ${student.name} (ID: ${student.id}) in Subject ID ${courseId} by User ID ${req.user.id}`);
        
        res.status(201).json(enrollment);
    } catch (err) {
        console.error(`[${new Date().toISOString()}] ❌ Enrollment Failed (Student: ${req.params.id}, Subject: ${req.body.courseId}):`, err.message);
        res.status(400).json({ error: err.message });
    }
});

export default router;
