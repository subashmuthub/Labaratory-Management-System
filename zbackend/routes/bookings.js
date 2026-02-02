const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authenticateToken } = require('../middleware/auth');
const { Booking, Equipment, User, Lab } = require('../models');
const { sequelize } = require('../config/database');
const { createNotification } = require('../utils/notificationService');
const { trackAccess } = require('./recentlyAccessed');

router.use(authenticateToken);

// ✅ FIXED: GET all bookings with proper response format
router.get('/', async (req, res) => {
    try {
        console.log('📅 Fetching bookings for user:', req.user.email, 'Role:', req.user.role);

        const {
            page = 1,
            limit = 50,
            status,
            booking_type,
            user_id,
            lab_id,
            equipment_id,
            start_date,
            end_date,
            my_bookings
        } = req.query;

        const whereClause = {};

        // Role-based filtering
        if (req.user.role === 'student' || my_bookings === 'true') {
            whereClause.user_id = req.user.userId;
        } else if (user_id && (req.user.role === 'admin' || req.user.role === 'teacher')) {
            whereClause.user_id = user_id;
        }

        // Filter for current and future bookings by default (exclude past bookings)
        if (!start_date && !end_date) {
            const now = new Date();
            now.setHours(0, 0, 0, 0); // Start from today
            whereClause.start_time = { [Op.gte]: now };
        }

        // Additional filters
        if (status) whereClause.status = status;
        if (booking_type) whereClause.booking_type = booking_type;
        if (lab_id) whereClause.lab_id = lab_id;
        if (equipment_id) whereClause.equipment_id = equipment_id;

        // Date range filter
        if (start_date || end_date) {
            whereClause.start_time = {};
            if (start_date) whereClause.start_time[Op.gte] = new Date(start_date);
            if (end_date) whereClause.start_time[Op.lte] = new Date(end_date + 'T23:59:59');
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { rows: bookings, count: total } = await Booking.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Equipment,
                    as: 'equipment',
                    attributes: ['id', 'name', 'serial_number', 'category'],
                    required: false
                },
                {
                    model: Lab,
                    as: 'lab',
                    attributes: ['id', 'name', 'location', 'lab_type'],
                    required: false
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ],
            order: [['start_time', 'ASC']], // Show upcoming bookings first
            limit: parseInt(limit),
            offset: offset
        });

        console.log(`✅ Found ${total} bookings (showing ${bookings.length})`);

        res.json({
            success: true,
            data: {
                bookings: bookings,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('💥 Error fetching bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
            error: error.message
        });
    }
});

// GET booking statistics
router.get('/stats', async (req, res) => {
    try {
        const whereClause = {};
        if (req.user.role === 'student') {
            whereClause.user_id = req.user.userId;
        }

        const totalBookings = await Booking.count({ where: whereClause });
        const pendingBookings = await Booking.count({ where: { ...whereClause, status: 'pending' } });
        const confirmedBookings = await Booking.count({ where: { ...whereClause, status: 'confirmed' } });
        const completedBookings = await Booking.count({ where: { ...whereClause, status: 'completed' } });

        const now = new Date();
        const activeBookings = await Booking.count({
            where: {
                ...whereClause,
                status: { [Op.in]: ['pending', 'confirmed'] },
                [Op.or]: [
                    // Future bookings (not started yet)
                    { start_time: { [Op.gte]: now } },
                    // Currently running bookings (started but not ended)
                    {
                        start_time: { [Op.lte]: now },
                        end_time: { [Op.gte]: now }
                    }
                ]
            }
        });

        res.json({
            success: true,
            data: {
                total: totalBookings,
                pending: pendingBookings,
                confirmed: confirmedBookings,
                completed: completedBookings,
                active: activeBookings
            }
        });
    } catch (error) {
        console.error('💥 Error fetching booking stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch booking statistics',
            error: error.message
        });
    }
});

// GET upcoming bookings
router.get('/upcoming', async (req, res) => {
    try {
        const now = new Date();
        const { limit = 10 } = req.query;

        const whereClause = {
            start_time: { [Op.gte]: now },
            status: { [Op.in]: ['pending', 'confirmed'] }
        };

        if (req.user.role === 'student') {
            whereClause.user_id = req.user.userId;
        }

        const upcomingBookings = await Booking.findAll({
            where: whereClause,
            include: [
                {
                    model: Equipment,
                    as: 'equipment',
                    attributes: ['id', 'name'],
                    required: false
                },
                {
                    model: Lab,
                    as: 'lab',
                    attributes: ['id', 'name'],
                    required: false
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name'],
                    required: false
                }
            ],
            order: [['start_time', 'ASC']],
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            data: upcomingBookings
        });
    } catch (error) {
        console.error('💥 Error fetching upcoming bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch upcoming bookings',
            error: error.message
        });
    }
});

