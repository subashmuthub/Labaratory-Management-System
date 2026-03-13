const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const User = require('../models/User').default ?? require('../models/User');
const { createSession, getSession, deleteSession } = require('../utils/sessionManager');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Role mapping for backward compatibility
const ROLE_MAP = { 1: 'student', 2: 'faculty', 3: 'teacher', 4: 'lab_assistant', 5: 'lab_technician', 6: 'admin' };

// Gmail OTP Storage (In production, use Redis or database)
const otpStore = new Map();

// DEV DEBUG ENDPOINT: expose OTP for an email (only in non-production)
// WARNING: This endpoint is for local testing only. Do NOT enable in production.
router.get('/debug-get-otp', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const stored = otpStore.get(email.toLowerCase());
    if (!stored) return res.status(404).json({ success: false, message: 'OTP not found' });

    return res.json({ success: true, data: stored });
});

// Gmail transporter configuration with improved error handling
const createGmailTransporter = () => {
    try {
        // Check if Gmail credentials are configured
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            console.warn('⚠️ Gmail credentials not configured. Email functionality will not work.');
            return null;
        }

        // Validate Gmail credentials format
        if (!process.env.GMAIL_USER.includes('@gmail.com')) {
            console.warn('⚠️ GMAIL_USER should be a valid Gmail address.');
            return null;
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Verify the transporter configuration
        transporter.verify((error, success) => {
            if (error) {
                console.error('❌ Gmail transporter verification failed:', error.message);
                console.log('💡 Please check your Gmail credentials:');
                console.log('   1. Ensure GMAIL_USER is a valid Gmail address');
                console.log('   2. Ensure GMAIL_APP_PASSWORD is a valid app password (not regular password)');
                console.log('   3. Enable 2-step verification in your Google account');
                console.log('   4. Generate an app password: https://myaccount.google.com/apppasswords');
            } else {
                console.log('✅ Gmail transporter is ready to send emails');
            }
        });

        return transporter;
    } catch (error) {
        console.error('❌ Failed to create Gmail transporter:', error.message);
        return null;
    }
};

const gmailTransporter = createGmailTransporter();

// Helper function to validate ANY Gmail address (any domain with Gmail)
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Helper function to validate registration emails (ANY valid email address)
const isValidRegistrationEmail = (email) => {
    return isValidEmail(email);
};

// Helper function to validate login emails (ANY valid email address)
const isValidLoginEmail = (email) => {
    return isValidEmail(email);
};

