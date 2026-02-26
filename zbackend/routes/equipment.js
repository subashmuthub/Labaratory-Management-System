const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { trackAccess } = require('./recentlyAccessed');
const equipmentService = require('../services/equipmentService');

router.use(authenticateToken);

// GET equipment statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await equipmentService.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching equipment stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch equipment statistics',
            error: error.message
        });
    }
});

// GET equipment status summary
router.get('/status-summary', async (req, res) => {
    try {
        const equipment = await equipmentService.getStatusSummary();
        res.json({
            success: true,
            data: equipment
        });
    } catch (error) {
        console.error('Error fetching equipment status summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch equipment status summary',
            error: error.message
        });
    }
});

// GET all equipment
router.get('/', async (req, res) => {
    try {
        const result = await equipmentService.getAllEquipment(req.query);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error fetching equipment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch equipment',
            error: error.message
        });
    }
});

// POST create new equipment
router.post('/', async (req, res) => {
    try {
        console.log('📝 Creating new equipment by user:', req.user.email);
        console.log('📝 Request body:', req.body);

        const equipment = await equipmentService.createEquipment(req.body, req.user.userId);

        res.status(201).json({
            success: true,
            data: { equipment },
            message: 'Equipment created successfully'
        });

    } catch (error) {
        console.error('Error creating equipment:', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors.map(e => e.message)
            });
        }

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'Serial number already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create equipment',
            error: error.message
        });
    }
});

// POST bulk import equipment (MUST be before /:id route)
router.post('/bulk-import', async (req, res) => {
    console.log('📦 Bulk import request received');
    console.log('User:', req.user?.email || 'Unknown');
    console.log('Body keys:', Object.keys(req.body));
    
    try {
        const { equipmentData } = req.body;
        const results = await equipmentService.bulkImportEquipment(equipmentData, req.user.userId);

        console.log('✅ Import completed:', results);
        
        return res.status(200).json({
            success: true,
            message: `Import completed. ${results.success} items imported successfully, ${results.failed} failed.`,
            data: results
        });

    } catch (error) {
        console.error('❌ Error in bulk import:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to process bulk import',
            error: error.message
        });
    }
});

// GET equipment by ID
router.get('/:id', trackAccess, async (req, res) => {
    try {
        const equipment = await equipmentService.getEquipmentById(req.params.id);
        res.json({
            success: true,
            data: { equipment }
        });
    } catch (error) {
        console.error('Error fetching equipment:', error);
        if (error.message === 'Equipment not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to fetch equipment',
            error: error.message
        });
    }
});

// PUT update equipment
router.put('/:id', async (req, res) => {
    try {
        const equipment = await equipmentService.updateEquipment(
            req.params.id,
            req.body,
            req.user.userId,
            req.user.role
        );

        res.json({
            success: true,
            data: { equipment },
            message: 'Equipment updated successfully'
        });
    } catch (error) {
        console.error('Error updating equipment:', error);
        if (error.message === 'Equipment not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        if (error.message.includes('permission')) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update equipment',
            error: error.message
        });
    }
});

// DELETE equipment
router.delete('/:id', async (req, res) => {
    try {
        await equipmentService.deleteEquipment(req.params.id, req.user.userId, req.user.role);
        res.json({
            success: true,
            message: 'Equipment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting equipment:', error);
        if (error.message === 'Equipment not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        if (error.message.includes('permission')) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to delete equipment',
            error: error.message
        });
    }
});

// DELETE bulk delete equipment by lab
router.delete('/lab/:labId/bulk', async (req, res) => {
    try {
        const result = await equipmentService.bulkDeleteByLab(req.params.labId, req.user.role);
        res.json({
            success: true,
            message: `Successfully deleted ${result.deletedCount} equipment items from ${result.labName}`,
            data: result
        });
    } catch (error) {
        console.error('Error bulk deleting equipment:', error);
        if (error.message.includes('administrator')) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
        if (error.message === 'Lab not found' || error.message === 'No equipment found in this lab') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to delete equipment',
            error: error.message
        });
    }
});

module.exports = router;
