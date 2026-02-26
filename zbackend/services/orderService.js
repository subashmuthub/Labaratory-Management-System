// Order Service - Business Logic Layer
const { Order, User } = require('../models');
const { Op } = require('sequelize');

class OrderService {
    /**
     * Get order statistics
     */
    async getStats() {
        const totalOrders = await Order.count();
        const pendingOrders = await Order.count({ where: { status: 'Pending' } });
        const approvedOrders = await Order.count({ where: { status: 'Approved' } });
        const deliveredOrders = await Order.count({ where: { status: 'Delivered' } });

        const totalValue = await Order.sum('total_amount') || 0;
        const pendingValue = await Order.sum('total_amount', { where: { status: 'Pending' } }) || 0;

        return {
            totalOrders,
            pendingOrders,
            approvedOrders,
            deliveredOrders,
            totalValue: parseFloat(totalValue),
            pendingValue: parseFloat(pendingValue)
        };
    }

    /**
     * Get all orders with filters
     */
    async getAllOrders(filters = {}) {
        const { page = 1, limit = 10, status, search } = filters;
        const offset = (page - 1) * limit;
        const whereClause = {};

        if (status && status !== 'all') {
            whereClause.status = status;
        }

        if (search) {
            whereClause[Op.or] = [
                { supplier: { [Op.like]: `%${search}%` } },
                { equipment_name: { [Op.like]: `%${search}%` } }
            ];
        }

        const { rows: orders, count: total } = await Order.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        return {
            orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get order by ID
     */
    async getOrderById(id) {
        const order = await Order.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ]
        });

        if (!order) {
            throw new Error('Order not found');
        }

        return order;
    }

    /**
     * Create order
     */
    async createOrder(orderData, userId) {
        const {
            supplier,
            equipment_name,
            quantity,
            unit_price,
            total_amount,
            status = 'Pending',
            priority = 'Medium',
            notes,
            expected_delivery
        } = orderData;

        // Validate required fields
        if (!supplier || !equipment_name || !quantity || !unit_price || !total_amount) {
            throw new Error('Supplier, equipment name, quantity, unit price, and total amount are required');
        }

        const order = await Order.create({
            supplier: supplier.trim(),
            equipment_name: equipment_name.trim(),
            quantity: parseInt(quantity),
            unit_price: parseFloat(unit_price),
            total_amount: parseFloat(total_amount),
            status,
            priority,
            notes: notes?.trim() || null,
            expected_delivery: expected_delivery ? new Date(expected_delivery) : null,
            created_by: userId
        });

        return await this.getOrderById(order.id);
    }

    /**
     * Update order
     */
    async updateOrder(id, updateData) {
        const order = await Order.findByPk(id);

        if (!order) {
            throw new Error('Order not found');
        }

        // Auto-update delivery date if status changed to Delivered
        if (updateData.status === 'Delivered' && order.status !== 'Delivered') {
            updateData.actual_delivery = new Date();
        }

        await order.update(updateData);

        return await this.getOrderById(id);
    }

    /**
     * Delete order
     */
    async deleteOrder(id) {
        const order = await Order.findByPk(id);

        if (!order) {
            throw new Error('Order not found');
        }

        await order.destroy();
        return { message: 'Order deleted successfully' };
    }

    /**
     * Get recent orders
     */
    async getRecentOrders(limit = 10) {
        const orders = await Order.findAll({
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit)
        });

        return orders;
    }

    /**
     * Get pending orders
     */
    async getPendingOrders() {
        const orders = await Order.findAll({
            where: { status: 'Pending' },
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ],
            order: [['created_at', 'DESC']]
        });

        return orders;
    }
}

module.exports = new OrderService();
