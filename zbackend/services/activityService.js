// Activity Service - Business Logic Layer
const { User, Booking, Equipment, Lab, Incident, Maintenance } = require('../models');
const { Op } = require('sequelize');

class ActivityService {
    /**
     * Get recent activities
     */
    async getRecentActivities(limit = 10, days = 7) {
        const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const activities = [];

        // Recent bookings
        const recentBookings = await Booking.findAll({
            where: {
                created_at: { [Op.gte]: daysAgo }
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['name', 'email']
                },
                {
                    model: Lab,
                    as: 'lab',
                    attributes: ['name']
                },
                {
                    model: Equipment,
                    as: 'equipment',
                    attributes: ['name']
                }
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit)
        });

        recentBookings.forEach(booking => {
            activities.push({
                id: `booking_${booking.id}`,
                type: 'booking',
                description: `New booking created for ${booking.lab?.name || booking.equipment?.name || 'resource'}`,
                user_name: booking.user?.name || 'Unknown User',
                user_email: booking.user?.email,
                created_at: booking.created_at,
                details: {
                    booking_id: booking.id,
                    resource: booking.lab?.name || booking.equipment?.name,
                    purpose: booking.purpose,
                    status: booking.status
                }
            });
        });

        // Recent incidents
        const recentIncidents = await Incident.findAll({
            where: {
                created_at: { [Op.gte]: daysAgo }
            },
            include: [
                {
                    model: User,
                    as: 'incidentReporter',
                    attributes: ['name', 'email']
                },
                {
                    model: Equipment,
                    as: 'relatedEquipment',
                    attributes: ['name']
                }
            ],
            order: [['created_at', 'DESC']],
            limit: 5
        });

        recentIncidents.forEach(incident => {
            activities.push({
                id: `incident_${incident.id}`,
                type: 'incident',
                description: `Incident reported: ${incident.title}`,
                user_name: incident.incidentReporter?.name || 'Unknown User',
                user_email: incident.incidentReporter?.email,
                created_at: incident.created_at,
                details: {
                    incident_id: incident.id,
                    title: incident.title,
                    priority: incident.priority,
                    status: incident.status,
                    equipment: incident.relatedEquipment?.name
                }
            });
        });

        // Recent maintenance
        const recentMaintenance = await Maintenance.findAll({
            where: {
                created_at: { [Op.gte]: daysAgo }
            },
            include: [
                {
                    model: Equipment,
                    as: 'equipment',
                    attributes: ['name']
                },
                {
                    model: User,
                    as: 'technician',
                    attributes: ['name', 'email']
                }
            ],
            order: [['created_at', 'DESC']],
            limit: 5
        });

        recentMaintenance.forEach(maintenance => {
            activities.push({
                id: `maintenance_${maintenance.id}`,
                type: 'maintenance',
                description: `Maintenance scheduled: ${maintenance.title}`,
                user_name: maintenance.technician?.name || 'System',
                user_email: maintenance.technician?.email,
                created_at: maintenance.created_at,
                details: {
                    maintenance_id: maintenance.id,
                    title: maintenance.title,
                    equipment: maintenance.equipment?.name,
                    scheduled_date: maintenance.scheduled_date,
                    status: maintenance.status
                }
            });
        });

        // Sort all activities by created_at and limit
        activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return activities.slice(0, parseInt(limit));
    }

    /**
     * Get user activity history
     */
    async getUserActivityHistory(userId, limit = 20) {
        const activities = [];

        // User's bookings
        const userBookings = await Booking.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Lab,
                    as: 'lab',
                    attributes: ['name']
                },
                {
                    model: Equipment,
                    as: 'equipment',
                    attributes: ['name']
                }
            ],
            order: [['created_at', 'DESC']],
            limit: 10
        });

        userBookings.forEach(booking => {
            activities.push({
                id: `booking_${booking.id}`,
                type: 'booking',
                description: `Booked ${booking.lab?.name || booking.equipment?.name}`,
                created_at: booking.created_at,
                details: {
                    booking_id: booking.id,
                    resource: booking.lab?.name || booking.equipment?.name,
                    status: booking.status
                }
            });
        });

        // User's incidents
        const userIncidents = await Incident.findAll({
            where: { reported_by: userId },
            include: [
                {
                    model: Equipment,
                    as: 'relatedEquipment',
                    attributes: ['name']
                }
            ],
            order: [['created_at', 'DESC']],
            limit: 10
        });

        userIncidents.forEach(incident => {
            activities.push({
                id: `incident_${incident.id}`,
                type: 'incident',
                description: `Reported incident: ${incident.title}`,
                created_at: incident.created_at,
                details: {
                    incident_id: incident.id,
                    title: incident.title,
                    status: incident.status,
                    equipment: incident.relatedEquipment?.name
                }
            });
        });

        // Sort and limit
        activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return activities.slice(0, parseInt(limit));
    }

    /**
     * Get activity statistics
     */
    async getActivityStats(days = 7) {
        const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const [bookingsCount, incidentsCount, maintenanceCount] = await Promise.all([
            Booking.count({ where: { created_at: { [Op.gte]: daysAgo } } }),
            Incident.count({ where: { created_at: { [Op.gte]: daysAgo } } }),
            Maintenance.count({ where: { created_at: { [Op.gte]: daysAgo } } })
        ]);

        return {
            period_days: days,
            total_activities: bookingsCount + incidentsCount + maintenanceCount,
            bookings: bookingsCount,
            incidents: incidentsCount,
            maintenance: maintenanceCount
        };
    }
}

module.exports = new ActivityService();