// ✅ FIXED: CREATE new booking
router.post('/', async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        console.log('📝 Creating new booking by user:', req.user.email);
        console.log('📝 Request body:', req.body);

        const {
            booking_type = 'equipment',
            lab_id,
            equipment_id,
            start_time,
            end_time,
            purpose,
            date,
        } = req.body;

        // ✅ FIXED: Handle datetime construction with better time parsing
        let finalStartTime, finalEndTime;

        if (date && start_time && end_time) {
            // Clean time format - handle both HH:MM and HH:MM:SS formats
            const cleanStartTime = start_time.split(':').slice(0, 2).join(':');
            const cleanEndTime = end_time.split(':').slice(0, 2).join(':');
            
            // Format: date="2024-01-20", start_time="09:00" or "09:00:00", end_time="11:00" or "11:00:00"
            finalStartTime = new Date(`${date}T${cleanStartTime}:00`);
            finalEndTime = new Date(`${date}T${cleanEndTime}:00`);
        } else if (start_time && end_time) {
            // ISO format
            finalStartTime = new Date(start_time);
            finalEndTime = new Date(end_time);
        } else {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Please provide date, start_time, and end_time'
            });
        }

        // Validation
        if (isNaN(finalStartTime.getTime()) || isNaN(finalEndTime.getTime())) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Invalid date or time format'
            });
        }

        if (finalEndTime <= finalStartTime) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'End time must be after start time'
            });
        }

        // Check if booking is in the past (allow 5 min buffer)
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        if (finalStartTime < fiveMinutesAgo) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Cannot book for past dates/times'
            });
        }

        // Validate booking type requirements
        if (booking_type === 'lab' && !lab_id) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Lab ID is required for lab bookings'
            });
        }

        if (booking_type === 'equipment' && (!lab_id || !equipment_id)) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Both Lab ID and Equipment ID are required for equipment bookings'
            });
        }

        // Validate resources exist
        if (lab_id) {
            const lab = await Lab.findByPk(lab_id, { transaction });
            if (!lab || !lab.is_active) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Lab not found or inactive'
                });
            }
        }

        if (equipment_id) {
            const equipment = await Equipment.findByPk(equipment_id, { transaction });
            if (!equipment || !equipment.is_active) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Equipment not found or inactive'
                });
            }

            if (equipment.status !== 'available') {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Equipment is currently ${equipment.status}`
                });
            }
        }

        // Check for conflicts
        const conflictWhere = {
            status: { [Op.in]: ['pending', 'confirmed'] },
            [Op.and]: [
                { start_time: { [Op.lt]: finalEndTime } },
                { end_time: { [Op.gt]: finalStartTime } }
            ]
        };

        if (booking_type === 'lab' && lab_id) {
            conflictWhere.lab_id = lab_id;
            conflictWhere.booking_type = 'lab';
        } else if (booking_type === 'equipment' && equipment_id) {
            conflictWhere.equipment_id = equipment_id;
        }

        const conflictingBooking = await Booking.findOne({
            where: conflictWhere,
            lock: transaction.LOCK.UPDATE,
            transaction
        });

        if (conflictingBooking) {
            console.log('❌ Booking conflict detected');
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Time slot is already booked`,
                conflict: {
                    start: conflictingBooking.start_time,
                    end: conflictingBooking.end_time
                }
            });
        }

        // Create booking
        const bookingData = {
            user_id: req.user.userId,
            booking_type,
            lab_id: lab_id ? parseInt(lab_id) : null,
            equipment_id: equipment_id ? parseInt(equipment_id) : null,
            start_time: finalStartTime,
            end_time: finalEndTime,
            purpose: purpose || '',
            status: 'pending'
        };

        console.log('📝 Creating booking with data:', bookingData);

        const newBooking = await Booking.create(bookingData, { transaction });

        await transaction.commit();

        console.log('✅ Booking created with ID:', newBooking.id);

        // Fetch with associations
        const bookingWithDetails = await Booking.findByPk(newBooking.id, {
            include: [
                {
                    model: Equipment,
                    as: 'equipment',
                    attributes: ['id', 'name', 'serial_number', 'category'],
                    required: false
                },
                {
                    model: Lab,
                    as: 'lab',
                    attributes: ['id', 'name', 'location', 'lab_type'],
                    required: false
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ]
        });

        // Create notification for the booking
        try {
            const resourceName = booking_type === 'lab' 
                ? (bookingWithDetails.lab?.name || 'Lab')
                : (bookingWithDetails.equipment?.name || 'Equipment');
            
            await createNotification({
                user_id: req.user.userId,
                type: 'booking',
                title: `${booking_type.charAt(0).toUpperCase() + booking_type.slice(1)} Booking Created`,
                message: `Your booking for ${resourceName} has been created successfully and is pending approval.`,
                metadata: {
                    booking_id: newBooking.id,
                    booking_type: booking_type,
                    resource_name: resourceName,
                    start_time: finalStartTime.toISOString(),
                    end_time: finalEndTime.toISOString()
                }
            });
            console.log('📧 Notification created for booking:', newBooking.id);
        } catch (notifError) {
            console.error('⚠️ Failed to create notification:', notifError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: {
                booking: bookingWithDetails
            }
        });
    } catch (error) {
        await transaction.rollback();
        console.error('💥 Error creating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create booking',
            error: error.message
        });
    }
});

