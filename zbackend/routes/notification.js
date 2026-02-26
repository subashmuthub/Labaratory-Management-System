const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// POST create a test notification (for testing purposes)
router.post('/test', async (req, res) => {
    try {
        const notification = await notificationService.createTestNotification(req.user.id, req.body);
        res.json({
            success: true,
            message: 'Test notification created',
            data: notification
        });
    } catch (error) {
        console.error('Error creating test notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create test notification',
            error: error.message
        });
    }
});

// GET all notifications for the logged-in user
router.get('/', async (req, res) => {
    try {
        const result = await notificationService.getAllNotifications(req.user.id, req.query);
        res.json({
            success: true,
            data: result.notifications,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
});

// GET unread count
router.get('/unread/count', async (req, res) => {
    try {
        const count = await notificationService.getUnreadCount(req.user.id);
        res.json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unread count',
            error: error.message
        });
    }
});

// GET notification settings
router.get('/settings', async (req, res) => {
    try {
        const settings = await notificationService.getSettings(req.user.id);
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notification settings',
            error: error.message
        });
    }
});

// PUT update notification settings
router.put('/settings', async (req, res) => {
    try {
        const settings = await notificationService.updateSettings(req.user.id, req.body);
        res.json({
            success: true,
            message: 'Notification settings updated successfully',
            data: settings
        });
    } catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notification settings',
            error: error.message
        });
    }
});

// PUT mark notification as read
router.put('/:id/read', async (req, res) => {
    try {
        const notification = await notificationService.markAsRead(req.params.id, req.user.id);
        res.json({
            success: true,
            message: 'Notification marked as read',
            data: notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        if (error.message === 'Notification not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
});

// PUT mark all notifications as read
router.put('/read/all', async (req, res) => {
    try {
        await notificationService.markAllAsRead(req.user.id);
        res.json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: error.message
        });
    }
});

// DELETE notification
router.delete('/:id', async (req, res) => {
    try {
        await notificationService.deleteNotification(req.params.id, req.user.id);
        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        if (error.message === 'Notification not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message
        });
    }
});

module.exports = router;
