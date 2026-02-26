// middleware/auth.js - Cookie-Based Authentication
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Cookie-based authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        console.log('🔐 Authentication middleware triggered');
        console.log('Cookies:', req.cookies ? 'Cookies present' : 'No cookies');

        // Get token from cookie
        const token = req.cookies?.authToken;

        if (!token || token === 'null' || token === 'undefined') {
            console.log('❌ No auth token in cookies');
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        console.log('🎫 Token extracted from cookie');

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ Token verified for user:', decoded.email);

        // Get user from database to ensure they still exist and are active
        const user = await User.findByPk(decoded.userId, {
            attributes: ['id', 'name', 'email', 'role', 'is_active'] // ✅ ADDED: Only select needed fields
        });

        if (!user) {
            console.log('❌ User not found in database:', decoded.userId);
            return res.status(401).json({
                success: false,
                message: 'Access denied. User not found.'
            });
        }

        if (!user.is_active) {
            console.log('❌ User account is inactive:', user.email);
            return res.status(401).json({
                success: false,
                message: 'Access denied. Account is inactive.'
            });
        }

        // ✅ FIXED: Consistent user object structure
        req.user = {
            userId: user.id, // This matches what your routes expect
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        };

        console.log('✅ Authentication successful for:', req.user.email);
        next();

    } catch (error) {
        console.error('💥 Auth middleware error:', error.message);

        // Handle specific JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Invalid token.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Token expired.'
            });
        }

        // ✅ ADDED: Handle database connection errors
        if (error.name === 'SequelizeConnectionError') {
            return res.status(500).json({
                success: false,
                message: 'Database connection error.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication.'
        });
    }
};

// ✅ IMPROVED: Generic role middleware
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            console.log('❌ No authenticated user found');
            return res.status(401).json({
                success: false,
                message: 'Access denied. Authentication required.'
            });
        }

        const userRole = req.user.role;
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (!roles.includes(userRole)) {
            console.log('❌ Role access denied. User role:', userRole, 'Required:', roles);
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }

        console.log('✅ Role access granted for:', req.user.email);
        next();
    };
};

// Admin role middleware
const requireAdmin = (req, res, next) => {
    return requireRole('admin')(req, res, next);
};

// Teacher or Admin role middleware
const requireTeacherOrAdmin = (req, res, next) => {
    return requireRole(['teacher', 'admin'])(req, res, next);
};

// ✅ ADDED: Lab Assistant or Admin role middleware
const requireLabAssistantOrAdmin = (req, res, next) => {
    return requireRole(['lab_assistant', 'admin'])(req, res, next);
};

// ✅ ADDED: Lab Technician or Admin role middleware
const requireLabTechnicianOrAdmin = (req, res, next) => {
    return requireRole(['lab_technician', 'admin'])(req, res, next);
};

// Student, Teacher, or Admin role middleware (authenticated users)
const requireAuthenticated = authenticateToken;

// Optional authentication middleware (doesn't block if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.substring(7);

        if (!token || token === 'null' || token === 'undefined') {
            req.user = null;
            return next();
        }

        // Try to verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findByPk(decoded.userId, {
            attributes: ['id', 'name', 'email', 'role', 'is_active']
        });

        if (user && user.is_active) {
            req.user = {
                userId: user.id,
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name
            };
        } else {
            req.user = null;
        }

        next();
    } catch (error) {
        // If token is invalid, continue without authentication
        req.user = null;
        next();
    }
};

module.exports = {
    authenticateToken,
    requireRole, // ✅ ADDED: Export the generic role middleware
    requireAdmin,
    requireTeacherOrAdmin,
    requireLabAssistantOrAdmin, // ✅ ADDED
    requireLabTechnicianOrAdmin, // ✅ ADDED
    requireAuthenticated,
    optionalAuth
};