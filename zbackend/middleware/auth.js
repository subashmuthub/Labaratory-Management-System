// middleware/auth.js - Session-Based Authentication
const { User } = require('../models');
const { getSession } = require('../utils/sessionManager');

// Session-based authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        console.log('🔐 Authentication middleware triggered');
        console.log('Cookies:', req.cookies ? 'Cookies present' : 'No cookies');

        // Get session ID from cookie
        const sessionId = req.cookies?.sessionId;

        if (!sessionId || sessionId === 'null' || sessionId === 'undefined') {
            console.log('❌ No session ID in cookies');
            return res.status(401).json({
                success: false,
                message: 'Access denied. No session provided.'
            });
        }

        console.log('🎫 Session ID extracted from cookie');

        // Get session data
        const session = getSession(sessionId);
        
        if (!session) {
            console.log('❌ Invalid or expired session');
            return res.status(401).json({
                success: false,
                message: 'Access denied. Invalid or expired session.'
            });
        }

        console.log('✅ Session verified for user:', session.email);

        // Get user from database to ensure they still exist and are active
        const user = await User.findByPk(session.userId, {
            attributes: ['id', 'name', 'email', 'role', 'is_active']
        });

        if (!user) {
            console.log('❌ User not found in database:', session.userId);
            // Session cleanup is handled by sessionManager
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

        // Set user object for routes
        req.user = {
            userId: user.id,
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
        };

        console.log('✅ Authentication successful for:', req.user.email);
        next();

    } catch (error) {
        console.error('💥 Auth middleware error:', error.message);

        // Handle database connection errors
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

// Optional authentication middleware (doesn't block if no session)
const optionalAuth = async (req, res, next) => {
    try {
        const sessionId = req.cookies?.sessionId;

        if (!sessionId || sessionId === 'null' || sessionId === 'undefined') {
            req.user = null;
            return next();
        }

        // Try to get session
        const session = getSession(sessionId);
        
        if (!session) {
            req.user = null;
            return next();
        }

        // Get user from database
        const user = await User.findByPk(session.userId, {
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
        // If session verification fails, continue without authentication
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