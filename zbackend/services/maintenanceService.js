// Maintenance Service - Business Logic Layer
const { Maintenance, Equipment, User } = require('../models');
const { Op } = require('sequelize');
const { createNotification } = require('../utils/notificationService');

class MaintenanceService {
    /**
     * Get maintenance statistics
     */
    async getStats() {
        const [scheduled, in_progress, completed, cancelled, overdue] = await Promise.all([
            Maintenance.count({ where: { status: 'scheduled' } }),
            Maintenance.count({ where: { status: 'in_progress' } }),
            Maintenance.count({ where: { status: 'completed' } }),
            Maintenance.count({ where: { status: 'cancelled' } }),
            Maintenance.count({ where: { status: 'overdue' } })
        ]);

        return {
            pending: scheduled + in_progress,
            scheduled,
            inProgress: in_progress,
            completed,
            cancelled,
            overdue,
            total: scheduled + in_progress + completed + cancelled + overdue
        };
    }

    /**
     * Get all maintenance records with filters
     */
    async getAllMaintenance(filters = {}) {
        const {
            status,
            maintenance_type,
            equipment_id,
            page = 1,
            limit = 50,
            search,
            start_date,
            end_date
        } = filters;

        const whereClause = {};

        if (status && status !== 'all') whereClause.status = status;
        if (maintenance_type && maintenance_type !== 'all') whereClause.maintenance_type = maintenance_type;
        if (equipment_id) whereClause.equipment_id = equipment_id;

        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
                { notes: { [Op.like]: `%${search}%` } }
            ];
        }

        if (start_date || end_date) {
            whereClause.scheduled_date = {};
            if (start_date) whereClause.scheduled_date[Op.gte] = new Date(start_date);
            if (end_date) whereClause.scheduled_date[Op.lte] = new Date(end_date);
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { rows: maintenance, count: total } = await Maintenance.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Equipment,
                    as: 'equipment',
                    attributes: ['id', 'name', 'serial_number', 'category'],
                    required: false
                },
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
                }
            ],
            order: [['scheduled_date', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        return {
            maintenance,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        };
    }

    /**
     * Get maintenance by ID
     */
    async getMaintenanceById(id) {
        const maintenance = await Maintenance.findByPk(id, {
            include: [
                {
                    model: Equipment,
                    as: 'equipment',
                    attributes: ['id', 'name', 'serial_number', 'category', 'status'],
                    required: false
                },
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
                }
            ]
        });

        if (!maintenance) {
            throw new Error('Maintenance record not found');
        }

        return maintenance;
    }

    /**
     * Create maintenance record
     */
    async createMaintenance(maintenanceData, userId) {
        // Accept both frontend field names and direct model field names
        const equipment_name = maintenanceData.equipment_name || maintenanceData.equipment;
        const maintenance_type = maintenanceData.maintenance_type || maintenanceData.type || 'preventive';
        const scheduled_date = maintenanceData.scheduled_date || maintenanceData.date;
        const technician_name = maintenanceData.technician_name || maintenanceData.technician || 'Unassigned';
        const estimated_cost = maintenanceData.estimated_cost || maintenanceData.estimatedCost || 0;
        const { description, priority = 'medium', notes, equipment_id } = maintenanceData;

        // Validate required fields (equipment_name and scheduled_date are required by the DB schema)
        if (!equipment_name || !scheduled_date) {
            throw new Error('Equipment name and scheduled date are required');
        }

        const maintenance = await Maintenance.create({
            equipment_id: equipment_id ? parseInt(equipment_id) : null,
            equipment_name: equipment_name.trim(),
            maintenance_type,
            scheduled_date: new Date(scheduled_date),
            technician_name: technician_name.trim(),
            estimated_cost: parseFloat(estimated_cost) || 0,
            description: description?.trim() || null,
            notes: notes?.trim() || null,
            priority,
            status: 'scheduled',
            created_by: userId
        });

        // Create notification
        try {
            await createNotification({
                user_id: userId,
                type: 'maintenance',
                title: 'Maintenance Scheduled',
                message: `Maintenance for "${equipment_name}" scheduled on ${new Date(scheduled_date).toLocaleDateString()}.`,
                metadata: {
                    maintenance_id: maintenance.id,
                    equipment_name,
                    scheduled_date
                }
            });
        } catch (notifError) {
            console.error('⚠️ Failed to create maintenance notification:', notifError.message);
        }

        return maintenance;
    }


    /**
     * Update maintenance record
     */
    async updateMaintenance(id, updateData, userId) {
        const maintenance = await Maintenance.findByPk(id);

        if (!maintenance) {
            throw new Error('Maintenance record not found');
        }

        // Auto-update completion date if status changed to completed
        if (updateData.status === 'completed' && maintenance.status !== 'completed') {
            updateData.completed_date = new Date();
        }

        await maintenance.update(updateData);

        // Create notification for status change
        if (updateData.status && updateData.status !== maintenance.status) {
            try {
                await createNotification({
                    user_id: maintenance.assigned_to || userId,
                    type: 'maintenance',
                    title: 'Maintenance Status Updated',
                    message: `Maintenance "${maintenance.title}" status changed to ${updateData.status}.`,
                    metadata: {
                        maintenance_id: maintenance.id,
                        old_status: maintenance.status,
                        new_status: updateData.status
                    }
                });
            } catch (notifError) {
                console.error('⚠️ Failed to create status notification:', notifError.message);
            }
        }

        return await this.getMaintenanceById(id);
    }

    /**
     * Delete maintenance record
     */
    async deleteMaintenance(id) {
        const maintenance = await Maintenance.findByPk(id);

        if (!maintenance) {
            throw new Error('Maintenance record not found');
        }

        await maintenance.destroy();
        return { message: 'Maintenance record deleted successfully' };
    }

    /**
     * Get upcoming maintenance (next 7 days)
     */
    async getUpcomingMaintenance() {
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        const maintenance = await Maintenance.findAll({
            where: {
                status: { [Op.in]: ['scheduled', 'in_progress'] },
                scheduled_date: {
                    [Op.between]: [now, nextWeek]
                }
            },
            include: [
                {
                    model: Equipment,
                    as: 'equipment',
                    attributes: ['id', 'name', 'serial_number'],
                    required: false
                },
                {
                    model: User,
                    as: 'technician',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ],
            order: [['scheduled_date', 'ASC']],
            limit: 10
        });

        return maintenance;
    }

    /**
     * Get overdue maintenance
     */
    async getOverdueMaintenance() {
        const now = new Date();

        const maintenance = await Maintenance.findAll({
            where: {
                status: 'scheduled',
                scheduled_date: { [Op.lt]: now }
            },
            include: [
                {
                    model: Equipment,
                    as: 'equipment',
                    attributes: ['id', 'name', 'serial_number'],
                    required: false
                },
                {
                    model: User,
                    as: 'technician',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ],
            order: [['scheduled_date', 'ASC']]
        });

        return maintenance;
    }
}

module.exports = new MaintenanceService();
