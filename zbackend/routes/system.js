const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const systemService = require('../services/systemService');

const router = express.Router();

// GET system health
router.get('/health', authenticateToken, async (req, res) => {
    try {
        console.log('🏥 Checking system health');
        const healthData = await systemService.getSystemHealth();
        
        res.json({
            success: true,
            message: 'System health check completed',
            data: healthData
        });
    } catch (error) {
        console.error('💥 System health check failed:', error);
        res.status(500).json({
            success: false,
            message: 'System health check failed',
            error: error.message
        });
    }
});

// GET system metrics
router.get('/metrics', authenticateToken, async (req, res) => {
    try {
        console.log('📊 Fetching system metrics');
        const metrics = await systemService.getSystemMetrics();
        
        res.json({
            success: true,
            message: 'System metrics retrieved successfully',
            data: metrics
        });
    } catch (error) {
        console.error('💥 Error fetching system metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system metrics',
            error: error.message
        });
    }
});

// GET system alerts
router.get('/alerts', authenticateToken, async (req, res) => {
    try {
        console.log('🚨 Fetching system alerts');
        const limit = parseInt(req.query.limit) || 10;
        const alerts = await systemService.getSystemAlerts(limit);
        
        res.json({
            success: true,
            message: 'System alerts retrieved successfully',
            data: alerts
        });
    } catch (error) {
        console.error('💥 Error fetching system alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system alerts',
            error: error.message
        });
    }
});

// GET database stats
router.get('/database/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await systemService.getDatabaseStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching database stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch database statistics',
            error: error.message
        });
    }
});

// GET system config
router.get('/config', authenticateToken, async (req, res) => {
    try {
        const config = await systemService.getSystemConfig();
        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error fetching system config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system configuration',
            error: error.message
        });
    }
});

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'System routes are working!',
        timestamp: new Date().toISOString(),
        availableEndpoints: {
            health: 'GET /api/system/health',
            metrics: 'GET /api/system/metrics',
            alerts: 'GET /api/system/alerts',
            databaseStats: 'GET /api/system/database/stats',
            config: 'GET /api/system/config',
            test: 'GET /api/system/test'
        }
    });
});

module.exports = router;
