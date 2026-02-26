// Lab Service - Business Logic Layer
const { Lab, User, Equipment, Booking } = require('../models');
const { Op } = require('sequelize');
const { createNotification } = require('../utils/notificationService');

class LabService {
    /**
     * Get lab statistics
     */
    async getStats() {
        const totalLabs = await Lab.count({ where: { is_active: true } });
        const cseLabs = await Lab.count({ 
            where: { is_active: true, lab_type: 'cse' } 
        });
        const eeeLabs = await Lab.count({ 
            where: { is_active: true, lab_type: 'eee' } 
        });
        const eceLabs = await Lab.count({ 
            where: { is_active: true, lab_type: 'ece' } 
        });

        return {
            total: totalLabs,
            cseLabs,
            eeeLabs,
            eceLabs
        };
    }

    /**
     * Get all labs with filters and pagination
     */
    async getAllLabs(filters = {}) {
        const { page = 1, limit = 50, search } = filters;

        const whereClause = { is_active: true };

        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { location: { [Op.like]: `%${search}%` } }
            ];
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const labs = await Lab.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'labCreator',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        return {
            labs: labs.rows,
            pagination: {
                total: labs.count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(labs.count / parseInt(limit))
            }
        };
    }

    /**
     * Get lab by ID
     */
    async getLabById(id) {
        const lab = await Lab.findOne({
            where: { id: id, is_active: true },
            include: [
                {
                    model: User,
                    as: 'labCreator',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ]
        });

        if (!lab) {
            throw new Error('Lab not found');
        }

        return lab;
    }

    /**
     * Create new lab
     */
    async createLab(labData, userId) {
        const { name, lab_type, location, capacity, description, square_feet, lab_seats } = labData;

        if (!name || !lab_type) {
            throw new Error('Name and lab type are required');
        }

        const lab = await Lab.create({
            name,
            lab_type,
            location,
            capacity: capacity ? parseInt(capacity) : null,
            description,
            square_feet: square_feet ? parseInt(square_feet) : null,
            lab_seats: lab_seats ? parseInt(lab_seats) : null,
            created_by: userId
        });

        // Create notification
        try {
            await createNotification({
                user_id: userId,
                type: 'lab',
                title: 'Lab Created',
                message: `New ${lab_type.replace('_', ' ')} "${name}" has been created at ${location || 'the facility'}.`,
                metadata: {
                    lab_id: lab.id,
                    lab_name: name,
                    lab_type: lab_type,
                    location: location,
                    capacity: capacity || null
                }
            });
        } catch (notifError) {
            console.error('⚠️ Failed to create lab notification:', notifError.message);
        }

        return lab;
    }

    /**
     * Update lab
     */
    async updateLab(id, labData, userId) {
        const { name, lab_type, location, capacity, description, square_feet, lab_seats } = labData;

        if (!name || !lab_type) {
            throw new Error('Name and lab type are required');
        }

        const lab = await Lab.findOne({
            where: { id: id, is_active: true }
        });

        if (!lab) {
            throw new Error('Lab not found');
        }

        await lab.update({
            name,
            lab_type,
            location,
            capacity: capacity ? parseInt(capacity) : null,
            description,
            square_feet: square_feet ? parseInt(square_feet) : null,
            lab_seats: lab_seats ? parseInt(lab_seats) : null
        });

        // Create notification
        try {
            await createNotification({
                user_id: userId,
                type: 'lab',
                title: 'Lab Updated',
                message: `Lab "${name}" has been updated.`,
                metadata: {
                    lab_id: lab.id,
                    lab_name: name,
                    lab_type: lab_type,
                    location: location,
                    action: 'updated'
                }
            });
        } catch (notifError) {
            console.error('⚠️ Failed to create lab update notification:', notifError.message);
        }

        return lab;
    }

    /**
     * Delete lab (soft delete)
     */
    async deleteLab(id, userId) {
        const lab = await Lab.findOne({
            where: { id: id, is_active: true }
        });

        if (!lab) {
            throw new Error('Lab not found');
        }

        await lab.update({ is_active: false });

        // Create notification
        try {
            await createNotification({
                user_id: userId,
                type: 'lab',
                title: 'Lab Deleted',
                message: `Lab "${lab.name}" has been deleted.`,
                metadata: {
                    lab_id: lab.id,
                    lab_name: lab.name,
                    action: 'deleted'
                }
            });
        } catch (notifError) {
            console.error('⚠️ Failed to create lab deletion notification:', notifError.message);
        }

        return { message: 'Lab deleted successfully' };
    }
}

module.exports = new LabService();