// Helper function to generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Helper function to send OTP email using the working emailService
const sendOTPEmail = async (email, otp) => {
    try {
        const emailService = require('../services/emailService');
        console.log(`📧 Attempting to send OTP email to: ${email} using emailService`);
        
        const result = await emailService.sendOTP(email, otp, 'registration');
        console.log(`✅ OTP email sent successfully to ${email}. Message ID: ${result.messageId}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send OTP email to ${email}:`, error.message);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

// Enhanced validation
const gmailValidation = [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email address')
];

const loginEmailValidation = [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email address'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

const registerValidation = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters'),
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('role')
        .isIn(['student', 'faculty', 'teacher', 'lab_assistant', 'lab_technician', 'admin'])
        .withMessage('Invalid role')
];

// @route   GET /api/auth/test-email
// @desc    Test Gmail configuration (admin only)
router.get('/test-email', async (req, res) => {
    try {
        if (!gmailTransporter) {
            return res.status(503).json({
                success: false,
                message: 'Gmail is not configured',
                details: {
                    gmailUser: process.env.GMAIL_USER ? 'Set' : 'Not set',
                    gmailPassword: process.env.GMAIL_APP_PASSWORD ? 'Set' : 'Not set'
                }
            });
        }

        // Test the transporter
        await gmailTransporter.verify();
        
        res.json({
            success: true,
            message: 'Gmail configuration is working properly',
            details: {
                gmailUser: process.env.GMAIL_USER,
                status: 'Connected'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gmail configuration test failed',
            error: error.message
        });
    }
});

// @route   POST /api/auth/send-otp
// @desc    Send OTP to Gmail for verification
router.post('/send-otp', gmailValidation, async (req, res) => {
    try {
        console.log('📧 OTP request for:', req.body.email);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        // Check if Gmail is configured
        if (!gmailTransporter) {
            console.log('❌ Gmail not configured');
            return res.status(503).json({
                success: false,
                message: 'Email service is temporarily unavailable. Please try again later or contact administrator.',
                code: 'EMAIL_SERVICE_UNAVAILABLE'
            });
        }

        const { email } = req.body;
        const normalizedEmail = email.toLowerCase().trim();
        const otp = generateOTP();
        console.log('🔢 Generated OTP for', normalizedEmail, ':', otp);
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        // Store OTP (In production, use Redis or database)
        otpStore.set(normalizedEmail, {
            otp,
            expiresAt,
            attempts: 0
        });

        try {
            // Send OTP email with enhanced error handling
            await sendOTPEmail(email, otp);
            console.log('✅ OTP sent successfully to:', email);

            res.json({
                success: true,
                message: 'OTP sent successfully to your email. Please check your inbox and spam folder.',
                expiresIn: 600 // 10 minutes in seconds
            });
        } catch (emailError) {
            // Remove the stored OTP if email sending fails
            otpStore.delete(email.toLowerCase());
            
            console.error('❌ Email sending failed:', emailError.message);
            
            res.status(500).json({
                success: false,
                message: emailError.message || 'Failed to send OTP email. Please try again.',
                code: 'EMAIL_SEND_FAILED'
            });
        }

    } catch (error) {
        console.error('💥 OTP send error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP. Please try again.',
            code: 'INTERNAL_ERROR'
        });
    }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP for registration
router.post('/resend-otp', gmailValidation, async (req, res) => {
    try {
        const { email } = req.body;
        const emailLower = email.toLowerCase();

        console.log('🔄 Resend OTP request for:', emailLower);

        // Check if there's existing OTP data
        const existingData = otpStore.get(emailLower);
        if (!existingData) {
            return res.status(400).json({
                success: false,
                message: 'No registration session found. Please start registration again.'
            });
        }

        // Generate new OTP
        const newOtp = generateOTP();
        const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

        console.log(`🔐 Generated new OTP for ${emailLower}: ${newOtp} (expires in 10 minutes)`);

        // Update stored data with new OTP
        existingData.otp = newOtp;
        existingData.expiresAt = expiresAt;
        existingData.attempts = 0;
        existingData.verified = false;

        otpStore.set(emailLower, existingData);

        // Send OTP email
        try {
            await sendOTPEmail(email, newOtp);
            console.log(`✅ New OTP sent successfully to ${email}`);
            
            res.status(200).json({
                success: true,
                message: 'New verification code sent to your email.',
                data: {
                    email: email,
                    expires_in: 10 * 60 // 10 minutes in seconds
                }
            });
        } catch (emailError) {
            console.error('❌ Failed to send new OTP email:', emailError.message);
            
            res.status(500).json({
                success: false,
                message: emailError.message || 'Failed to send new verification email'
            });
        }

    } catch (error) {
        console.error('❌ Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend OTP. Please try again.'
        });
    }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for email verification
router.post('/verify-otp', async (req, res) => {
    try {
        let { email, otp } = req.body;

        // Input validation
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        // Normalize inputs
        email = email.toString().trim().toLowerCase();
        otp = otp.toString().trim();

        // Validate OTP format
        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: 'OTP must be exactly 6 digits'
            });
        }

        // Get stored data
        const storedData = otpStore.get(email);

        console.log('🔍 OTP verification attempt:', {
            email: email,
            providedOTP: otp,
            hasStoredData: !!storedData,
            storedOTPKeys: Array.from(otpStore.keys()),
            isExpired: storedData ? (Date.now() > storedData.expiresAt) : 'N/A'
        });

        if (!storedData) {
            console.log('❌ No OTP data found for email:', email);
            return res.status(400).json({
                success: false,
                message: 'OTP not found. Please request a new verification code.'
            });
        }

        // Check expiration
        if (Date.now() > storedData.expiresAt) {
            otpStore.delete(email);
            console.log('❌ OTP expired for:', email);
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new verification code.'
            });
        }

        // Check attempts
        if (storedData.attempts >= 3) {
            otpStore.delete(email);
            console.log('❌ Too many attempts for:', email);
            return res.status(400).json({
                success: false,
                message: 'Too many failed attempts. Please request a new verification code.'
            });
        }

        // Verify OTP with exact string comparison
        const storedOTPStr = storedData.otp.toString().trim();
        const providedOTPStr = otp.toString().trim();
        
        console.log('🔍 OTP comparison:', {
            storedOTP: storedOTPStr,
            providedOTP: providedOTPStr,
            match: storedOTPStr === providedOTPStr,
            lengths: { stored: storedOTPStr.length, provided: providedOTPStr.length }
        });
        
        if (storedOTPStr !== providedOTPStr) {
            storedData.attempts = (storedData.attempts || 0) + 1;
            otpStore.set(email, storedData);
            console.log(`❌ OTP mismatch for ${email}. Attempts: ${storedData.attempts}/3`);
            return res.status(400).json({
                success: false,
                message: `Invalid OTP. ${3 - storedData.attempts} attempts remaining.`
            });
        }

        // OTP verified successfully
        storedData.verified = true;
        storedData.verifiedAt = Date.now();
        storedData.attempts = 0;
        otpStore.set(email, storedData);

        console.log('✅ OTP verified successfully for:', email);

        res.json({
            success: true,
            message: 'OTP verified successfully',
            data: {
                email: email,
                verifiedAt: storedData.verifiedAt
            }
        });

    } catch (error) {
        console.error('💥 OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during OTP verification. Please try again.'
        });
    }
});

