import express from 'express';
import { Holiday } from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// GET /api/holidays
router.get('/', async (req, res) => {
    try {
        const holidays = await Holiday.findAll({ order: [['date', 'ASC']] });
        res.json(holidays);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/holidays — Admin only
router.post('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const holiday = await Holiday.create(req.body);
        res.status(201).json(holiday);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/holidays/:id — Admin only
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const holiday = await Holiday.findByPk(req.params.id);
        if (!holiday) return res.status(404).json({ error: 'Holiday not found' });
        await holiday.destroy();
        res.json({ message: 'Holiday deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
