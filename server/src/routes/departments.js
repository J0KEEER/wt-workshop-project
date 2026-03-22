import { Op } from "sequelize";
import express from 'express';
import {  Department, Student, Faculty, Course  } from '../models/index.js';
import {  authenticate, authorize  } from '../middleware/auth.js';

const router = express.Router();

// GET /api/departments
router.get('/', authenticate, async (req, res) => {
    try {
        const { search } = req.query;
        const where = {};
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { code: { [Op.like]: `%${search}%` } },
            ];
        }
        const departments = await Department.findAll({ 
            where, 
            include: [
                { model: Student, as: 'students', attributes: ['id'] },
                { model: Faculty, as: 'faculty', attributes: ['id'] },
                { model: Course, as: 'courses', attributes: ['id'] },
            ],
            order: [['name', 'ASC']] 
        });
        
        // Transform to include counts
        const result = departments.map(d => ({
            ...d.toJSON(),
            studentCount: d.students?.length || 0,
            facultyCount: d.faculty?.length || 0,
            courseCount: d.courses?.length || 0,
        }));
        
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/departments/:id
router.get('/:id', authenticate, async (req, res) => {
    try {
        const dept = await Department.findByPk(req.params.id, {
            include: [
                { model: Student, as: 'students' },
                { model: Faculty, as: 'faculty' },
                { model: Course, as: 'courses' },
            ]
        });
        if (!dept) return res.status(404).json({ error: 'Department not found' });
        res.json(dept);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/departments
router.post('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const dept = await Department.create(req.body);
        res.status(201).json(dept);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/departments/:id
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const dept = await Department.findByPk(req.params.id);
        if (!dept) return res.status(404).json({ error: 'Department not found' });
        
        const oldName = dept.name;
        await dept.update(req.body);
        const newName = dept.name;

        // Synchronize legacy department string in related models if name changed
        if (oldName !== newName) {
            await Promise.all([
                Student.update({ department: newName }, { where: { departmentId: dept.id } }),
                Faculty.update({ department: newName }, { where: { departmentId: dept.id } }),
                Course.update({ department: newName }, { where: { departmentId: dept.id } }),
            ]);
            console.log(`[${new Date().toISOString()}] 🔄 Sync: Department renamed "${oldName}" -> "${newName}". Updated all related records.`);
        }

        res.json(dept);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/departments/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const dept = await Department.findByPk(req.params.id);
        if (!dept) return res.status(404).json({ error: 'Department not found' });
        await dept.destroy();
        res.json({ message: 'Department deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
