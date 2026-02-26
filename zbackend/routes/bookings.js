const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { trackAccess } = require('./recentlyAccessed');
const bookingService = require('../services/bookingService');

const router = express.Router();

router.use(authenticateToken);

// GET booking statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await bookingService.getStats(req.user.userId, req.user.role);
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching booking stats:', error);
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
        const limit = parseInt(req.query.limit) || 10;
        const bookings = await bookingService.getUpcomingBookings(req.user.userId, req.user.role, limit);
        
        // Flatten the data structure for frontend
        const transformedBookings = bookings.map(booking => {
            const bookingData = booking.toJSON ? booking.toJSON() : booking;
            
            // Extract status properly
            let statusValue = bookingData.status;
            if (typeof statusValue === 'object' && statusValue !== null) {
                statusValue = statusValue.status || String(statusValue);
            }
            statusValue = String(statusValue || 'pending');
            
            return {
                id: bookingData.id,
                booking_type: bookingData.booking_type,
                equipment_name: bookingData.equipment?.name || null,
                lab_name: bookingData.lab?.name || null,
                user_name: bookingData.user?.name || null,
                user_email: bookingData.user?.email || null,
                purpose: bookingData.purpose || '',
                start_time: bookingData.start_time,
                end_time: bookingData.end_time,
                status: statusValue,
                created_at: bookingData.created_at
            };
        });
        
        res.json({
            success: true,
            data: transformedBookings
        });
    } catch (error) {
        console.error('Error fetching upcoming bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch upcoming bookings',
            error: error.message
        });
    }
});

// GET all bookings
router.get('/', async (req, res) => {
    try {
        console.log('📅 Fetching bookings for user:', req.user.email, 'Role:', req.user.role);
        
        const result = await bookingService.getAllBookings(req.query, req.user.userId, req.user.role);
        res.json({
            success: true,
            data: result.bookings,
            pagination: result.pagination
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

// GET booking by ID
router.get('/:id', trackAccess, async (req, res) => {
    try {
        const booking = await bookingService.getBookingById(req.params.id);
        
        // Check access permissions
        if (req.user.role === 'student' && booking.user_id !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this booking'
            });
        }
        
        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.error('Error fetching booking:', error);
        if (error.message === 'Booking not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to fetch booking',
            error: error.message
        });
    }
});

// POST create new booking
router.post('/', async (req, res) => {
    try {
        const booking = await bookingService.createBooking(req.body, req.user.userId);
        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: booking
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        if (error.message.includes('conflict') || error.message.includes('overlapping')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create booking',
            error: error.message
        });
    }
});

// PUT update booking
router.put('/:id', async (req, res) => {
    try {
        const booking = await bookingService.getBookingById(req.params.id);
        
        // Check access permissions
        if (req.user.role === 'student' && booking.user_id !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this booking'
            });
        }
        
        const updatedBooking = await bookingService.updateBooking(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Booking updated successfully',
            data: updatedBooking
        });
    } catch (error) {
        console.error('Error updating booking:', error);
        if (error.message === 'Booking not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        if (error.message.includes('conflict') || error.message.includes('overlapping')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update booking',
            error: error.message
        });
    }
});

// DELETE booking
router.delete('/:id', async (req, res) => {
    try {
        const booking = await bookingService.getBookingById(req.params.id);
        
        // Check access permissions
        if (req.user.role === 'student' && booking.user_id !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this booking'
            });
        }
        
        await bookingService.deleteBooking(req.params.id);
        res.json({
            success: true,
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting booking:', error);
        if (error.message === 'Booking not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to delete booking',
            error: error.message
        });
    }
});

module.exports = router;
