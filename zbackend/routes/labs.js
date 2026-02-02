const express = require('express');
const router = express.Router();
const { Lab, User, Equipment, Booking } = require('../models');
const { Op } = require('sequelize');
const { authenticateToken } = require('../middleware/auth');const { trackAccess } = require('./recentlyAccessed');const { createNotification } = require('../utils/notificationService');

// GET lab statistics
router.get('/stats', async (req, res) => {
    try {
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

        res.json({
            success: true,
            data: {
                total: totalLabs,
                cseLabs,
                eeeLabs,
                eceLabs
            }
        });
    } catch (error) {
        console.error('Error fetching lab stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch lab statistics',
            error: error.message
        });
    }
});

// GET all labs
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 50, search } = req.query;

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
                    as: 'labCreator', // ✅ FIXED: Updated alias
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        res.json({
            success: true,
            data: {
                labs: labs.rows,
                pagination: {
                    total: labs.count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(labs.count / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Error fetching labs:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// POST create new lab
router.post('/', authenticateToken, async (req, res) => {
    const {
        name,
        lab_type,
        location,
        capacity,
        description,
        square_feet,
        lab_seats
    } = req.body;

    try {

        if (!name || !lab_type) {
            return res.status(400).json({
                success: false,
                message: 'Name and lab type are required'
            });
        }

        const lab = await Lab.create({
            name,
            lab_type,
            location,
            capacity: capacity ? parseInt(capacity) : null,
            description,
            square_feet: square_feet ? parseInt(square_feet) : null,
            lab_seats: lab_seats ? parseInt(lab_seats) : null,
            created_by: req.user.userId
        });

        // Create notification for lab creation
        try {
            await createNotification({
                user_id: req.user.userId,
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
            console.log('📧 Lab creation notification created for:', name);
        } catch (notifError) {
            console.error('⚠️ Failed to create lab notification:', notifError.message);
        }

        res.status(201).json({
            success: true,
            data: lab,
            message: 'Lab created successfully'
        });
    } catch (error) {
        console.error('Error creating lab:', error);
        
        // Handle specific error types
        if (error.name === 'SequelizeUniqueConstraintError') {
            const duplicateField = error.errors[0]?.path;
            if (duplicateField === 'name') {
                return res.status(400).json({
                    success: false,
                    message: `A lab with the name "${name}" already exists. Please choose a different name.`
                });
            }
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// PUT update lab by ID
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const {
        name,
        lab_type,
        location,
        capacity,
        description,
        square_feet,
        lab_seats
    } = req.body;

    try {

        if (!name || !lab_type) {
            return res.status(400).json({
                success: false,
                message: 'Name and lab type are required'
            });
        }

        const lab = await Lab.findOne({
            where: { id: id, is_active: true }
        });

        if (!lab) {
            return res.status(404).json({
                success: false,
                message: 'Lab not found'
            });
        }

        // Update the lab
        await lab.update({
            name,
            lab_type,
            location,
            capacity: capacity ? parseInt(capacity) : null,
            description,
            square_feet: square_feet ? parseInt(square_feet) : null,
            lab_seats: lab_seats ? parseInt(lab_seats) : null
        });

        // Create notification for lab update
        try {
            await createNotification({
                user_id: req.user.userId,
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
            console.log('📧 Lab update notification created for:', name);
        } catch (notifError) {
            console.error('⚠️ Failed to create lab update notification:', notifError.message);
        }

        res.json({
            success: true,
            data: lab,
            message: 'Lab updated successfully'
        });
    } catch (error) {
        console.error('Error updating lab:', error);
        
        // Handle specific error types
        if (error.name === 'SequelizeUniqueConstraintError') {
            const duplicateField = error.errors[0]?.path;
            if (duplicateField === 'name') {
                return res.status(400).json({
                    success: false,
                    message: `A lab with the name "${name}" already exists. Please choose a different name.`
                });
            }
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// GET lab by ID
router.get('/:id', trackAccess('lab'), async (req, res) => {
    try {
        const { id } = req.params;

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
            return res.status(404).json({
                success: false,
                message: 'Lab not found'
            });
        }

        res.json({
            success: true,
            data: lab
        });
    } catch (error) {
        console.error('Error fetching lab:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// DELETE lab by ID (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const lab = await Lab.findOne({
            where: { id: id, is_active: true }
        });

        if (!lab) {
            return res.status(404).json({
                success: false,
                message: 'Lab not found'
            });
        }

        // Soft delete the lab
        await lab.update({ is_active: false });

        // Create notification for lab deletion
        try {
            await createNotification({
                user_id: req.user.userId,
                type: 'lab',
                title: 'Lab Deleted',
                message: `Lab "${lab.name}" has been deleted.`,
                metadata: {
                    lab_id: lab.id,
                    lab_name: lab.name,
                    action: 'deleted'
                }
            });
            console.log('📧 Lab deletion notification created for:', lab.name);
        } catch (notifError) {
            console.error('⚠️ Failed to create lab deletion notification:', notifError.message);
        }

        res.json({
            success: true,
            message: 'Lab deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting lab:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;