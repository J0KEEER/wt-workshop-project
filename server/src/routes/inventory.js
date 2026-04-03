import express from 'express';
import { Asset, MaintenanceRequest, AssetBooking, User, Room } from '../models/index.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// === Assets ===

// Get all assets
router.get('/', authenticate, async (req, res) => {
    try {
        const assets = await Asset.findAll({
            include: [
                { model: Room, as: 'room' },
                { model: MaintenanceRequest, as: 'maintenanceHistory', limit: 5, order: [['createdAt', 'DESC']] }
            ]
        });
        res.json(assets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch assets' });
    }
});

// Create new asset (Admin/Staff only)
router.post('/', authenticate, authorize('admin', 'staff'), async (req, res) => {
    try {
        const asset = await Asset.create(req.body);
        res.status(201).json(asset);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Failed to create asset' });
    }
});

// Update asset
router.put('/:id', authenticate, authorize('admin', 'staff'), async (req, res) => {
    try {
        const asset = await Asset.findByPk(req.params.id);
        if (!asset) return res.status(404).json({ error: 'Asset not found' });
        await asset.update(req.body);
        res.json(asset);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Failed to update asset' });
    }
});

// === Maintenance Requests ===

// Get all maintenance requests
router.get('/maintenance', authenticate, async (req, res) => {
    try {
        const requests = await MaintenanceRequest.findAll({
            include: [
                { model: Asset, as: 'asset' },
                { model: User, as: 'reporter', attributes: ['id', 'username', 'firstName', 'lastName'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch maintenance requests' });
    }
});

// Report an issue
router.post('/maintenance', authenticate, async (req, res) => {
    try {
        const { assetId, issue, priority } = req.body;
        const request = await MaintenanceRequest.create({
            assetId,
            issue,
            priority,
            reportedBy: req.user.id,
            status: 'Pending'
        });

        // Automatically mark asset as 'maintenance' if priority is Critical/High
        if (['Critical', 'High'].includes(priority)) {
            await Asset.update({ status: 'maintenance' }, { where: { id: assetId } });
        }

        res.status(201).json(request);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Failed to report issue' });
    }
});

// Resolve maintenance
router.put('/maintenance/:id/resolve', authenticate, authorize('admin', 'staff'), async (req, res) => {
    try {
        const request = await MaintenanceRequest.findByPk(req.params.id);
        if (!request) return res.status(404).json({ error: 'Request not found' });

        await request.update({
            status: 'Resolved',
            resolvedBy: req.user.id,
            resolutionDate: new Date(),
            ...req.body // cost, etc.
        });

        // Set asset back to available
        await Asset.update({ 
            status: 'available', 
            lastServiceDate: new Date(),
            condition: req.body.condition || 'Good'
        }, { where: { id: request.assetId } });

        res.json(request);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Failed to resolve request' });
    }
});

// === Bookings ===

// Get bookings
router.get('/bookings', authenticate, async (req, res) => {
    try {
        const bookings = await AssetBooking.findAll({
            include: [
                { model: Asset, as: 'asset' },
                { model: User, as: 'user', attributes: ['id', 'username', 'firstName', 'lastName'] }
            ]
        });
        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Create booking
router.post('/bookings', authenticate, async (req, res) => {
    try {
        const { assetId, startTime, endTime, purpose } = req.body;

        // Check availability
        const asset = await Asset.findByPk(assetId);
        if (asset.status !== 'available') {
            return res.status(400).json({ error: 'Asset is not available for booking' });
        }

        const booking = await AssetBooking.create({
            assetId,
            userId: req.user.id,
            startTime,
            endTime,
            purpose,
            status: 'Confirmed'
        });

        await asset.update({ status: 'in_use' });

        res.status(201).json(booking);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Failed to create booking' });
    }
});

export default router;
