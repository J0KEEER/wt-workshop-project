import express from 'express';
import { User, Student, Faculty } from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/admin/approvals - List pending users
router.get('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const pending = await User.findAll({
            where: { isApproved: false },
            attributes: { exclude: ['passwordHash'] },
            order: [['createdAt', 'DESC']]
        });
        res.json(pending);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/admin/approvals/:id - Approve or Reject
router.patch('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { action } = req.body; // 'approve' or 'reject'
        const user = await User.findByPk(req.params.id);
        
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (action === 'approve') {
            await user.update({ isApproved: true });
            res.json({ message: 'User approved successfully' });
        } else if (action === 'reject') {
            await user.destroy();
            res.json({ message: 'User request rejected and deleted' });
        } else {
            res.status(400).json({ error: 'Invalid action' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/admin/approvals/count - Quick count for badge
router.get('/count', authenticate, authorize('admin'), async (req, res) => {
    try {
        const count = await User.count({ where: { isApproved: false } });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
