import { Op } from "sequelize";
import express from 'express';
import { body, validationResult } from 'express-validator';
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

// GET /api/fees/defaulters — Admin portal: List overdue fees
// NOTE: Named routes MUST be registered before parameterized routes
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

// GET /api/fees/:studentId/summary — PARAM ROUTES AFTER NAMED ROUTES
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

// Validation for fee creation
const validateFee = [
    body('studentId').isInt().withMessage('Student ID must be an integer'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('dueDate').isISO8601().withMessage('Valid dueDate is required'),
    body('type').optional().isString(),
    body('status').optional().isIn(['pending', 'partial', 'paid', 'overdue']),
];

// POST /api/fees — Create a fee
router.post('/', authenticate, authorize('admin', 'staff'), validateFee, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: errors.array()
            });
        }

        const { studentId, amount, dueDate, type, status, description } = req.body;
        const fee = await Fee.create({ studentId, amount, dueDate, type, status, description });
        res.status(201).json(fee);
    } catch (err) {
        next(err);
    }
});

// PUT /api/fees/:id
router.put('/:id', authenticate, authorize('admin', 'staff'), validateFee, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: errors.array()
            });
        }

        const fee = await Fee.findByPk(req.params.id);
        if (!fee) {
            return res.status(404).json({
                error: 'Fee not found',
                code: 'FEE_NOT_FOUND'
            });
        }
        const allowedFields = ['amount', 'dueDate', 'type', 'status', 'description'];
        const updates = Object.fromEntries(
            Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
        );
        await fee.update(updates);
        res.json(fee);
    } catch (err) {
        next(err);
    }
});

// Validation for payment
const validatePayment = [
    body('feeId').isInt().withMessage('Fee ID must be an integer'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('method').optional().isString(),
    body('transactionId').optional().trim().escape(),
    body('remarks').optional().trim().escape(),
];

// POST /api/fees/payment — Record a payment
router.post('/payment', authenticate, validatePayment, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: errors.array()
            });
        }

        const { feeId, amount, method, transactionId, remarks } = req.body;

        const fee = await Fee.findByPk(feeId);
        if (!fee) {
            return res.status(404).json({
                error: 'Fee not found',
                code: 'FEE_NOT_FOUND'
            });
        }

        const remaining = fee.amount - fee.paidAmount;
        if (amount > remaining) {
            return res.status(400).json({
                error: `Payment exceeds remaining balance of ${remaining}`,
                code: 'PAYMENT_EXCEEDS_REMAINING'
            });
        }

        const payment = await Payment.create({
            feeId,
            studentId: fee.studentId,
            amount,
            paymentDate: new Date().toISOString().split('T')[0],
            method: method || 'online',
            transactionId,
            remarks,
        });

        // Update fee record
        const newPaid = fee.paidAmount + amount;
        const newStatus = newPaid >= fee.amount ? 'paid' : 'partial';
        await fee.update({ paidAmount: newPaid, status: newStatus });

        res.status(201).json({ payment, fee: await Fee.findByPk(feeId) });
    } catch (err) {
        next(err);
    }
});

// /defaulters and /stats moved above /:studentId/summary (BUG-01 fix)

export default router;
