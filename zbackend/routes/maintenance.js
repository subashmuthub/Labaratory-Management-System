const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { createNotification } = require('../utils/notificationService');
const { authenticateToken } = require('../middleware/auth');
const { trackAccess } = require('./recentlyAccessed');

// Import models with error handling
let Maintenance, Equipment, User;

try {
    const models = require('../models');
    Maintenance = models.Maintenance || require('../models/Maintenance');
    Equipment = models.Equipment;
    User = models.User;
} catch (error) {
    console.error('Error importing models:', error);
    Maintenance = require('../models/Maintenance');
    try {
        Equipment = require('../models/Equipment');
        User = require('../models/User');
    } catch (e) {
        console.log('Some models not found, continuing without associations');
    }
}

// Apply authentication to all maintenance routes except test
router.use('/test', (req, res, next) => next()); // Skip auth for test endpoint
router.use(authenticateToken);

// Test route
router.get('/test', (req, res) => {
    console.log('🔧 Maintenance test endpoint hit');
    res.json({
        success: true,
        message: 'Maintenance API is working!',
        timestamp: new Date().toISOString(),
        availableEndpoints: {
            getAll: 'GET /api/maintenance',
            getById: 'GET /api/maintenance/:id',
            create: 'POST /api/maintenance',
            update: 'PUT /api/maintenance/:id',
            delete: 'DELETE /api/maintenance/:id',
            stats: 'GET /api/maintenance/stats/summary',
            upcoming: 'GET /api/maintenance/upcoming/week',
            overdue: 'GET /api/maintenance/overdue/list'
        }
    });
});

// GET maintenance statistics (for dashboard)
router.get('/stats', async (req, res) => {
    try {
        console.log('🔧 Fetching maintenance statistics for dashboard');

        const [scheduled, in_progress, completed, cancelled, overdue] = await Promise.all([
            Maintenance.count({ where: { status: 'scheduled' } }),
            Maintenance.count({ where: { status: 'in_progress' } }),
            Maintenance.count({ where: { status: 'completed' } }),
            Maintenance.count({ where: { status: 'cancelled' } }),
            Maintenance.count({ where: { status: 'overdue' } })
        ]);

        console.log('✅ Maintenance statistics calculated');

        res.json({
            success: true,
            data: {
                pending: scheduled + in_progress,
                scheduled,
                inProgress: in_progress,
                completed,
                cancelled,
                overdue,
                total: scheduled + in_progress + completed + cancelled + overdue
            }
        });
    } catch (error) {
        console.error('💥 Error fetching maintenance stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch maintenance statistics',
            error: error.message
        });
    }
});

// GET maintenance statistics
router.get('/stats/summary', async (req, res) => {
    try {
        console.log('🔧 Fetching maintenance statistics');

        const [scheduled, in_progress, completed, cancelled, overdue] = await Promise.all([
            Maintenance.count({ where: { status: 'scheduled' } }),
            Maintenance.count({ where: { status: 'in_progress' } }),
            Maintenance.count({ where: { status: 'completed' } }),
            Maintenance.count({ where: { status: 'cancelled' } }),
            Maintenance.count({ where: { status: 'overdue' } })
        ]);

        console.log('✅ Maintenance statistics calculated');

        res.json({
            success: true,
            data: {
                scheduled,
                inProgress: in_progress,
                completed,
                cancelled,
                overdue,
                total: scheduled + in_progress + completed + cancelled + overdue
            }
        });
    } catch (error) {
        console.error('💥 Error fetching maintenance stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch maintenance statistics',
            error: error.message
        });
    }
});

// GET upcoming maintenance
router.get('/upcoming/week', async (req, res) => {
    try {
        console.log('🔧 Fetching upcoming maintenance');
        const days = parseInt(req.query.days) || 7;

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        const upcomingMaintenance = await Maintenance.findAll({
            where: {
                scheduled_date: {
                    [Op.between]: [new Date(), endDate]
                },
                status: ['scheduled', 'in_progress']
            },
            order: [['scheduled_date', 'ASC']]
        });

        console.log(`✅ Found ${upcomingMaintenance.length} upcoming maintenance records`);

        res.json({
            success: true,
            data: upcomingMaintenance
        });
    } catch (error) {
        console.error('💥 Error fetching upcoming maintenance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch upcoming maintenance',
            error: error.message
        });
    }
});

// GET overdue maintenance
router.get('/overdue/list', async (req, res) => {
    try {
        console.log('🔧 Fetching overdue maintenance');

        const overdueMaintenance = await Maintenance.findAll({
            where: {
                scheduled_date: {
                    [Op.lt]: new Date()
                },
                status: ['scheduled', 'in_progress']
            },
            order: [['scheduled_date', 'ASC']]
        });

        console.log(`✅ Found ${overdueMaintenance.length} overdue maintenance records`);

        res.json({
            success: true,
            data: overdueMaintenance
        });
    } catch (error) {
        console.error('💥 Error fetching overdue maintenance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch overdue maintenance',
            error: error.message
        });
    }
});

