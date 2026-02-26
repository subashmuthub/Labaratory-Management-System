const Notification = require('../models/Notification');
const NotificationSettings = require('../models/NotificationSettings');
const { createNotification } = require('../utils/notificationService');

class NotificationService {
    async getAllNotifications(userId, filters = {}) {
        const { page = 1, limit = 10, unread_only = false, type = null } = filters;
        const offset = (page - 1) * limit;

        const whereCondition = { user_id: userId };
        
        if (unread_only === 'true') {
            whereCondition.read = false;
        }
        
        if (type && type !== 'all') {
            whereCondition.type = type;
        }

        const notifications = await Notification.findAll({
            where: whereCondition,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const total = await Notification.count({
            where: whereCondition
        });

        return {
            notifications,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / limit),
                total_items: total,
                items_per_page: parseInt(limit)
            }
        };
    }

    async getUnreadCount(userId) {
        return await Notification.count({
            where: { user_id: userId, read: false }
        });
    }

    async markAsRead(notificationId, userId) {
        const notification = await Notification.findOne({
            where: { id: notificationId, user_id: userId }
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        notification.read = true;
        await notification.save();

        return notification;
    }

    async markAllAsRead(userId) {
        await Notification.update(
            { read: true },
            { where: { user_id: userId, read: false } }
        );
    }

    async deleteNotification(notificationId, userId) {
        const notification = await Notification.findOne({
            where: { id: notificationId, user_id: userId }
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        await notification.destroy();
    }

    async getSettings(userId) {
        let settings = await NotificationSettings.findOne({
            where: { user_id: userId }
        });

        if (!settings) {
            settings = await NotificationSettings.create({
                user_id: userId,
                email_notifications: true,
                push_notifications: true,
                booking_reminders: true,
                maintenance_alerts: true,
                incident_notifications: true
            });
        }

        return settings;
    }

    async updateSettings(userId, settingsData) {
        let settings = await NotificationSettings.findOne({
            where: { user_id: userId }
        });

        if (!settings) {
            settings = await NotificationSettings.create({
                user_id: userId,
                ...settingsData
            });
        } else {
            await settings.update(settingsData);
        }

        return settings;
    }

    async createTestNotification(userId, { title = 'Test Notification', message = 'This is a test notification', type = 'info' }) {
        return await createNotification(
            userId,
            type,
            title,
            message,
            'normal',
            userId
        );
    }
}

module.exports = new NotificationService();
