import express from 'express';
import { CampusEvent } from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// GET /api/events
router.get('/', authenticate, async (req, res) => {
    try {
        const events = await CampusEvent.findAll({
            where: {
                date: { [Op.gte]: new Date().toISOString().split('T')[0] }
            },
            order: [['date', 'ASC']]
        });
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/events — Admin only
router.post('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const event = await CampusEvent.create(req.body);
        res.status(201).json(event);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/events/:id — Admin only
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const event = await CampusEvent.findByPk(req.params.id);
        if (!event) return res.status(404).json({ error: 'Event not found' });
        await event.destroy();
        res.json({ message: 'Event deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
