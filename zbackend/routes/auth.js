const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const emailService = require('../services/emailService');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// ✅ FIXED: Added lab_technician role
const registerValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('role')
        .isIn(['student', 'teacher', 'lab_assistant', 'lab_technician', 'admin'])
        .withMessage('Invalid role')
];

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// @route   POST /api/auth/register
router.post('/register', registerValidation, async (req, res) => {
    try {
        console.log('📝 Registration attempt:', {
            name: req.body.name,
            email: req.body.email,
            role: req.body.role
        });

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, email, password, role } = req.body;

        const existingUser = await User.findOne({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            console.log('❌ User already exists:', email);
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        console.log('🔒 Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 12);

        console.log('👤 Creating new user...');
        const newUser = await User.create({
            name: name.trim(),
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || 'student',
            is_active: true,
            is_email_verified: false
        });

        console.log('✅ User created successfully:', newUser.id);

        // Generate and send verification OTP
        try {
            const otp = await newUser.generateOTP('registration');
            await emailService.sendOTP(newUser.email, otp, 'registration');
            console.log(`📧 Registration OTP sent to ${newUser.email}`);
        } catch (emailError) {
            console.log('⚠️ Failed to send registration OTP, but user created:', emailError.message);
        }

        const token = generateToken(newUser);

        const userData = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            is_active: newUser.is_active,
            is_email_verified: newUser.is_email_verified,
            created_at: newUser.created_at
        };

        console.log('🎫 Token generated, sending response...');

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please check your email for verification code.',
            data: {
                user: userData,
                token: token,
                requires_email_verification: !newUser.is_email_verified
            }
        });

    } catch (error) {
        console.error('💥 Registration error:', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors.map(err => ({
                    field: err.path,
                    message: err.message
                }))
            });
        }

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   POST /api/auth/login
router.post('/login', loginValidation, async (req, res) => {
    try {
        console.log('🔐 Login attempt for:', req.body.email);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        console.log('👤 Finding user with password...');
        const user = await User.unscoped().findOne({
            where: {
                email: email.toLowerCase(),
                is_active: true
            }
        });

        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        console.log('🔒 Comparing password...');
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.log('❌ Invalid password for:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        await user.update({ last_login: new Date() });

        const token = generateToken(user);

        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            is_active: user.is_active,
            last_login: user.last_login
        };

        console.log('✅ Login successful for:', email);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userData,
                token: token
            }
        });

    } catch (error) {
        console.error('💥 Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   POST /api/auth/logout
router.post('/logout', (req, res) => {
    console.log('🚪 Logout request received');
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

// @route   GET /api/auth/verify
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findByPk(decoded.userId);

        if (!user || !user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    is_active: user.is_active
                }
            }
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});

// @route   POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        console.log('🔐 Forgot password request:', req.body.email);

        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check if user exists
        const user = await User.findOne({
            where: { email: email.toLowerCase() }
        });

        // Always return success message for security (don't reveal if email exists)
        if (!user) {
            console.log('❌ User not found for forgot password:', email);
            return res.json({
                success: true,
                message: 'If an account with this email exists, a password reset link will be sent.'
            });
        }

        // Generate temporary password (in a real app, you'd send a secure reset token)
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        console.log(`🔐 Generated temporary password for ${user.email}: ${tempPassword}`);

        // Hash the temporary password
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        // Update user's password
        await user.update({ password: hashedPassword });

        // In production, send email with reset link instead
        console.log(`📧 Temporary password for ${user.email}: ${tempPassword}`);
        
        res.json({
            success: true,
            message: 'If an account with this email exists, a password reset link will be sent.',
            // Include temp password in development mode
            ...(process.env.NODE_ENV === 'development' && { tempPassword })
        });

    } catch (error) {
        console.error('💥 Error in forgot password:', error);
        res.status(500).json({
            success: false,
            message: 'Unable to process password reset. Please try again later.'
        });
    }
});

// @route   GET /api/auth/test
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Auth routes are working!',
        timestamp: new Date().toISOString(),
        availableEndpoints: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            logout: 'POST /api/auth/logout',
            verify: 'GET /api/auth/verify',
            test: 'GET /api/auth/test'
        }
    });
});

// OAuth status endpoint
router.get('/oauth/status', (req, res) => {
    res.json({
        success: true,
        message: 'OAuth configuration endpoints available',
        providers: ['google', 'facebook', 'github'],
        configured: process.env.GOOGLE_CLIENT_ID ? true : false
    });
});

module.exports = router;