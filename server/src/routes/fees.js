import { Op } from "sequelize";
import express from 'express';
import {  Fee, Payment, Student  } from '../models/index.js';
import {  authenticate, authorize  } from '../middleware/auth.js';

const router = express.Router();

// GET /api/fees/my-fees — Student portal: List personal dues
router.get('/my-fees', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ error: 'Access restricted to students' });
        }
        const student = await Student.findOne({ where: { userId: req.user.id } });
        if (!student) return res.status(404).json({ error: 'Student profile not found' });

        const fees = await Fee.findAll({
            where: { studentId: student.id },
            order: [['dueDate', 'ASC']]
        });
        res.json(fees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/fees — List all fees (admin/staff)
router.get('/', authenticate, authorize('admin', 'staff'), async (req, res) => {
    try {
        const { studentId, status, type } = req.query;
        const where = {};
        if (studentId) where.studentId = parseInt(studentId);
        if (status) where.status = status;
        if (type) where.type = type;

        const fees = await Fee.findAll({
            where,
            include: [
                { model: Student, as: 'student', attributes: ['id', 'rollNo', 'name'] },
            ],
            order: [['dueDate', 'DESC']],
        });
        res.json(fees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/fees/:studentId/summary
router.get('/:studentId/summary', authenticate, async (req, res) => {
    try {
        const fees = await Fee.findAll({
            where: { studentId: req.params.studentId },
            include: [{ model: Payment, as: 'payments' }],
        });

        const summary = {
            totalFees: fees.reduce((acc, f) => acc + f.amount, 0),
            totalPaid: fees.reduce((acc, f) => acc + f.paidAmount, 0),
            totalPending: 0,
            feeCount: fees.length,
            paidCount: fees.filter(f => f.status === 'paid').length,
            pendingCount: fees.filter(f => f.status === 'pending' || f.status === 'overdue').length,
        };
        summary.totalPending = summary.totalFees - summary.totalPaid;

        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/fees — Create a fee
router.post('/', authenticate, authorize('admin', 'staff'), async (req, res) => {
    try {
        const fee = await Fee.create(req.body);
        res.status(201).json(fee);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/fees/:id
router.put('/:id', authenticate, authorize('admin', 'staff'), async (req, res) => {
    try {
        const fee = await Fee.findByPk(req.params.id);
        if (!fee) return res.status(404).json({ error: 'Fee not found' });
        await fee.update(req.body);
        res.json(fee);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/fees/payment — Record a payment
router.post('/payment', authenticate, async (req, res) => {
    try {
        const { feeId, amount, method, transactionId, remarks } = req.body;
        if (!feeId || !amount) return res.status(400).json({ error: 'feeId and amount are required' });

        const fee = await Fee.findByPk(feeId);
        if (!fee) return res.status(404).json({ error: 'Fee not found' });

        const remaining = fee.amount - fee.paidAmount;
        if (amount > remaining) {
            return res.status(400).json({ error: `Payment exceeds remaining balance of ${remaining}` });
        }

        const payment = await Payment.create({
            feeId, studentId: fee.studentId, amount,
            paymentDate: new Date().toISOString().split('T')[0],
            method: method || 'online', transactionId, remarks,
        });

        // Update fee record
        const newPaid = fee.paidAmount + amount;
        const newStatus = newPaid >= fee.amount ? 'paid' : 'partial';
        await fee.update({ paidAmount: newPaid, status: newStatus });

        res.status(201).json({ payment, fee: await Fee.findByPk(feeId) });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /api/fees/defaulters — Admin portal: List overdue fees
router.get('/defaulters', authenticate, authorize('admin', 'staff'), async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const overdue = await Fee.findAll({
            where: {
                [Op.or]: [
                    { status: 'overdue' },
                    { 
                        status: { [Op.ne]: 'paid' },
                        dueDate: { [Op.lt]: today }
                    }
                ]
            },
            include: [{ model: Student, as: 'student', attributes: ['id', 'name', 'rollNo'] }]
        });
        res.json(overdue);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/fees/stats — General financial dashboard data
router.get('/stats', authenticate, authorize('admin', 'staff'), async (req, res) => {
    try {
        const totalFees = await Fee.sum('amount') || 0;
        const totalCollected = await Fee.sum('paidAmount') || 0;
        const overdueCount = await Fee.count({ 
            where: { 
                [Op.or]: [
                    { status: 'overdue' },
                    { status: { [Op.ne]: 'paid' }, dueDate: { [Op.lt]: new Date().toISOString().split('T')[0] } }
                ]
            } 
        });
        
        res.json({
            totalFees,
            totalCollected,
            pendingAmount: totalFees - totalCollected,
            overdueCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
