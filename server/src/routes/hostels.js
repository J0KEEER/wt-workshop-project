import express from 'express';
import { Hostel, Room, HostelAllocation, Student, User } from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import Fee from '../models/Fee.js';

const router = express.Router();

// Get all hostels and rooms (Admin/Faculty/Student)
router.get('/', authenticate, async (req, res) => {
    try {
        const hostels = await Hostel.findAll({
            include: [{
                model: Room,
                as: 'rooms',
                include: [{
                    model: HostelAllocation,
                    as: 'allocations',
                    include: [{ model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['name'] }] }]
                }]
            }]
        });
        res.json(hostels);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get student's allocation
router.get('/my-allocation', authenticate, async (req, res) => {
    try {
        const student = await Student.findOne({ where: { userId: req.user.id } });
        if (!student) return res.status(404).json({ message: 'Student profile not found' });

        const allocation = await HostelAllocation.findOne({
            where: { studentId: student.id, status: 'active' },
            include: [{ model: Room, as: 'room', include: [{ model: Hostel, as: 'hostel' }] }]
        });
        res.json(allocation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Allocate room (Admin only)
router.post('/allocate', authenticate, authorize('admin'), async (req, res) => {
    const { studentId, roomId, startDate, academicYear } = req.body;
    try {
        const room = await Room.findByPk(roomId);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        // Check capacity
        const activeAllocations = await HostelAllocation.count({ where: { roomId, status: 'active' } });
        if (activeAllocations >= room.capacity) {
            return res.status(400).json({ message: 'Room is at full capacity' });
        }

        const allocation = await HostelAllocation.create({
            studentId,
            roomId,
            startDate,
            academicYear,
            status: 'active'
        });

        // Generate Fee Entry
        if (room.monthlyFee > 0) {
            await Fee.create({
                studentId,
                title: `Hostel Fee - ${room.roomNumber}`,
                description: `Monthly accommodation fee for Room ${room.roomNumber} (${room.type})`,
                amount: room.monthlyFee,
                dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                status: 'pending',
                category: 'hostel'
            });
        }

        res.status(201).json(allocation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Vacate room
router.delete('/allocate/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const allocation = await HostelAllocation.findByPk(req.params.id);
        if (!allocation) return res.status(404).json({ message: 'Allocation not found' });

        allocation.status = 'vacated';
        allocation.endDate = new Date();
        await allocation.save();

        res.json({ message: 'Room vacated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
