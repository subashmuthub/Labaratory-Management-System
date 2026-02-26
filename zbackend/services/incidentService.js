// Incident Service - Business Logic Layer
const { Incident, User, Equipment } = require('../models');
const { Op } = require('sequelize');
const { createNotification } = require('../utils/notificationService');

class IncidentService {
    /**
     * Get incident statistics
     */
    async getStats() {
        const stats = await Incident.getStats();
        return stats;
    }

    /**
     * Get all incidents with filters
     */
    async getAllIncidents(filters = {}) {
        try {
            const {
                status,
                priority,
                category,
                assigned_to,
                reported_by,
                equipment_id,
                page = 1,
                limit = 100,
                search
            } = filters;

            const whereClause = {};

            if (status && status !== 'all') whereClause.status = status;
            if (priority && priority !== 'all') whereClause.priority = priority;
            if (category && category !== 'all') whereClause.category = category;
            if (assigned_to) whereClause.assigned_to = assigned_to;
            if (reported_by) whereClause.reported_by = reported_by;
            if (equipment_id) whereClause.equipment_id = equipment_id;

            if (search) {
                whereClause[Op.or] = [
                    { title: { [Op.like]: `%${search}%` } },
                    { description: { [Op.like]: `%${search}%` } },
                    { location: { [Op.like]: `%${search}%` } }
                ];
            }

            const offset = (parseInt(page) - 1) * parseInt(limit);

            const { rows: incidents, count: total } = await Incident.findAndCountAll({
                where: whereClause,
                include: [
                    {
                        model: Equipment,
                        as: 'relatedEquipment',
                        attributes: ['id', 'name', 'serial_number', 'category'],
                        required: false
                    },
                    {
                        model: User,
                        as: 'incidentReporter',
                        attributes: ['id', 'name', 'email'],
                        required: false
                    },
                    {
                        model: User,
                        as: 'incidentAssignee',
                        attributes: ['id', 'name', 'email'],
                        required: false
                    }
                ],
                order: [['created_at', 'DESC']],
                limit: parseInt(limit),
                offset: offset
            });

            return {
                incidents,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            };
        } catch (error) {
            console.error('❌ Error in getAllIncidents service:', error);
            throw new Error(`Failed to fetch incidents: ${error.message}`);
        }
    }

    /**
     * Get incident by ID
     */
    async getIncidentById(id) {
        const incident = await Incident.findByPk(id, {
            include: [
                {
                    model: Equipment,
                    as: 'relatedEquipment',
                    attributes: ['id', 'name', 'serial_number', 'category', 'status'],
                    required: false
                },
                {
                    model: User,
                    as: 'incidentReporter',
                    attributes: ['id', 'name', 'email'],
                    required: false
                },
                {
                    model: User,
                    as: 'incidentAssignee',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ]
        });

        if (!incident) {
            throw new Error('Incident not found');
        }

        return incident;
    }

    /**
     * Create incident
     */
    async createIncident(incidentData, userId) {
        const {
            title,
            description,
            priority,
            category,
            location,
            equipment_id,
            assigned_to
        } = incidentData;

        // Validate required fields
        if (!title || !description || !priority || !category) {
            throw new Error('Title, description, priority, and category are required');
        }

        // Verify equipment if provided
        if (equipment_id) {
            const equipment = await Equipment.findByPk(equipment_id);
            if (!equipment) {
                throw new Error('Equipment not found');
            }
        }

        // Verify assignee if provided
        if (assigned_to) {
            const assignee = await User.findByPk(assigned_to);
            if (!assignee) {
                throw new Error('Assigned user not found');
            }
        }

        const incident = await Incident.create({
            title: title.trim(),
            description: description.trim(),
            priority,
            category,
            location: location?.trim() || null,
            equipment_id: equipment_id ? parseInt(equipment_id) : null,
            assigned_to: assigned_to ? parseInt(assigned_to) : null,
            reported_by: userId,
            status: 'open'
        });

        // Create notification for assignee
        if (assigned_to) {
            try {
                await createNotification({
                    user_id: assigned_to,
                    type: 'incident',
                    title: 'Incident Assigned',
                    message: `You have been assigned to incident: "${title}". Priority: ${priority}`,
                    metadata: {
                        incident_id: incident.id,
                        title: title,
                        priority: priority,
                        category: category
                    }
                });
            } catch (notifError) {
                console.error('⚠️ Failed to create incident notification:', notifError.message);
            }
        }

        return await this.getIncidentById(incident.id);
    }

    /**
     * Update incident
     */
    async updateIncident(id, updateData, userId) {
        const incident = await Incident.findByPk(id);

        if (!incident) {
            throw new Error('Incident not found');
        }

        const oldStatus = incident.status;
        const oldAssignee = incident.assigned_to;

        // Auto-update resolution date if status changed to resolved
        if (updateData.status === 'resolved' && incident.status !== 'resolved') {
            updateData.resolved_at = new Date();
            updateData.resolved_by = userId;
        }

        await incident.update(updateData);

        // Create notification for status change
        if (updateData.status && updateData.status !== oldStatus) {
            try {
                const notifyUser = incident.reported_by || incident.assigned_to;
                if (notifyUser) {
                    await createNotification({
                        user_id: notifyUser,
                        type: 'incident',
                        title: 'Incident Status Updated',
                        message: `Incident "${incident.title}" status changed to ${updateData.status}.`,
                        metadata: {
                            incident_id: incident.id,
                            old_status: oldStatus,
                            new_status: updateData.status
                        }
                    });
                }
            } catch (notifError) {
                console.error('⚠️ Failed to create status notification:', notifError.message);
            }
        }

        // Create notification for reassignment
        if (updateData.assigned_to && updateData.assigned_to !== oldAssignee) {
            try {
                await createNotification({
                    user_id: updateData.assigned_to,
                    type: 'incident',
                    title: 'Incident Assigned',
                    message: `You have been assigned to incident: "${incident.title}".`,
                    metadata: {
                        incident_id: incident.id,
                        title: incident.title,
                        priority: incident.priority
                    }
                });
            } catch (notifError) {
                console.error('⚠️ Failed to create assignment notification:', notifError.message);
            }
        }

        return await this.getIncidentById(id);
    }

    /**
     * Delete incident
     */
    async deleteIncident(id) {
        const incident = await Incident.findByPk(id);

        if (!incident) {
            throw new Error('Incident not found');
        }

        await incident.destroy();
        return { message: 'Incident deleted successfully' };
    }

    /**
     * Get recent incidents
     */
    async getRecentIncidents(limit = 10) {
        const incidents = await Incident.findAll({
            include: [
                {
                    model: Equipment,
                    as: 'relatedEquipment',
                    attributes: ['id', 'name', 'serial_number'],
                    required: false
                },
                {
                    model: User,
                    as: 'incidentReporter',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit)
        });

        return incidents;
    }

    /**
     * Get critical incidents
     */
    async getCriticalIncidents() {
        const incidents = await Incident.findAll({
            where: {
                priority: 'critical',
                status: { [Op.in]: ['open', 'in_progress'] }
            },
            include: [
                {
                    model: Equipment,
                    as: 'relatedEquipment',
                    attributes: ['id', 'name', 'serial_number'],
                    required: false
                },
                {
                    model: User,
                    as: 'incidentAssignee',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ],
            order: [['created_at', 'DESC']]
        });

        return incidents;
    }
}

module.exports = new IncidentService();
