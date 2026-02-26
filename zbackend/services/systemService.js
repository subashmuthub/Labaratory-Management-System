// System Service - Business Logic Layer
const { sequelize } = require('../config/database');
const { User, Equipment, Maintenance } = require('../models');
const { Op } = require('sequelize');

class SystemService {
    /**
     * Get system health status
     */
    async getSystemHealth() {
        try {
            // Check database connection
            await sequelize.authenticate();

            // Calculate uptime
            const uptimeSeconds = process.uptime();
            const uptimeHours = Math.floor(uptimeSeconds / 3600);
            const uptimeDays = Math.floor(uptimeHours / 24);
            const uptimeDisplay = uptimeDays > 0 
                ? `${uptimeDays}d ${uptimeHours % 24}h` 
                : `${uptimeHours}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`;

            // Get memory usage
            const memUsage = process.memoryUsage();
            const usedMemoryMB = Math.round(memUsage.heapUsed / 1024 / 1024);
            const totalMemoryMB = Math.round(memUsage.heapTotal / 1024 / 1024);

            return {
                server: 'online',
                database: 'connected',
                uptime: uptimeDisplay,
                memory: {
                    used: `${usedMemoryMB} MB`,
                    total: `${totalMemoryMB} MB`
                },
                cpu: {
                    usage: 'N/A'
                },
                lastBackup: new Date().toISOString(),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                server: 'error',
                database: 'disconnected',
                uptime: '0',
                lastBackup: null,
                timestamp: new Date().toISOString(),
                error: error.message
            };
        }
    }

    /**
     * Get system metrics
     */
    async getSystemMetrics() {
        const { User, Lab, Equipment, Booking, Incident, Maintenance, Order, Report } = require('../models');
        
        // Calculate uptime
        const uptimeSeconds = process.uptime();
        const uptimeHours = Math.floor(uptimeSeconds / 3600);
        const uptimeDays = Math.floor(uptimeHours / 24);
        const uptimeDisplay = uptimeDays > 0 
            ? `${uptimeDays}d ${uptimeHours % 24}h` 
            : `${uptimeHours}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`;
        
        // Get count statistics
        const [
            totalUsers,
            activeUsers,
            totalEquipment,
            availableEquipment,
            totalBookings,
            activeBookings,
            totalLabs,
            activeLabs,
            totalIncidents,
            totalMaintenance,
            totalReports,
            totalOrders
        ] = await Promise.all([
            User.count(),
            User.count({ where: { is_active: true } }),
            Equipment.count(),
            Equipment.count({ where: { status: 'available', is_active: true } }),
            Booking.count(),
            Booking.count({ where: { status: { [Op.in]: ['pending', 'confirmed'] } } }),
            Lab.count(),
            Lab.count({ where: { is_active: true } }),
            Incident.count(),
            Maintenance.count(),
            Report.count(),
            Order.count()
        ]);

        return {
            users: {
                total: totalUsers,
                active: activeUsers
            },
            equipment: {
                total: totalEquipment,
                available: availableEquipment
            },
            bookings: {
                total: totalBookings,
                active: activeBookings
            },
            labs: {
                total: totalLabs,
                active: activeLabs
            },
            incidents: {
                total: totalIncidents
            },
            maintenance: {
                total: totalMaintenance
            },
            reports: {
                total: totalReports
            },
            orders: {
                total: totalOrders
            },
            uptime: uptimeDisplay,
            activeUsers: activeUsers,
            systemLoad: Math.min(Math.round((totalBookings / (totalEquipment || 1)) * 100), 100),
            uptimeSeconds: Math.floor(uptimeSeconds),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get system alerts
     */
    async getSystemAlerts(limit = 10) {
        const alerts = [];
        let alertId = 1;

        // Check for equipment in maintenance
        const maintenanceEquipment = await Equipment.count({
            where: { status: 'maintenance' }
        });

        if (maintenanceEquipment > 0) {
            alerts.push({
                id: alertId++,
                type: 'warning',
                message: `${maintenanceEquipment} equipment item(s) currently in maintenance`,
                created_at: new Date().toISOString()
            });
        }

        // Check for broken equipment
        const brokenEquipment = await Equipment.count({
            where: { status: 'broken' }
        });

        if (brokenEquipment > 0) {
            alerts.push({
                id: alertId++,
                type: 'error',
                message: `${brokenEquipment} equipment item(s) marked as broken`,
                created_at: new Date().toISOString()
            });
        }

        // Check for overdue maintenance
        const now = new Date();
        const overdueMaintenance = await Maintenance.count({
            where: {
                status: 'scheduled',
                scheduled_date: { [Op.lt]: now }
            }
        });

        if (overdueMaintenance > 0) {
            alerts.push({
                id: alertId++,
                type: 'warning',
                message: `${overdueMaintenance} maintenance task(s) are overdue`,
                created_at: new Date().toISOString()
            });
        }

        // Add info alert if no issues
        if (alerts.length === 0) {
            alerts.push({
                id: alertId++,
                type: 'success',
                message: 'All systems operating normally',
                created_at: new Date().toISOString()
            });
        }

        return alerts.slice(0, parseInt(limit));
    }

    /**
     * Get database statistics
     */
    async getDatabaseStats() {
        const { User, Lab, Equipment, Booking, Incident, Maintenance, Order, Training } = require('../models');

        const [
            totalUsers,
            totalLabs,
            totalEquipment,
            totalBookings,
            totalIncidents,
            totalMaintenance,
            totalOrders,
            totalTrainings
        ] = await Promise.all([
            User.count(),
            Lab.count({ where: { is_active: true } }),
            Equipment.count({ where: { is_active: true } }),
            Booking.count(),
            Incident.count(),
            Maintenance.count(),
            Order.count(),
            Training.count({ where: { is_active: true } })
        ]);

        return {
            users: totalUsers,
            labs: totalLabs,
            equipment: totalEquipment,
            bookings: totalBookings,
            incidents: totalIncidents,
            maintenance: totalMaintenance,
            orders: totalOrders,
            trainings: totalTrainings,
            total_records: totalUsers + totalLabs + totalEquipment + totalBookings + totalIncidents + totalMaintenance + totalOrders + totalTrainings
        };
    }

    /**
     * Get system configuration
     */
    async getSystemConfig() {
        return {
            environment: process.env.NODE_ENV || 'development',
            nodeVersion: process.version,
            platform: process.platform,
            databaseDialect: sequelize.options.dialect,
            maxConnections: sequelize.options.pool?.max || 'N/A',
            timezone: process.env.TZ || 'UTC'
        };
    }
}

module.exports = new SystemService();
