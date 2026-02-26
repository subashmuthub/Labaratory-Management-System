// User Service - Business Logic Layer
const { User, Booking, Incident, Maintenance, Order, Report } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

class UserService {
    /**
     * Get all users
     */
    async getAllUsers() {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'student_id', 'department', 'phone', 'is_active', 'last_login', 'created_at'],
            order: [['created_at', 'DESC']]
        });

        // Transform is_active to status for frontend
        return users.map(user => ({
            ...user.dataValues,
            status: user.is_active ? 'Active' : 'Inactive',
            lastLogin: user.last_login
        }));
    }

    /**
     * Get user statistics
     */
    async getStats() {
        const [totalUsers, activeUsers, students, teachers, admins, labTechnicians, labAssistants] = await Promise.all([
            User.count(),
            User.count({ where: { is_active: true } }),
            User.count({ where: { role: 'student' } }),
            User.count({ where: { role: 'teacher' } }),
            User.count({ where: { role: 'admin' } }),
            User.count({ where: { role: 'lab_technician' } }),
            User.count({ where: { role: 'lab_assistant' } })
        ]);

        return {
            total: totalUsers,
            active: activeUsers,
            students,
            teachers,
            admins,
            lab_technicians: labTechnicians,
            lab_assistants: labAssistants
        };
    }

    /**
     * Create new user
     */
    async createUser(userData) {
        const { name, email, role, password, student_id, department, phone } = userData;

        // Validate required fields
        if (!name || !email || !role || !password) {
            throw new Error('Missing required fields: name, email, role, and password are required');
        }

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            role: role ? role.toLowerCase() : 'student',
            password: hashedPassword,
            student_id: student_id || null,
            department: department || null,
            phone: phone || null,
            is_active: true
        });

        // Return user without password
        const { password: _, ...userWithoutPassword } = user.dataValues;
        return userWithoutPassword;
    }

    /**
     * Get user by ID
     */
    async getUserById(id) {
        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    /**
     * Update user
     */
    async updateUser(id, updateData) {
        console.log('✏️ UserService.updateUser - User ID:', id);
        console.log('📝 Update data received:', { ...updateData, password: updateData.password ? '[REDACTED]' : undefined });
        
        const user = await User.findByPk(id);

        if (!user) {
            console.error('❌ User not found with ID:', id);
            throw new Error('User not found');
        }

        console.log('📝 Current user data:', user.name, user.email, user.role);

        // If password is being updated, hash it
        if (updateData.password) {
            console.log('🔐 Hashing new password...');
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        console.log('💾 Updating user in database...');
        await user.update(updateData);

        console.log('✅ User updated successfully:', user.name, user.email);
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = user.dataValues;
        return userWithoutPassword;
    }

    /**
     * Delete user permanently
     */
    async deleteUser(id) {
        console.log('🗑️ UserService.deleteUser - Looking for user ID:', id);
        const user = await User.findByPk(id);

        if (!user) {
            console.error('❌ User not found with ID:', id);
            throw new Error('User not found');
        }

        console.log('📝 Found user to delete:', user.name, user.email);
        
        // Check for related records that would prevent deletion
        try {
            // Count related records
            const [bookingsCount, incidentsCount, maintenanceCount, ordersCount, reportsCount] = await Promise.all([
                Booking.count({ where: { user_id: id } }),
                Incident.count({ where: { reported_by: id } }),
                Maintenance.count({ where: { created_by: id } }),
                Order.count({ where: { ordered_by: id } }),
                Report.count({ where: { created_by: id } })
            ]);

            const totalRelated = bookingsCount + incidentsCount + maintenanceCount + ordersCount + reportsCount;
            console.log('📊 Related records:', { bookingsCount, incidentsCount, maintenanceCount, ordersCount, reportsCount, totalRelated });

            if (totalRelated > 0) {
                const message = `Cannot delete user. User has ${totalRelated} related records (${bookingsCount} bookings, ${incidentsCount} incidents, ${maintenanceCount} maintenance, ${ordersCount} orders, ${reportsCount} reports). Please deactivate instead.`;
                console.error('❌', message);
                throw new Error(message);
            }

            console.log('✅ No related records found, proceeding with deletion');
            console.log('🔥 Calling user.destroy() - PERMANENT DELETE');
            
            // Permanently delete the user from database
            await user.destroy();
            
            console.log('✅ User.destroy() completed - User removed from database');
            return { message: 'User deleted permanently', deletedUser: { id: user.id, name: user.name, email: user.email } };
            
        } catch (error) {
            // If it's our custom error message, rethrow it
            if (error.message.includes('Cannot delete user')) {
                throw error;
            }
            
            // Otherwise, it's a database error
            console.error('💥 Database error during deletion:', error);
            throw new Error('Cannot delete user due to database constraints. User may have related records. Please deactivate the user instead.');
        }
    }

    /**
     * Activate user
     */
    async activateUser(id) {
        const user = await User.findByPk(id);

        if (!user) {
            throw new Error('User not found');
        }

        await user.update({ is_active: true });
        
        const { password: _, ...userWithoutPassword } = user.dataValues;
        return userWithoutPassword;
    }

    /**
     * Search users
     */
    async searchUsers(searchTerm) {
        const users = await User.findAll({
            where: {
                [Op.or]: [
                    { name: { [Op.like]: `%${searchTerm}%` } },
                    { email: { [Op.like]: `%${searchTerm}%` } },
                    { student_id: { [Op.like]: `%${searchTerm}%` } }
                ]
            },
            attributes: { exclude: ['password'] },
            order: [['created_at', 'DESC']]
        });

        return users;
    }
}

module.exports = new UserService();
