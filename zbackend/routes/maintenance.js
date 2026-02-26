const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { trackAccess } = require('./recentlyAccessed');
const maintenanceService = require('../services/maintenanceService');

const router = express.Router();

// Apply authentication to all maintenance routes except test
router.use('/test', (req, res, next) => next()); // Skip auth for test endpoint
router.use(authenticateToken);

// Test route
router.get('/test', (req, res) => {
    console.log('🔧 Maintenance test endpoint hit');
    res.json({
        success: true,
        message: 'Maintenance API is working!',
        timestamp: new Date().toISOString(),
        availableEndpoints: {
            getAll: 'GET /api/maintenance',
            getById: 'GET /api/maintenance/:id',
            create: 'POST /api/maintenance',
            update: 'PUT /api/maintenance/:id',
            delete: 'DELETE /api/maintenance/:id',
            stats: 'GET /api/maintenance/stats/summary',
            upcoming: 'GET /api/maintenance/upcoming/week',
            overdue: 'GET /api/maintenance/overdue/list'
        }
    });
});

// GET maintenance statistics (for dashboard)
router.get('/stats', async (req, res) => {
    try {
        console.log('🔧 Fetching maintenance statistics for dashboard');
        const stats = await maintenanceService.getStats();
        console.log('✅ Maintenance statistics calculated');
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('💥 Error fetching maintenance stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch maintenance statistics',
            error: error.message
        });
    }
});

// GET maintenance statistics (alternative endpoint)
router.get('/stats/summary', async (req, res) => {
    try {
        console.log('🔧 Fetching maintenance statistics');
        const stats = await maintenanceService.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('💥 Error fetching maintenance stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch maintenance statistics',
            error: error.message
        });
    }
});

// GET upcoming maintenance (next 7 days)
router.get('/upcoming', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const maintenance = await maintenanceService.getUpcomingMaintenance(days);
        res.json({
            success: true,
            data: maintenance
        });
    } catch (error) {
        console.error('Error fetching upcoming maintenance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch upcoming maintenance',
            error: error.message
        });
    }
});

// GET upcoming maintenance for next week (alternative endpoint)
router.get('/upcoming/week', async (req, res) => {
    try {
        const maintenance = await maintenanceService.getUpcomingMaintenance(7);
        res.json({
            success: true,
            data: maintenance
        });
    } catch (error) {
        console.error('Error fetching upcoming maintenance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch upcoming maintenance',
            error: error.message
        });
    }
});

// GET overdue maintenance
router.get('/overdue', async (req, res) => {
    try {
        const maintenance = await maintenanceService.getOverdueMaintenance();
        res.json({
            success: true,
            data: maintenance
        });
    } catch (error) {
        console.error('Error fetching overdue maintenance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch overdue maintenance',
            error: error.message
        });
    }
});

// GET overdue maintenance (alternative endpoint)
router.get('/overdue/list', async (req, res) => {
    try {
        const maintenance = await maintenanceService.getOverdueMaintenance();
        res.json({
            success: true,
            data: maintenance
        });
    } catch (error) {
        console.error('Error fetching overdue maintenance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch overdue maintenance',
            error: error.message
        });
    }
});

// GET all maintenance records
router.get('/', async (req, res) => {
    try {
        console.log('🔧 Fetching maintenance records with filters:', req.query);
        
        const result = await maintenanceService.getAllMaintenance(req.query);
        res.json({
            success: true,
            data: result.maintenance,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('💥 Error fetching maintenance records:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch maintenance records',
            error: error.message
        });
    }
});

// GET maintenance record by ID
router.get('/:id', trackAccess, async (req, res) => {
    try {
        const maintenance = await maintenanceService.getMaintenanceById(req.params.id);
        res.json({
            success: true,
            data: maintenance
        });
    } catch (error) {
        console.error('Error fetching maintenance record:', error);
        if (error.message === 'Maintenance record not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to fetch maintenance record',
            error: error.message
        });
    }
});

// POST create new maintenance record
router.post('/', async (req, res) => {
    try {
        const maintenance = await maintenanceService.createMaintenance(req.body, req.user.userId);
        res.status(201).json({
            success: true,
            message: 'Maintenance record created successfully',
            data: maintenance
        });
    } catch (error) {
        console.error('Error creating maintenance record:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create maintenance record',
            error: error.message
        });
    }
});

// PUT update maintenance record
router.put('/:id', async (req, res) => {
    try {
        const maintenance = await maintenanceService.updateMaintenance(req.params.id, req.body, req.user.userId);
        res.json({
            success: true,
            message: 'Maintenance record updated successfully',
            data: maintenance
        });
    } catch (error) {
        console.error('Error updating maintenance record:', error);
        if (error.message === 'Maintenance record not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update maintenance record',
            error: error.message
        });
    }
});

// DELETE maintenance record
router.delete('/:id', async (req, res) => {
    try {
        await maintenanceService.deleteMaintenance(req.params.id);
        res.json({
            success: true,
            message: 'Maintenance record deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting maintenance record:', error);
        if (error.message === 'Maintenance record not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to delete maintenance record',
            error: error.message
        });
    }
});

module.exports = router;
