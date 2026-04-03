import express from 'express';
import { Op } from 'sequelize';
import { User, Faculty, LeaveRequest, Payroll, Course, Timetable } from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/personnel/staff — Admin only: List all non-student users with their salary/profile info
router.get('/staff', authenticate, authorize('admin', 'staff'), async (req, res) => {
    try {
        const staff = await User.findAll({
            where: { role: { [Op.notIn]: ['student'] } },
            attributes: ['id', 'username', 'email', 'role', 'firstName', 'lastName', 'isActive', 'baseSalary'],
            include: [
                { model: Faculty, as: 'facultyProfile', attributes: ['id', 'department', 'designation', 'status', 'baseSalary'] }
            ],
            order: [['lastName', 'ASC'], ['firstName', 'ASC']]
        });
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/personnel/staff/:id/salary — Admin only: Update base salary
router.post('/staff/:id/salary', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { baseSalary } = req.body;
        
        const user = await User.findByPk(id, {
            include: [{ model: Faculty, as: 'facultyProfile' }]
        });
        if (!user) return res.status(404).json({ error: 'User not found' });

        await user.update({ baseSalary });
        if (user.facultyProfile) {
            await user.facultyProfile.update({ baseSalary });
        }

        res.json({ message: 'Salary updated successfully', baseSalary });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /api/personnel/leaves — List leave requests (Admin/Staff see all relevant)
router.get('/leaves', authenticate, async (req, res) => {
    try {
        const where = {};
        if (req.user.role !== 'admin' && req.user.role !== 'staff') {
            where.userId = req.user.id;
        }

        const leaves = await LeaveRequest.findAll({
            where,
            include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'role'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/personnel/leaves — Submit a leave request
router.post('/leaves', authenticate, async (req, res) => {
    try {
        const { type, startDate, endDate, reason } = req.body;
        const leave = await LeaveRequest.create({
            userId: req.user.id,
            type,
            startDate,
            endDate,
            reason,
            status: 'pending'
        });

        // Emit notification for admins
        const io = req.app.get('io');
        if (io) {
            io.emit('dashboard:update', {
                type: 'LEAVE_REQUEST',
                message: `${req.user.firstName} requested ${type} leave`,
                payload: leave
            });
        }

        res.status(201).json(leave);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PATCH /api/personnel/leaves/:id — Admin only: Approve/Reject leave
router.patch('/leaves/:id', authenticate, authorize('admin', 'staff'), async (req, res) => {
    try {
        const { status, remarks } = req.body;
        const leave = await LeaveRequest.findByPk(req.params.id, {
            include: [{ model: User, as: 'user' }]
        });
        if (!leave) return res.status(404).json({ error: 'Leave request not found' });

        await leave.update({ 
            status, 
            remarks, 
            approverId: req.user.id 
        });

        // If leave is approved, we could potentially update Faculty status to 'on_leave'
        // based on temporal logic, but for now we just notify
        const io = req.app.get('io');
        if (io) {
            io.emit('dashboard:update', {
                type: 'LEAVE_STATUS',
                message: `Leave request for ${leave.user.firstName} was ${status}`,
                payload: leave
            });
        }

        res.json(leave);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/personnel/payroll/generate — Admin only: Monthly bulk generator
router.post('/payroll/generate', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { month, year } = req.body || { 
            month: new Date().getMonth() + 1, 
            year: new Date().getFullYear() 
        };

        const staff = await User.findAll({
            where: { role: { [Op.notIn]: ['student'] } }
        });

        const created = [];
        for (const user of staff) {
            // Basic logic: NetPay = BaseSalary (Add sophisticated logic later)
            // Skip if already generated
            const existing = await Payroll.findOne({ where: { userId: user.id, month, year } });
            if (existing) continue;

            const payroll = await Payroll.create({
                userId: user.id,
                month,
                year,
                baseSalary: user.baseSalary || 0,
                netPay: user.baseSalary || 0,
                status: 'draft'
            });
            created.push(payroll);
        }

        const io = req.app.get('io');
        if (io) {
            io.emit('dashboard:update', {
                type: 'PAYROLL_GENERATED',
                message: `Payroll for ${month}/${year} generated for ${created.length} staff members`
            });
        }

        res.json({ message: `Generated ${created.length} payroll records`, count: created.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/personnel/payroll/my-pay — List personal pay history
router.get('/payroll/my-pay', authenticate, async (req, res) => {
    try {
        const history = await Payroll.findAll({
            where: { userId: req.user.id },
            order: [['year', 'DESC'], ['month', 'DESC']]
        });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/personnel/schedule — Faculty only: Fetch current classes
router.get('/schedule', authenticate, authorize('faculty', 'admin'), async (req, res) => {
    try {
        const faculty = await Faculty.findOne({
            where: { userId: req.user.id },
            include: [
                {
                    model: Course,
                    as: 'courses',
                    include: [{ model: Timetable, as: 'schedule' }]
                }
            ]
        });

        if (!faculty) {
            return res.status(404).json({ error: 'Faculty profile not found' });
        }

        // Flatten the schedule and sort by time
        const fullSchedule = [];
        faculty.courses.forEach(course => {
            course.schedule.forEach(slot => {
                fullSchedule.push({
                    courseId: course.id,
                    courseName: course.name,
                    courseCode: course.code,
                    dayOfWeek: slot.dayOfWeek,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    room: slot.room
                });
            });
        });

        const today = new Date().getDay();
        const dailySchedule = fullSchedule
            .filter(s => s.dayOfWeek === today)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

        res.json({ day: today, schedule: dailySchedule, all: fullSchedule });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