// GET booking by ID
router.get('/:id', trackAccess('booking'), async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id, {
            include: [
                {
                    model: Equipment,
                    as: 'equipment',
                    attributes: ['id', 'name', 'serial_number', 'category'],
                    required: false
                },
                {
                    model: Lab,
                    as: 'lab',
                    attributes: ['id', 'name', 'location', 'lab_type'],
                    required: false
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ]
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (req.user.role === 'student' && booking.user_id !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this booking'
            });
        }

        res.json({
            success: true,
            data: { booking }
        });
    } catch (error) {
        console.error('💥 Error fetching booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch booking',
            error: error.message
        });
    }
});

// UPDATE booking
router.put('/:id', async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (booking.user_id !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this booking'
            });
        }

        // Validate status transitions
        if (req.body.status) {
            const validTransitions = {
                'pending': ['confirmed', 'cancelled'],
                'confirmed': ['completed', 'cancelled'],
                'cancelled': [],
                'completed': []
            };

            if (!validTransitions[booking.status]?.includes(req.body.status)) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot change status from ${booking.status} to ${req.body.status}`
                });
            }
        }

        const updateData = {};

        if (req.body.purpose !== undefined) updateData.purpose = req.body.purpose;
        if (req.body.status) updateData.status = req.body.status;

        await booking.update(updateData);

        const updatedBooking = await Booking.findByPk(req.params.id, {
            include: [
                { model: Equipment, as: 'equipment', required: false },
                { model: Lab, as: 'lab', required: false },
                { model: User, as: 'user', required: false }
            ]
        });

        res.json({
            success: true,
            data: { booking: updatedBooking },
            message: 'Booking updated successfully'
        });
    } catch (error) {
        console.error('💥 Error updating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update booking',
            error: error.message
        });
    }
});

// PATCH booking status (for quick status updates)
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findByPk(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Allow students to cancel their own bookings, admins can change any status
        if (booking.user_id !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this booking'
            });
        }

        // Students can only cancel their bookings
        if (req.user.role === 'student' && status !== 'cancelled') {
            return res.status(403).json({
                success: false,
                message: 'Students can only cancel their bookings'
            });
        }

        // Validate status transitions
        const validTransitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['completed', 'cancelled'],
            'cancelled': [],
            'completed': []
        };

        if (!validTransitions[booking.status]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot change status from ${booking.status} to ${status}`
            });
        }

        await booking.update({ status });

        // Create notification for status change
        try {
            const resourceName = booking.booking_type === 'lab' 
                ? (updatedBooking.lab?.name || 'Lab')
                : (updatedBooking.equipment?.name || 'Equipment');

            let notificationTitle = '';
            let notificationMessage = '';

            switch (status) {
                case 'confirmed':
                    notificationTitle = 'Booking Approved';
                    notificationMessage = `Your ${booking.booking_type} booking for ${resourceName} has been approved.`;
                    break;
                case 'cancelled':
                    notificationTitle = 'Booking Cancelled';
                    notificationMessage = `Your ${booking.booking_type} booking for ${resourceName} has been cancelled.`;
                    break;
                case 'completed':
                    notificationTitle = 'Booking Completed';
                    notificationMessage = `Your ${booking.booking_type} booking for ${resourceName} has been completed.`;
                    break;
                default:
                    notificationTitle = 'Booking Status Updated';
                    notificationMessage = `Your ${booking.booking_type} booking for ${resourceName} status has been updated to ${status}.`;
            }

            await createNotification({
                user_id: booking.user_id,
                type: 'booking',
                title: notificationTitle,
                message: notificationMessage,
                metadata: {
                    booking_id: booking.id,
                    booking_type: booking.booking_type,
                    resource_name: resourceName,
                    old_status: booking.status,
                    new_status: status
                }
            });
            console.log('📧 Status change notification created for booking:', booking.id);
        } catch (notifError) {
            console.error('⚠️ Failed to create status notification:', notifError.message);
        }

        const updatedBooking = await Booking.findByPk(req.params.id, {
            include: [
                { model: Equipment, as: 'equipment', required: false },
                { model: Lab, as: 'lab', required: false },
                { model: User, as: 'user', required: false }
            ]
        });

        res.json({
            success: true,
            data: { booking: updatedBooking },
            message: `Booking ${status} successfully`
        });
    } catch (error) {
        console.error('💥 Error updating booking status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update booking status',
            error: error.message
        });
    }
});

// DELETE (Cancel) booking
router.delete('/:id', async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (booking.user_id !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this booking'
            });
        }

        if (booking.status === 'cancelled' || booking.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel ${booking.status} booking`
            });
        }

        await booking.update({ status: 'cancelled' });

        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            data: { booking }
        });
    } catch (error) {
        console.error('💥 Error cancelling booking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel booking',
            error: error.message
        });
    }
});

module.exports = router;