// GET all maintenance records
router.get('/', async (req, res) => {
    try {
        console.log('🔧 Fetching all maintenance records');

        const {
            status,
            maintenance_type,
            equipment_name,
            priority,
            start_date,
            end_date,
            technician_id,
            page = 1,
            limit = 50
        } = req.query;

        // Build where clause
        const whereClause = {};

        if (status) whereClause.status = status;
        if (maintenance_type) whereClause.maintenance_type = maintenance_type;
        if (priority) whereClause.priority = priority;
        if (technician_id) whereClause.technician_id = technician_id;
        if (equipment_name) {
            whereClause.equipment_name = { [Op.like]: `%${equipment_name}%` };
        }
        if (start_date && end_date) {
            whereClause.scheduled_date = {
                [Op.between]: [start_date, end_date]
            };
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Try to get with associations, fallback without if they don't exist
        let maintenance;
        try {
            maintenance = await Maintenance.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: User,
                        as: 'technician',
                        attributes: ['id', 'name', 'email'],
                        required: false
                    },
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'name', 'email'],
                        required: false
                    },
                    {
                        model: Equipment,
                        as: 'equipment',
                        attributes: ['id', 'name', 'model', 'status'],
                        required: false
                    }
                ],
                order: [['scheduled_date', 'DESC']],
                limit: parseInt(limit),
                offset: offset
            });
        } catch (associationError) {
            console.log('⚠️ Associations not working, fetching without them');
            maintenance = await Maintenance.findAndCountAll({
                where: whereClause,
                order: [['scheduled_date', 'DESC']],
                limit: parseInt(limit),
                offset: offset
            });
        }

        console.log(`✅ Found ${maintenance.count} maintenance records`);

        res.json({
            success: true,
            data: maintenance.rows,
            pagination: {
                total: maintenance.count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(maintenance.count / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('💥 Error fetching maintenance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch maintenance records',
            error: error.message
        });
    }
});

