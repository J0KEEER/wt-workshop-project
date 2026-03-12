import { Op } from "sequelize";
import express from 'express';
import {  Fee, Payment, Student  } from '../models/index.js';
import {  authenticate, authorize  } from '../middleware/auth.js';

const router = express.Router();

// GET /api/fees — List all fees (admin) or filter by student
router.get('/', authenticate, async (req, res) => {
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
                { model: Payment, as: 'payments' },
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

export default router;
