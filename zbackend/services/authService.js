const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const emailService = require('./emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

class AuthService {
    generateToken(user) {
        return jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
    }

    async register(userData) {
        const { name, email, password, role, student_id, department, phone } = userData;

        // Check if user already exists
        const existingUser = await User.findOne({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || 'student',
            student_id: student_id || null,
            department: department || null,
            phone: phone || null,
            is_active: true
        });

        // Send welcome email
        try {
            await emailService.sendWelcomeEmail(user.email, user.name);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
        }

        // Generate token
        const token = this.generateToken(user);

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                student_id: user.student_id,
                department: user.department
            },
            token
        };
    }

    async login(email, password) {
        // Find user
        const user = await User.findOne({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Check if user is active
        if (!user.is_active) {
            throw new Error('Your account has been deactivated. Please contact the administrator');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid email or password');
        }

        // Update last login
        user.last_login = new Date();
        await user.save();

        // Generate token
        const token = this.generateToken(user);

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                student_id: user.student_id,
                department: user.department,
                phone: user.phone
            },
            token
        };
    }

    async getProfile(userId) {
        const user = await User.findByPk(userId, {
            attributes: ['id', 'name', 'email', 'role', 'student_id', 'department', 'phone', 'bio', 'position', 'avatar_url', 'is_active', 'last_login', 'created_at']
        });

        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    async updateProfile(userId, updateData) {
        const user = await User.findByPk(userId);

        if (!user) {
            throw new Error('User not found');
        }

        // Only allow updating certain fields
        const allowedFields = ['name', 'student_id', 'department', 'phone', 'bio', 'position', 'avatar_url'];
        const updates = {};
        
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                updates[field] = updateData[field];
            }
        }

        // Handle password update separately
        if (updateData.password) {
            updates.password = await bcrypt.hash(updateData.password, 10);
        }

        await user.update(updates);

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            student_id: user.student_id,
            department: user.department,
            phone: user.phone,
            bio: user.bio,
            position: user.position,
            avatar_url: user.avatar_url
        };
    }

    async changePassword(userId, oldPassword, newPassword) {
        const user = await User.findByPk(userId);

        if (!user) {
            throw new Error('User not found');
        }

        // Verify old password
        const isValidPassword = await bcrypt.compare(oldPassword, user.password);
        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }

        // Update password
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return true;
    }

    async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return decoded;
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    async refreshToken(userId) {
        const user = await User.findByPk(userId);

        if (!user || !user.is_active) {
            throw new Error('User not found or inactive');
        }

        return this.generateToken(user);
    }
}

module.exports = new AuthService();
