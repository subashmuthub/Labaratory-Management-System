const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const activityService = require('../services/activityService');

const router = express.Router();

// GET recent activities
router.get('/recent', authenticateToken, async (req, res) => {
    try {
        console.log('📋 Fetching recent activities');
        
        const limit = parseInt(req.query.limit) || 10;
        const days = parseInt(req.query.days) || 7;
        
        const activities = await activityService.getRecentActivities(limit, days);
        
        res.json({
            success: true,
            data: activities,
            metadata: {
                count: activities.length,
                limit: limit,
                period_days: days
            }
        });
    } catch (error) {
        console.error('💥 Error fetching recent activities:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent activities',
            error: error.message
        });
    }
});

// GET user activity history
router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
        console.log('📋 Fetching user activity history');
        
        const userId = parseInt(req.params.userId);
        const limit = parseInt(req.query.limit) || 20;
        
        // Users can only view their own activity unless they're admin/teacher
        if (req.user.userId !== userId && !['admin', 'teacher'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this user\'s activities'
            });
        }
        
        const activities = await activityService.getUserActivityHistory(userId, limit);
        
        res.json({
            success: true,
            data: activities,
            metadata: {
                count: activities.length,
                limit: limit,
                user_id: userId
            }
        });
    } catch (error) {
        console.error('💥 Error fetching user activities:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user activities',
            error: error.message
        });
    }
});

// GET activity statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        console.log('📊 Fetching activity statistics');
        
        const days = parseInt(req.query.days) || 7;
        const stats = await activityService.getActivityStats(days);
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('💥 Error fetching activity stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity statistics',
            error: error.message
        });
    }
});

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Activity routes are working!',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
