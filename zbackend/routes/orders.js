const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const orderService = require('../services/orderService');

const router = express.Router();

// Order validation
const orderValidation = [
    body('supplier').trim().isLength({ min: 2, max: 255 }).withMessage('Supplier name required'),
    body('equipment_name').trim().isLength({ min: 2, max: 255 }).withMessage('Equipment name required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('unit_price').isFloat({ min: 0 }).withMessage('Unit price must be positive'),
    body('total_amount').isFloat({ min: 0 }).withMessage('Total amount must be positive'),
    body('status').optional().isIn(['Pending', 'Approved', 'Ordered', 'Delivered', 'Cancelled']).withMessage('Invalid status'),
    body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority')
];

// GET order statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = await orderService.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching order statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order statistics',
            error: error.message
        });
    }
});

// Apply authentication and admin requirement to remaining routes
router.use(authenticateToken);
router.use(requireAdmin);

// GET all orders
router.get('/', async (req, res) => {
    try {
        const result = await orderService.getAllOrders(req.query);
        res.json({
            success: true,
            data: result.orders,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
});

// GET single order by ID
router.get('/:id', async (req, res) => {
    try {
        const order = await orderService.getOrderById(req.params.id);
        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        if (error.message === 'Order not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to fetch order',
            error: error.message
        });
    }
});

// POST create new order
router.post('/', orderValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const order = await orderService.createOrder(req.body, req.user.userId);
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create order',
            error: error.message
        });
    }
});

// PUT update order
router.put('/:id', orderValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const order = await orderService.updateOrder(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Order updated successfully',
            data: order
        });
    } catch (error) {
        console.error('Error updating order:', error);
        if (error.message === 'Order not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update order',
            error: error.message
        });
    }
});

// DELETE order
router.delete('/:id', async (req, res) => {
    try {
        await orderService.deleteOrder(req.params.id);
        res.json({
            success: true,
            message: 'Order deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting order:', error);
        if (error.message === 'Order not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to delete order',
            error: error.message
        });
    }
});

module.exports = router;
