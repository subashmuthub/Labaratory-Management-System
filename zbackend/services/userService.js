// User Service - Business Logic Layer
const { User, Role, Department, Booking, Incident, Maintenance, Order, Report } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

const ROLE_MAP = { 1: 'student', 2: 'faculty', 3: 'teacher', 4: 'lab_assistant', 5: 'lab_technician', 6: 'admin' };
const ROLE_TO_ID = { student: 1, faculty: 2, teacher: 3, lab_assistant: 4, lab_technician: 5, admin: 6 };

class UserService {
    async getAllUsers() {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            include: [
                { model: Role, as: 'role', attributes: ['roleId', 'roleName'] },
                { model: Department, as: 'department', attributes: ['departmentId', 'departmentName'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        return users.map(user => {
            const u = user.toJSON();
            return {
                ...u,
                id: u.userId,
                name: u.userName,
                email: u.userMail,
                role: u.role ? u.role.roleName.toLowerCase() : (ROLE_MAP[u.roleId] || 'student'),
                status: u.status,
            };
        });
    }

    async getStats() {
        const [totalUsers, activeUsers, students, teachers, admins, labTechnicians, labAssistants] = await Promise.all([
            User.count(),
            User.count({ where: { status: 'Active' } }),
            User.count({ where: { roleId: 1 } }),
            User.count({ where: { roleId: 3 } }),
            User.count({ where: { roleId: 6 } }),
            User.count({ where: { roleId: 5 } }),
            User.count({ where: { roleId: 4 } })
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

    async createUser(userData) {
        const { name, email, role, password, student_id } = userData;

        if (!name || !email || !role || !password) {
            throw new Error('Missing required fields: name, email, role, and password are required');
        }

        const existingUser = await User.findOne({ where: { userMail: email } });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userNumber = student_id || `USR${Date.now()}${Math.floor(Math.random() * 1000)}`;

        const user = await User.create({
            userName: name,
            userMail: email,
            roleId: ROLE_TO_ID[role?.toLowerCase()] || 1,
            password: hashedPassword,
            userNumber,
            status: 'Active'
        });

        // Return user without password
        const { password: _, ...userWithoutPassword } = user.dataValues;
        return userWithoutPassword;
    }

    async getUserById(id) {
        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] },
            include: [
                { model: Role, as: 'role', attributes: ['roleId', 'roleName'] },
                { model: Department, as: 'department', attributes: ['departmentId', 'departmentName'] }
            ]
        });

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    async updateUser(id, updateData) {
        console.log('✏️ UserService.updateUser - User ID:', id);
        
        const user = await User.findByPk(id);

        if (!user) {
            throw new Error('User not found');
        }

        // Map old/new field names
        const mappedData = {};
        if (updateData.name !== undefined) mappedData.userName = updateData.name;
        if (updateData.email !== undefined) mappedData.userMail = updateData.email;
        if (updateData.userName !== undefined) mappedData.userName = updateData.userName;
        if (updateData.userMail !== undefined) mappedData.userMail = updateData.userMail;
        if (updateData.status !== undefined) mappedData.status = updateData.status;
        if (updateData.roleId !== undefined) mappedData.roleId = updateData.roleId;
        if (updateData.role !== undefined) mappedData.roleId = ROLE_TO_ID[updateData.role?.toLowerCase()] || mappedData.roleId;
        if (updateData.departmentId !== undefined) mappedData.departmentId = updateData.departmentId;
        if (updateData.password) {
            mappedData.password = await bcrypt.hash(updateData.password, 10);
        }

        await user.update(mappedData);
        
        const { password: _, ...userWithoutPassword } = user.dataValues;
        return userWithoutPassword;
    }

    async deleteUser(id) {
        const user = await User.findByPk(id);

        if (!user) {
            throw new Error('User not found');
        }

        try {
            await user.destroy();
            return { message: 'User deleted permanently', deletedUser: { id: user.userId, name: user.userName, email: user.userMail } };
        } catch (error) {
            console.error('💥 Error during user deletion:', error);
            throw new Error('Cannot delete user due to database constraints. User may have related records. Please deactivate the user instead.');
        }
    }

    async activateUser(id) {
        const user = await User.findByPk(id);

        if (!user) {
            throw new Error('User not found');
        }

        await user.update({ status: 'Active' });
        
        const { password: _, ...userWithoutPassword } = user.dataValues;
        return userWithoutPassword;
    }

    async searchUsers(searchTerm) {
        const users = await User.findAll({
            where: {
                [Op.or]: [
                    { userName: { [Op.like]: `%${searchTerm}%` } },
                    { userMail: { [Op.like]: `%${searchTerm}%` } },
                    { userNumber: { [Op.like]: `%${searchTerm}%` } }
                ]
            },
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });

        return users;
    }
}

module.exports = new UserService();
