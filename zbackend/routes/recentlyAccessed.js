const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const recentlyAccessedService = require('../services/recentlyAccessedService');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET recently accessed items
router.get('/', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const items = await recentlyAccessedService.getRecentlyAccessed(req.user.id, limit);
        
        res.json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Error fetching recently accessed items:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recently accessed items',
            error: error.message
        });
    }
});

// GET recently accessed items by type
router.get('/type/:type', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const items = await recentlyAccessedService.getByType(req.user.id, req.params.type, limit);
        
        res.json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Error fetching recently accessed items by type:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recently accessed items',
            error: error.message
        });
    }
});

// GET most accessed items
router.get('/most-accessed', async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const items = await recentlyAccessedService.getMostAccessed(req.user.id, limit);
        
        res.json({
            success: true,
            data: items
        });
    } catch (error) {
        console.error('Error fetching most accessed items:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch most accessed items',
            error: error.message
        });
    }
});

// POST track item access
router.post('/track', async (req, res) => {
    try {
        const { item_type, item_id, item_name, item_description } = req.body;
        
        if (!item_type || !item_id || !item_name) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: item_type, item_id, item_name'
            });
        }
        
        const record = await recentlyAccessedService.trackAccess(
            req.user.id,
            item_type,
            item_id,
            item_name,
            item_description
        );
        
        res.json({
            success: true,
            data: record
        });
    } catch (error) {
        console.error('Error tracking access:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track access',
            error: error.message
        });
    }
});

// DELETE clear old records
router.delete('/clear/old', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const deleted = await recentlyAccessedService.clearOldRecords(req.user.id, days);
        
        res.json({
            success: true,
            message: `Cleared ${deleted} old records`,
            deleted
        });
    } catch (error) {
        console.error('Error clearing old records:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear old records',
            error: error.message
        });
    }
});

// DELETE clear all records
router.delete('/clear/all', async (req, res) => {
    try {
        const deleted = await recentlyAccessedService.clearAll(req.user.id);
        
        res.json({
            success: true,
            message: `Cleared all recently accessed records`,
            deleted
        });
    } catch (error) {
        console.error('Error clearing all records:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear records',
            error: error.message
        });
    }
});

// Middleware to track item access - exported for use in other routes
const trackAccess = (req, res, next) => {
    (async () => {
        try {
            if (req.user && req.params.id) {
                const itemId = req.params.id;
                const userId = req.user.id;
                
                // Determine item type from route path
                const path = req.baseUrl + req.path;
                let itemType = 'equipment'; // default
                
                if (path.includes('/labs')) itemType = 'lab';
                else if (path.includes('/bookings')) itemType = 'booking';
                else if (path.includes('/maintenance')) itemType = 'maintenance';
                else if (path.includes('/users')) itemType = 'user';
                else if (path.includes('/equipment')) itemType = 'equipment';
                
                // Get item details
                const { itemName, itemDescription } = await recentlyAccessedService.getItemDetailsForTracking(itemType, itemId);
                
                // Track access in background (don't wait)
                recentlyAccessedService.trackAccess(userId, itemType, itemId, itemName, itemDescription)
                    .catch(err => console.error('Background access tracking error:', err));
            }
        } catch (error) {
            console.error('Error in trackAccess middleware:', error);
        }
        next();
    })();
};

module.exports = {
    router,
    trackAccess
};
