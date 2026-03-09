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
        const user = await User.unscoped().findByPk(session.userId, {
            attributes: { exclude: ['password', 'otp_code', 'otp_expires_at', 'reset_password_token'] }
        });

        if (!user) {
            console.log('❌ User not found in database:', session.userId);
            return res.status(401).json({
                success: false,
                message: 'Access denied. User not found.'
            });
        }

        // Check if user is active (supports both old and new fields)
        const isActive = user.is_active === true || user.is_active === 1 || user.status === 'Active';
        if (!isActive) {
            console.log('❌ User account is inactive:', user.email);
            return res.status(401).json({
                success: false,
                message: 'Access denied. Account is inactive.'
            });
        }

        // Set user object — both old fields (backward compat) and new RBAC fields
        req.user = {
            // Old fields
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            is_active: user.is_active,
            department: user.department,
            phone: user.phone,
            position: user.position,
            student_id: user.student_id,
            avatar_url: user.avatar_url,
            is_email_verified: user.is_email_verified,
            // New RBAC fields
            userId: user.userId || user.id,
            userName: user.userName || user.name,
            userMail: user.userMail || user.email,
            roleId: user.roleId,
            departmentId: user.departmentId,
            companyId: user.companyId,
            userNumber: user.userNumber,
            status: user.status,
            profileImage: user.profileImage || user.avatar_url,
            authProvider: user.authProvider
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

        // Normalize role values to match database ENUM (handle spaces and underscores)
        const normalizedUserRole = userRole ? userRole.toLowerCase().replace(/ /g, '_') : '';
        const normalizedRoles = roles.map(r => r.toLowerCase().replace(/ /g, '_'));

        // Check if user's role matches any of the allowed roles
        const hasAccess = normalizedRoles.includes(normalizedUserRole);

        if (!hasAccess) {
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