// GET maintenance by ID
router.get('/:id', trackAccess('maintenance'), async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔧 Fetching maintenance record with ID: ${id}`);

        let maintenance;
        try {
            maintenance = await Maintenance.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: 'technician',
                        attributes: ['id', 'name', 'email', 'phone']
                    },
                    {
                        model: User,
                        as: 'creator',
                        attributes: ['id', 'name', 'email']
                    },
                    {
                        model: Equipment,
                        as: 'equipment',
                        attributes: ['id', 'name', 'model', 'status', 'serial_number']
                    }
                ]
            });
        } catch (associationError) {
            console.log('⚠️ Associations not working, fetching without them');
            maintenance = await Maintenance.findByPk(id);
        }

        if (!maintenance) {
            return res.status(404).json({
                success: false,
                message: 'Maintenance record not found'
            });
        }

        console.log('✅ Maintenance record found');

        res.json({
            success: true,
            data: maintenance
        });
    } catch (error) {
        console.error('💥 Error fetching maintenance by ID:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch maintenance record',
            error: error.message
        });
    }
});

// POST new maintenance record
router.post('/', async (req, res) => {
    try {
        console.log('🔧 Creating new maintenance record');
        console.log('Request body:', req.body);

        const {
            equipment,
            type,
            date,
            technician,
            description,
            estimatedCost,
            priority = 'medium',
            estimated_duration,
            equipment_id,
            technician_id,
            created_by
        } = req.body;

        // Validation
        if (!equipment && !equipment_id) {
            return res.status(400).json({
                success: false,
                message: 'Equipment name or equipment ID is required'
            });
        }

        if (!type || !date) {
            return res.status(400).json({
                success: false,
                message: 'Maintenance type and scheduled date are required'
            });
        }

        const maintenanceData = {
            equipment_name: equipment || 'Unknown Equipment',
            maintenance_type: type.toLowerCase(),
            scheduled_date: date,
            technician_name: technician || 'Unassigned',
            description: description || '',
            estimated_cost: parseFloat(estimatedCost) || 0,
            priority: priority.toLowerCase(),
            estimated_duration: estimated_duration ? parseInt(estimated_duration) : null,
            status: 'scheduled'
        };

        // Add optional foreign keys
        if (equipment_id) maintenanceData.equipment_id = equipment_id;
        if (technician_id) maintenanceData.technician_id = technician_id;
        if (created_by) maintenanceData.created_by = created_by;

        const newMaintenance = await Maintenance.create(maintenanceData);

        console.log('✅ Maintenance record created successfully:', newMaintenance.id);

        // Create notification for maintenance record
        try {
            await createNotification({
                user_id: req.user.userId,
                type: 'maintenance',
                title: 'Maintenance Scheduled',
                message: `Maintenance for ${maintenanceData.equipment_name} has been scheduled for ${new Date(date).toLocaleDateString()}.`,
                metadata: {
                    maintenance_id: newMaintenance.id,
                    equipment_name: maintenanceData.equipment_name,
                    maintenance_type: type,
                    scheduled_date: date,
                    priority: priority,
                    technician: technician || 'Unassigned'
                }
            });
            console.log('📧 Maintenance notification created for:', maintenanceData.equipment_name);
        } catch (notifError) {
            console.error('⚠️ Failed to create maintenance notification:', notifError.message);
        }

        // Try to fetch with associations, fallback without
        let maintenanceWithAssociations;
        try {
            maintenanceWithAssociations = await Maintenance.findByPk(newMaintenance.id, {
                include: [
                    {
                        model: User,
                        as: 'technician',
                        attributes: ['id', 'name', 'email']
                    },
                    {
                        model: Equipment,
                        as: 'equipment',
                        attributes: ['id', 'name', 'model']
                    }
                ]
            });
        } catch (associationError) {
            console.log('⚠️ Associations not working, returning basic record');
            maintenanceWithAssociations = newMaintenance;
        }

        res.status(201).json({
            success: true,
            data: maintenanceWithAssociations,
            message: 'Maintenance record created successfully'
        });
    } catch (error) {
        console.error('💥 Error creating maintenance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create maintenance record',
            error: error.message
        });
    }
});

// PUT update maintenance record
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🔧 Updating maintenance record with ID: ${id}`);

        const maintenance = await Maintenance.findByPk(id);

        if (!maintenance) {
            return res.status(404).json({
                success: false,
                message: 'Maintenance record not found'
            });
        }

        // Handle status changes
        if (req.body.status) {
            if (req.body.status === 'completed' && maintenance.status !== 'completed') {
                req.body.completed_at = new Date();
                req.body.actual_date = new Date();
            }
            if (req.body.status === 'in_progress' && maintenance.status === 'scheduled') {
                req.body.started_at = new Date();
            }
        }

        await maintenance.update(req.body);

        // Create notification for status changes
        if (req.body.status && req.body.status !== maintenance.status) {
            try {
                let notificationTitle = '';
                let notificationMessage = '';

                switch (req.body.status) {
                    case 'in_progress':
                        notificationTitle = 'Maintenance Started';
                        notificationMessage = `Maintenance for ${maintenance.equipment_name} has been started.`;
                        break;
                    case 'completed':
                        notificationTitle = 'Maintenance Completed';
                        notificationMessage = `Maintenance for ${maintenance.equipment_name} has been completed.`;
                        break;
                    case 'cancelled':
                        notificationTitle = 'Maintenance Cancelled';
                        notificationMessage = `Maintenance for ${maintenance.equipment_name} has been cancelled.`;
                        break;
                    default:
                        notificationTitle = 'Maintenance Status Updated';
                        notificationMessage = `Maintenance for ${maintenance.equipment_name} status has been updated to ${req.body.status}.`;
                }

                await createNotification({
                    user_id: req.user.userId,
                    type: 'maintenance',
                    title: notificationTitle,
                    message: notificationMessage,
                    metadata: {
                        maintenance_id: maintenance.id,
                        equipment_name: maintenance.equipment_name,
                        old_status: maintenance.status,
                        new_status: req.body.status,
                        maintenance_type: maintenance.maintenance_type
                    }
                });
                console.log('📧 Maintenance status notification created for:', maintenance.equipment_name);
            } catch (notifError) {
                console.error('⚠️ Failed to create maintenance status notification:', notifError.message);
            }
        }

        console.log('✅ Maintenance record updated successfully');

        // Try to fetch with associations, fallback without
        let updatedMaintenance;
        try {
            updatedMaintenance = await Maintenance.findByPk(id, {
                include: [
                    {
                        model: User,
                        as: 'technician',
                        attributes: ['id', 'name', 'email']
                    },
                    {
                        model: Equipment,
                        as: 'equipment',
                        attributes: ['id', 'name', 'model']
                    }
                ]
            });
        } catch (associationError) {
            console.log('⚠️ Associations not working, returning basic record');
            updatedMaintenance = await Maintenance.findByPk(id);
        }

        res.json({
            success: true,
            data: updatedMaintenance,
            message: 'Maintenance record updated successfully'
        });
    } catch (error) {
        console.error('💥 Error updating maintenance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update maintenance record',
            error: error.message
        });
    }
});

// DELETE maintenance record
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🗑️ Deleting maintenance record with ID: ${id}`);

        const maintenance = await Maintenance.findByPk(id);

        if (!maintenance) {
            return res.status(404).json({
                success: false,
                message: 'Maintenance record not found'
            });
        }

        await maintenance.destroy();

        console.log('✅ Maintenance record deleted successfully');

        res.json({
            success: true,
            message: 'Maintenance record deleted successfully',
            data: { id: parseInt(id) }
        });
    } catch (error) {
        console.error('💥 Error deleting maintenance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete maintenance record',
            error: error.message
        });
    }
});

module.exports = router;