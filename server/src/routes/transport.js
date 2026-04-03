import express from 'express';
import { TransportRoute, TransportStop, TransportSubscription, Vehicle, Student, User } from '../models/index.js';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import Fee from '../models/Fee.js';

const router = express.Router();

// Get all routes and stops (Admin/Faculty/Student)
router.get('/routes', authenticateToken, async (req, res) => {
    try {
        const routes = await TransportRoute.findAll({
            include: [{
                model: TransportStop,
                as: 'stops'
            }]
        });
        res.json(routes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get student's subscription
router.get('/my-subscription', authenticateToken, async (req, res) => {
    try {
        const student = await Student.findOne({ where: { userId: req.user.id } });
        if (!student) return res.status(404).json({ message: 'Student profile not found' });

        const subscription = await TransportSubscription.findOne({
            where: { studentId: student.id, status: 'active' },
            include: [{ model: TransportStop, as: 'stop', include: [{ model: TransportRoute, as: 'route' }] }, { model: Vehicle, as: 'vehicle' }]
        });
        res.json(subscription);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Subscribe to transport (Student only)
router.post('/subscribe', authenticateToken, authorizeRole(['student']), async (req, res) => {
    const { stopId, vehicleId, startDate } = req.body;
    try {
        const student = await Student.findOne({ where: { userId: req.user.id } });
        if (!student) return res.status(404).json({ message: 'Student profile not found' });

        const stop = await TransportStop.findByPk(stopId);
        if (!stop) return res.status(404).json({ message: 'Stop not found' });

        const subscription = await TransportSubscription.create({
            studentId: student.id,
            stopId,
            vehicleId,
            startDate,
            status: 'active'
        });

        // Generate Fee Entry
        if (stop.monthlyFee > 0) {
            await Fee.create({
                studentId: student.id,
                title: `Transport Fee - ${stop.stopName}`,
                description: `Monthly transport subscription for Stop: ${stop.stopName}`,
                amount: stop.monthlyFee,
                dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                status: 'pending',
                category: 'transport'
            });
        }

        res.status(201).json(subscription);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// List all vehicles (Admin)
router.get('/vehicles', authenticateToken, authorizeRole(['admin']), async (req, res) => {
    try {
        const vehicles = await Vehicle.findAll();
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
