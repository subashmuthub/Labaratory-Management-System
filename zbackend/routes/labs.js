const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { trackAccess } = require('./recentlyAccessed');
const labService = require('../services/labService');

// GET lab statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await labService.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching lab stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch lab statistics',
            error: error.message
        });
    }
});

// GET all labs
router.get('/', async (req, res) => {
    try {
        const result = await labService.getAllLabs(req.query);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching labs:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// POST create new lab
router.post('/', authenticateToken, async (req, res) => {
    try {
        const lab = await labService.createLab(req.body, req.user.userId);
        res.status(201).json({
            success: true,
            data: lab,
            message: 'Lab created successfully'
        });
    } catch (error) {
        console.error('Error creating lab:', error);
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
            error: error.message
        });
    }
});

// PUT update lab by ID
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const lab = await labService.updateLab(req.params.id, req.body, req.user.userId);
        res.json({
            success: true,
            data: lab,
            message: 'Lab updated successfully'
        });
    } catch (error) {
        console.error('Error updating lab:', error);
        
        if (error.message === 'Lab not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
            error: error.message
        });
    }
});

// GET lab by ID
router.get('/:id', trackAccess, async (req, res) => {
    try {
        const lab = await labService.getLabById(req.params.id);
        res.json({
            success: true,
            data: lab
        });
    } catch (error) {
        console.error('Error fetching lab:', error);
        if (error.message === 'Lab not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// DELETE lab by ID (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await labService.deleteLab(req.params.id, req.user.userId);
        res.json({
            success: true,
            message: 'Lab deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting lab:', error);
        if (error.message === 'Lab not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;