// @route   POST /api/auth/register
// @desc    Initiate user registration and send OTP
router.post('/register', registerValidation, async (req, res) => {
    try {
        console.log('📝 Registration initiation attempt:', {
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
        const emailLower = email.toLowerCase();

        // Check if user already exists
        const existingUser = await User.findOne({
            where: { userMail: emailLower }
        });

        if (existingUser) {
            console.log('❌ User already exists:', emailLower);
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Validate email format for registration (allow any valid email)
        if (!isValidRegistrationEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

        console.log(`🔐 Generated OTP for ${emailLower}: ${otp} (expires in 10 minutes)`);

        // Store registration data temporarily with OTP
        otpStore.set(emailLower, {
            otp,
            expiresAt,
            purpose: 'registration',
            userData: {
                name: name.trim(),
                email: emailLower,
                password, // Will be hashed when user is actually created
                role: role || 'student'
            },
            attempts: 0,
            verified: false
        });

        // Send OTP email
        try {
            await sendOTPEmail(email, otp);
            console.log(`✅ OTP sent successfully to ${email}`);
            
            res.status(200).json({
                success: true,
                message: 'Registration initiated. Please check your email for the verification code.',
                data: {
                    email: email,
                    expires_in: 10 * 60 // 10 minutes in seconds
                }
            });
        } catch (emailError) {
            console.error('❌ Failed to send OTP email:', emailError.message);
            // Clean up stored data if email fails
            otpStore.delete(emailLower);
            
            res.status(500).json({
                success: false,
                message: emailError.message || 'Failed to send verification email'
            });
        }

    } catch (error) {
        console.error('❌ Registration initiation error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
});

// @route   POST /api/auth/register-with-otp
// @desc    Register user after OTP verification
router.post('/register-with-otp', registerValidation, async (req, res) => {
    try {
        console.log('📝 Registration with OTP attempt:', {
            name: req.body.name,
            email: req.body.email,
            role: req.body.role,
            otpProvided: req.body.otp ? '***' + req.body.otp.slice(-2) : 'No OTP'
        });

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            console.log('📋 Received data:', {
                name: req.body.name,
                email: req.body.email,
                passwordLength: req.body.password ? req.body.password.length : 0,
                role: req.body.role,
                otp: req.body.otp
            });
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, email, password, role, otp } = req.body;

        // Normalize email
        const emailLower = email.toString().trim().toLowerCase();
        const storedData = otpStore.get(emailLower);

        console.log('🔍 Registration attempt for:', emailLower, {
            hasStoredData: !!storedData,
            isVerified: storedData?.verified,
            isExpired: storedData ? (Date.now() > storedData.expiresAt) : 'N/A'
        });

        if (!storedData) {
            console.log('❌ No OTP data found for:', emailLower);
            return res.status(400).json({
                success: false,
                message: 'OTP session not found. Please start the registration process again.'
            });
        }

        // Check if OTP was properly verified
        if (!storedData.verified) {
            console.log('❌ OTP not verified for:', emailLower);
            return res.status(400).json({
                success: false,
                message: 'Email verification required. Please verify your OTP first.'
            });
        }

        // Check if verification is still valid (allow 30 minutes after verification)
        const verificationTimeout = 30 * 60 * 1000; // 30 minutes
        if (storedData.verifiedAt && (Date.now() - storedData.verifiedAt) > verificationTimeout) {
            otpStore.delete(emailLower);
            console.log('❌ OTP verification expired for:', emailLower);
            return res.status(400).json({
                success: false,
                message: 'Email verification has expired. Please start the registration process again.'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            where: { userMail: emailLower }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Map old role enum to new roleId
        const roleToRoleId = { student: 1, faculty: 2, teacher: 3, lab_assistant: 4, lab_technician: 5, admin: 6 };
        const selectedRole = role || 'student';

        // Generate unique userNumber (format: USR + timestamp + random)
        const userNumber = `USR${Date.now()}${Math.floor(Math.random() * 1000)}`;

        // Create user with new schema
        const newUser = await User.create({
            userName: name.trim(),
            userMail: emailLower,
            password: hashedPassword,
            roleId: roleToRoleId[selectedRole] || 1,
            userNumber: userNumber,
            status: 'Active'
        });

        // OTP already removed after verification above

        // Create session
        const sessionId = createSession(newUser);

        // Set HTTP-only cookie with session ID
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        const userData = {
            id: newUser.userId,
            userId: newUser.userId,
            name: newUser.userName,
            email: newUser.userMail,
            role: ROLE_MAP[newUser.roleId],
            status: newUser.status,
            createdAt: newUser.createdAt
        };

        console.log('✅ User registered successfully with OTP verification:', newUser.userId);

        // Clean up the verified OTP
        otpStore.delete(emailLower);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: userData
            }
        });

    } catch (error) {
        console.error('💥 Registration error:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        if (error.errors) {
            console.error('Validation errors:', error.errors);
        }
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   POST /api/auth/login-with-otp
// @desc    Login user with OTP verification
router.post('/login-with-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        if (!isValidLoginEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please use a valid Gmail or NEC email address'
            });
        }

        const emailLower = email.toLowerCase();

        // Verify OTP
        const storedData = otpStore.get(emailLower);
        if (!storedData || storedData.otp !== otp.toString() || Date.now() > storedData.expiresAt) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP'
            });
        }

        // Find user
        const user = await User.findOne({
            where: { userMail: emailLower }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.status !== 'Active') {
            return res.status(400).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Remove OTP from store
        otpStore.delete(emailLower);

        // Create session
        const sessionId = createSession(user);

        // Set HTTP-only cookie with session ID
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        const userData = {
            id: user.userId,
            userId: user.userId,
            name: user.userName,
            email: user.userMail,
            role: ROLE_MAP[user.roleId],
            status: user.status
        };

        console.log('✅ OTP login successful for:', email);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userData
            }
        });

    } catch (error) {
        console.error('💥 OTP login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

// @route   GET /api/auth/oauth/google
// @desc    Initiate Google OAuth
router.get('/oauth/google', (req, res) => {
    // Enhanced OAuth configuration checks
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    console.log('🔍 Google OAuth request - checking configuration...');
    console.log(`   Client ID: ${clientId ? clientId.substring(0, 12) + '...' : 'NOT SET'}`);
    console.log(`   Client Secret: ${clientSecret ? 'SET (hidden)' : 'NOT SET'}`);
    
    // Check if OAuth credentials are missing
    if (!clientId || !clientSecret) {
        console.log('❌ Google OAuth credentials not configured');
        return res.status(501).json({
            success: false,
            message: 'Google OAuth is not configured. Please set up Google Cloud Console credentials.',
            details: {
                clientIdSet: !!clientId,
                clientSecretSet: !!clientSecret,
                setupGuide: 'See GOOGLE_OAUTH_SETUP_GUIDE.md for setup instructions'
            }
        });
    }
    
    // Check if Client ID has incorrect format (GitHub OAuth ID)
    if (clientId.startsWith('Ov23') || !clientId.includes('.apps.googleusercontent.com')) {
        console.log('❌ Google OAuth Client ID appears to be incorrect format (possibly GitHub OAuth ID)');
        return res.status(501).json({
            success: false,
            message: 'Google OAuth Client ID appears to be invalid. Expected Google format: xxx.apps.googleusercontent.com',
            details: {
                currentClientId: clientId.substring(0, 20) + '...',
                expectedFormat: 'xxx.apps.googleusercontent.com',
                setupGuide: 'Please check GOOGLE_OAUTH_SETUP_GUIDE.md for correct setup'
            }
        });
    }

    // Dynamic redirect URI based on current server configuration
    const serverPort = process.env.PORT || 5000;
    const redirectUri = `http://localhost:${serverPort}/api/auth/oauth/google/callback`;
    
    console.log(`🔗 Google OAuth initiated with redirect URI: ${redirectUri}`);

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=openid email profile&` +
        `state=${crypto.randomBytes(32).toString('hex')}`;

    console.log('✅ Google OAuth URL generated successfully');

    res.json({
        success: true,
        authUrl: googleAuthUrl
    });
});

// @route   GET /api/auth/oauth/google/debug
// @desc    Debug Google OAuth configuration
router.get('/oauth/google/debug', (req, res) => {
    const serverPort = process.env.PORT || 5000;
    const redirectUri = `http://localhost:${serverPort}/api/auth/oauth/google/callback`;
    
    res.json({
        success: true,
        debug: {
            clientId: process.env.GOOGLE_CLIENT_ID ? 
                process.env.GOOGLE_CLIENT_ID.substring(0, 12) + '...' : 
                'Not configured',
            redirectUri: redirectUri,
            serverPort: serverPort,
            clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
            hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET
        }
    });
});

// @route   GET /api/auth/oauth/github
// @desc    Initiate GitHub OAuth
router.get('/oauth/github', (req, res) => {
    // Check if GitHub credentials are properly configured
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET || 
        process.env.GITHUB_CLIENT_SECRET === 'ghs_PLACEHOLDER_WILL_NEED_REAL_SECRET_FROM_GITHUB_OAUTH_APP') {
        console.log('⚠️ GitHub OAuth credentials not configured properly');
        return res.status(500).json({
            success: false,
            message: 'GitHub OAuth is not configured. Please contact administrator.',
            debug: {
                hasClientId: !!process.env.GITHUB_CLIENT_ID,
                hasClientSecret: !!process.env.GITHUB_CLIENT_SECRET && process.env.GITHUB_CLIENT_SECRET !== 'ghs_PLACEHOLDER_WILL_NEED_REAL_SECRET_FROM_GITHUB_OAUTH_APP',
                hasRedirectUri: !!process.env.GITHUB_REDIRECT_URI
            }
        });
    }

    const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
        `client_id=${process.env.GITHUB_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(process.env.GITHUB_REDIRECT_URI)}&` +
        `scope=user:email&` +
        `state=${crypto.randomBytes(32).toString('hex')}`;

    console.log('🔗 Generated GitHub OAuth URL:', githubAuthUrl);

    res.json({
        success: true,
        authUrl: githubAuthUrl
    });
});

// Import OAuth service
const OAuthService = require('../services/oauthService');

// @route   GET /api/auth/oauth/google/callback
// @desc    Handle Google OAuth callback
router.get('/oauth/google/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;
        console.log('🔗 Processing Google OAuth callback');
        console.log('📥 Callback params:', { code: code ? 'present' : 'missing', state: state ? 'present' : 'missing', error });

        // Handle OAuth errors from Google
        if (error) {
            console.error('❌ OAuth error from Google:', error);
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('OAuth authentication failed: ' + error)}`);
        }

        if (!code) {
            console.error('❌ No authorization code received');
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            return res.redirect(`${clientUrl}/login?error=${encodeURIComponent('No authorization code received')}`);
        }

        // Process Google OAuth
        const result = await OAuthService.processGoogleOAuth(code);
        console.log('📊 OAuth processing result:', { success: result.success, hasUser: !!result.data?.user });

        if (result.success && result.data?.user) {
            // DON'T set cookie here - let frontend establish session through proxy
            // This ensures cookie is set on the correct domain (localhost:5173)
            
            console.log('✅ OAuth successful for user:', {
                userId: result.data.user.id,
                email: result.data.user.email
            });
            
            // Redirect to frontend with user data in URL
            // Frontend will call establish-session endpoint to create session cookie
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            const userData = encodeURIComponent(JSON.stringify({
                id: result.data.user.id,
                name: result.data.user.name,
                email: result.data.user.email,
                role: result.data.user.role,
                avatar_url: result.data.user.avatar_url,
                department: result.data.user.department,
                phone: result.data.user.phone,
                position: result.data.user.position
            }));
            const redirectUrl = `${clientUrl}/oauth/success?user=${userData}`;
            console.log('🔄 Redirecting to frontend:', redirectUrl.substring(0, 100) + '...');
            res.redirect(redirectUrl);
        } else {
            console.error('❌ OAuth processing failed:', result.message);
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            res.redirect(`${clientUrl}/login?error=${encodeURIComponent(result.message || 'OAuth authentication failed')}`);
        }
    } catch (error) {
        console.error('💥 Google OAuth callback error:', error);
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        res.redirect(`${clientUrl}/login?error=${encodeURIComponent('OAuth processing error: ' + error.message)}`);
    }
});

// @route   GET /api/auth/oauth/github/callback
// @desc    Handle GitHub OAuth callback
router.get('/oauth/github/callback', async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
        }

        console.log('🔗 Processing GitHub OAuth callback');

        // Process GitHub OAuth
        const result = await OAuthService.processGitHubOAuth(code);

        if (result.success && result.data?.user) {
            // DON'T set cookie here - let frontend establish session through proxy
            // This ensures cookie is set on the correct domain (localhost:5173)
            
            console.log('✅ GitHub OAuth successful for user:', {
                userId: result.data.user.id,
                email: result.data.user.email
            });
            
            // Redirect to frontend with user data in URL
            // Frontend will call establish-session endpoint to create session cookie
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            const userData = encodeURIComponent(JSON.stringify({
                id: result.data.user.id,
                name: result.data.user.name,
                email: result.data.user.email,
                role: result.data.user.role,
                avatar_url: result.data.user.avatar_url,
                department: result.data.user.department,
                phone: result.data.user.phone,
                position: result.data.user.position
            }));
            const redirectUrl = `${clientUrl}/oauth/success?user=${userData}`;
            console.log('🔄 Redirecting to frontend:', redirectUrl.substring(0, 100) + '...');
            res.redirect(redirectUrl);
        } else {
            res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=${encodeURIComponent(result.message)}`);
        }

    } catch (error) {
        console.error('💥 GitHub OAuth callback error:', error);
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_server_error`);
    }
});

// Enhanced login route supporting both Gmail and NEC emails
router.post('/login', loginEmailValidation, async (req, res) => {
    try {
        console.log('🔐 Login attempt:', { email: req.body.email });

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;
        const emailLower = email.toLowerCase();

        // Find user with password included
        const user = await User.unscoped().findOne({
            where: { userMail: emailLower }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Verify password - handle both plain text and hashed passwords
        let isPasswordValid = false;
        if (user.password) {
            // Try bcrypt first (for hashed passwords)
            try {
                isPasswordValid = await bcrypt.compare(password, user.password);
            } catch (error) {
                // If bcrypt fails, try plain text comparison (for existing users)
                isPasswordValid = password === user.password;
            }
        }
        
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if account is active
        if (user.status !== 'Active') {
            return res.status(400).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Update last login timestamp
        await user.update({ last_login: new Date() });

        // Create session
        const sessionId = createSession(user);

        // Set HTTP-only cookie with session ID
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // true in production
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        const userData = {
            id: user.userId,
            userId: user.userId,
            name: user.userName,
            email: user.userMail,
            role: ROLE_MAP[user.roleId],
            status: user.status,
            profileImage: user.profileImage,
            department: user.departmentId,
            authProvider: user.authProvider
        };

        console.log('✅ Login successful for:', email);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userData
            }
        });

    } catch (error) {
        console.error('💥 Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

// @route   GET /api/auth/verify
// @desc    Verify session validity from cookie
router.get('/verify', async (req, res) => {
    try {
        const sessionId = req.cookies?.sessionId;
        
        if (!sessionId) {
            return res.status(401).json({
                success: false,
                message: 'No session provided'
            });
        }

        // Get session data
        const session = getSession(sessionId);
        
        if (!session) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired session'
            });
        }
        
        // Check if user still exists
        const user = await User.findByPk(session.userId);
        
        if (!user || user.status !== 'Active') {
            // Clean up invalid session
            deleteSession(sessionId);
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        res.json({
            success: true,
            message: 'Session is valid',
            data: {
                user: {
                    id: user.userId,
                    userId: user.userId,
                    name: user.userName,
                    email: user.userMail,
                    role: ROLE_MAP[user.roleId],
                    status: user.status,
                    profileImage: user.profileImage,
                    department: user.departmentId
                }
            }
        });

    } catch (error) {
        console.error('💥 Session verification error:', error);
        res.status(401).json({
            success: false,
            message: 'Session verification failed'
        });
    }
});

// @route   POST /api/auth/oauth/establish-session
// @desc    Establish session for OAuth authenticated user (called from frontend after OAuth redirect)
router.post('/oauth/establish-session', async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        console.log('🔐 Establishing session for OAuth user:', userId);
        
        // Find user
        const user = await User.findByPk(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.status !== 'Active') {
            return res.status(401).json({
                success: false,
                message: 'Account is inactive'
            });
        }

        // Create new session
        const sessionId = createSession(user);
        
        // Set session cookie
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        console.log('✅ Session established for user:', user.userMail);

        // Return user data
        res.json({
            success: true,
            message: 'Session established successfully',
            data: {
                user: {
                    id: user.userId,
                    userId: user.userId,
                    name: user.userName,
                    email: user.userMail,
                    role: ROLE_MAP[user.roleId],
                    status: user.status,
                    profileImage: user.profileImage,
                    department: user.departmentId
                }
            }
        });

    } catch (error) {
        console.error('💥 Error establishing session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to establish session'
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
            where: { userMail: email.toLowerCase() }
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
        console.log(`🔐 Generated temporary password for ${user.userMail}: ${tempPassword}`);

        // Hash the temporary password using bcryptjs (same as rest of the app)
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        // Update user's password
        await user.update({ password: hashedPassword });

        // In production, send email with reset link instead
        console.log(`📧 Temporary password for ${user.userMail}: ${tempPassword}`);
        
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

// @route   POST /api/auth/logout
// @desc    Logout user and clear session cookie
router.post('/logout', (req, res) => {
    const sessionId = req.cookies?.sessionId;
    
    // Clear session from store
    if (sessionId) {
        deleteSession(sessionId);
    }
    
    // Clear cookie
    res.clearCookie('sessionId', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });
    
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// NOTE: authenticateToken middleware is now imported from '../middleware/auth'
// using session-based authentication instead of JWT

// @route   GET /api/auth/profile
// @desc    Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.userId, {
            attributes: ['userId', 'userName', 'userMail', 'roleId', 'userNumber', 'departmentId', 'status', 'profileImage', 'authProvider', 'createdAt', 'updatedAt']
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                ...user.toJSON(),
                role: ROLE_MAP[user.roleId]
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message
        });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update current user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Only allow updating certain fields
        const allowedFields = ['name', 'student_id', 'department', 'phone', 'bio', 'position', 'avatar_url'];
        const updates = {};
        
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        // Handle password update separately
        if (req.body.password) {
            updates.password = await bcrypt.hash(req.body.password, 10);
        }

        await user.update(updates);

        const updatedUser = {
            id: user.userId || user.id, // Use userId as primary key
            userId: user.userId,
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

        console.log('✅ Profile updated successfully for:', req.user.email || user.email);
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
});

module.exports = router;