const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const incidentService = require('../services/incidentService');

const router = express.Router();

// Validation middleware
const validateIncident = [
    body('title').notEmpty().trim().isLength({ max: 200 }).withMessage('Title is required and must be less than 200 characters'),
    body('description').notEmpty().trim().isLength({ max: 2000 }).withMessage('Description is required and must be less than 2000 characters'),
    body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority level'),
    body('category').isIn(['malfunction', 'damage', 'safety', 'maintenance', 'other']).withMessage('Invalid category'),
    body('location').optional({ checkFalsy: true }).trim().isLength({ max: 200 }).withMessage('Location must be less than 200 characters'),
    body('equipment_id').optional({ checkFalsy: true }).isInt().withMessage('Invalid equipment ID'),
    body('assigned_to').optional({ checkFalsy: true }).isInt().withMessage('Invalid assigned user ID')
];

// Test route (public)
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Incidents routes are working!',
        timestamp: new Date().toISOString()
    });
});

// Apply authentication to all routes below
router.use(authenticateToken);

// GET incident statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await incidentService.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching incident stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch incident statistics',
            error: error.message
        });
    }
});

// GET incident statistics (alternative endpoint)
router.get('/stats/overview', async (req, res) => {
    try {
        const stats = await incidentService.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching incident stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch incident statistics',
            error: error.message
        });
    }
});

// GET recent incidents
router.get('/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const incidents = await incidentService.getRecentIncidents(limit);
        res.json({
            success: true,
            data: incidents
        });
    } catch (error) {
        console.error('Error fetching recent incidents:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent incidents',
            error: error.message
        });
    }
});

// GET critical incidents
router.get('/critical', async (req, res) => {
    try {
        const incidents = await incidentService.getCriticalIncidents();
        res.json({
            success: true,
            data: incidents
        });
    } catch (error) {
        console.error('Error fetching critical incidents:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch critical incidents',
            error: error.message
        });
    }
});

// GET all incidents
router.get('/', async (req, res) => {
    try {
        console.log('🔍 Fetching incidents for user:', req.user.email, 'Role:', req.user.role);
        
        const result = await incidentService.getAllIncidents(req.query);
        res.json({
            success: true,
            data: result.incidents,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error fetching incidents:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch incidents',
            error: error.message
        });
    }
});

// GET incident by ID
router.get('/:id', async (req, res) => {
    try {
        const incident = await incidentService.getIncidentById(req.params.id);
        res.json({
            success: true,
            data: incident
        });
    } catch (error) {
        console.error('Error fetching incident:', error);
        if (error.message === 'Incident not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to fetch incident',
            error: error.message
        });
    }
});

// POST create new incident
router.post('/', validateIncident, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const incident = await incidentService.createIncident(req.body, req.user.userId);
        res.status(201).json({
            success: true,
            message: 'Incident reported successfully',
            data: incident
        });
    } catch (error) {
        console.error('Error creating incident:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create incident',
            error: error.message
        });
    }
});

// PUT update incident
router.put('/:id', validateIncident, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const incident = await incidentService.updateIncident(req.params.id, req.body, req.user.userId);
        res.json({
            success: true,
            message: 'Incident updated successfully',
            data: incident
        });
    } catch (error) {
        console.error('Error updating incident:', error);
        if (error.message === 'Incident not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update incident',
            error: error.message
        });
    }
});

// DELETE incident
router.delete('/:id', async (req, res) => {
    try {
        await incidentService.deleteIncident(req.params.id);
        res.json({
            success: true,
            message: 'Incident deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting incident:', error);
        if (error.message === 'Incident not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to delete incident',
            error: error.message
        });
    }
});

module.exports = router;
