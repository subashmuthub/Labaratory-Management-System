// Booking Service - Business Logic Layer
const { Booking, Equipment, User, Lab } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { createNotification } = require('../utils/notificationService');

class BookingService {
    /**
     * Get all bookings with filters
     */
    async getAllBookings(filters = {}, userId, userRole) {
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
        } = filters;

        const whereClause = {};

        // Role-based filtering
        if (userRole === 'student' || my_bookings === 'true') {
            whereClause.user_id = userId;
        } else if (user_id && (userRole === 'admin' || userRole === 'teacher')) {
            whereClause.user_id = user_id;
        }

        // Filter for current and future bookings by default
        if (!start_date && !end_date) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
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
            order: [['start_time', 'ASC']],
            limit: parseInt(limit),
            offset: offset
        });

        return {
            bookings,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        };
    }

    /**
     * Get booking by ID
     */
    async getBookingById(id, userId, userRole) {
        const booking = await Booking.findByPk(id, {
            include: [
                {
                    model: Equipment,
                    as: 'equipment',
                    attributes: ['id', 'name', 'serial_number', 'category', 'status'],
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
            throw new Error('Booking not found');
        }

        // Check permissions
        if (userRole === 'student' && booking.user_id !== userId) {
            throw new Error('You do not have permission to view this booking');
        }

        return booking;
    }

    /**
     * Create new booking
     */
    async createBooking(bookingData, userId) {
        const transaction = await sequelize.transaction();

        try {
            const {
                booking_type = 'equipment',
                lab_id,
                equipment_id,
                start_time,
                end_time,
                purpose,
                date
            } = bookingData;

            // Handle datetime construction
            let finalStartTime, finalEndTime;

            if (date && start_time && end_time) {
                const cleanStartTime = start_time.split(':').slice(0, 2).join(':');
                const cleanEndTime = end_time.split(':').slice(0, 2).join(':');
                finalStartTime = new Date(`${date}T${cleanStartTime}:00`);
                finalEndTime = new Date(`${date}T${cleanEndTime}:00`);
            } else if (start_time && end_time) {
                finalStartTime = new Date(start_time);
                finalEndTime = new Date(end_time);
            } else {
                throw new Error('Please provide date, start_time, and end_time');
            }

            // Validation
            if (isNaN(finalStartTime.getTime()) || isNaN(finalEndTime.getTime())) {
                throw new Error('Invalid date or time format');
            }

            if (finalEndTime <= finalStartTime) {
                throw new Error('End time must be after start time');
            }

            // Check if booking is in the past
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
            if (finalStartTime < fiveMinutesAgo) {
                throw new Error('Cannot book for past dates/times');
            }

            // Validate booking type requirements
            if (booking_type === 'lab' && !lab_id) {
                throw new Error('Lab ID is required for lab bookings');
            }

            if (booking_type === 'equipment' && (!lab_id || !equipment_id)) {
                throw new Error('Both Lab ID and Equipment ID are required for equipment bookings');
            }

            // Validate resources exist
            if (lab_id) {
                const lab = await Lab.findByPk(lab_id, { transaction });
                if (!lab || !lab.is_active) {
                    throw new Error('Lab not found or inactive');
                }
            }

            if (equipment_id) {
                const equipment = await Equipment.findByPk(equipment_id, { transaction });
                if (!equipment || !equipment.is_active) {
                    throw new Error('Equipment not found or inactive');
                }

                if (equipment.status !== 'available') {
                    throw new Error(`Equipment is currently ${equipment.status}`);
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
                transaction
            });

            if (conflictingBooking) {
                throw new Error('Time slot already booked');
            }

            // Create booking
            const booking = await Booking.create({
                booking_type,
                user_id: userId,
                lab_id: lab_id ? parseInt(lab_id) : null,
                equipment_id: equipment_id ? parseInt(equipment_id) : null,
                start_time: finalStartTime,
                end_time: finalEndTime,
                purpose: purpose?.trim() || null,
                status: 'pending'
            }, { transaction });

            await transaction.commit();

            // Get with associations
            const createdBooking = await this.getBookingById(booking.id, userId, 'student');

            // Send notification
            try {
                await createNotification({
                    user_id: userId,
                    type: 'booking',
                    title: 'Booking Created',
                    message: `Your ${booking_type} booking has been created for ${finalStartTime.toLocaleString()}.`,
                    metadata: {
                        booking_id: booking.id,
                        booking_type,
                        start_time: finalStartTime,
                        end_time: finalEndTime
                    }
                });
            } catch (notifError) {
                console.error('⚠️ Failed to create booking notification:', notifError.message);
            }

            return createdBooking;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Update booking
     */
    async updateBooking(id, updateData, userId, userRole) {
        const booking = await Booking.findByPk(id);

        if (!booking) {
            throw new Error('Booking not found');
        }

        // Check permissions
        if (userRole === 'student' && booking.user_id !== userId) {
            throw new Error('You do not have permission to modify this booking');
        }

        await booking.update(updateData);

        return await this.getBookingById(id, userId, userRole);
    }

    /**
     * Delete booking
     */
    async deleteBooking(id, userId, userRole) {
        const booking = await Booking.findByPk(id);

        if (!booking) {
            throw new Error('Booking not found');
        }

        // Check permissions
        if (userRole === 'student' && booking.user_id !== userId) {
            throw new Error('You do not have permission to delete this booking');
        }

        await booking.update({ status: 'cancelled' });
        return { message: 'Booking cancelled successfully' };
    }

    /**
     * Get booking statistics
     */
    async getStats(userId, userRole) {
        const whereClause = userRole === 'student' ? { user_id: userId } : {};

        const [total, pending, confirmed, completed, cancelled] = await Promise.all([
            Booking.count({ where: whereClause }),
            Booking.count({ where: { ...whereClause, status: 'pending' } }),
            Booking.count({ where: { ...whereClause, status: 'confirmed' } }),
            Booking.count({ where: { ...whereClause, status: 'completed' } }),
            Booking.count({ where: { ...whereClause, status: 'cancelled' } })
        ]);

        // Active bookings = pending + confirmed (not completed or cancelled)
        const active = pending + confirmed;

        return {
            total,
            active,
            pending,
            confirmed,
            completed,
            cancelled
        };
    }

    /**
     * Get upcoming bookings
     */
    async getUpcomingBookings(userId, userRole, limit = 10) {
        const whereClause = {
            start_time: { [Op.gte]: new Date() },
            status: { [Op.in]: ['pending', 'confirmed'] }
        };

        if (userRole === 'student') {
            whereClause.user_id = userId;
        }

        const bookings = await Booking.findAll({
            where: whereClause,
            include: [
                {
                    model: Equipment,
                    as: 'equipment',
                    attributes: ['id', 'name', 'serial_number'],
                    required: false
                },
                {
                    model: Lab,
                    as: 'lab',
                    attributes: ['id', 'name', 'location'],
                    required: false
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ],
            order: [['start_time', 'ASC']],
            limit: parseInt(limit)
        });

        return bookings;
    }
}

module.exports = new BookingService();
