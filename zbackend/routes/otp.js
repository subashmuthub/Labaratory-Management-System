const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const emailService = require('../services/emailService');
const { requireAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const emailValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email')
];

const otpValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('otp')
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage('OTP must be a 6-digit number')
];

// @route   POST /api/otp/send
// @desc    Send OTP to email
// @access  Public
router.post('/send', emailValidation, async (req, res) => {
    try {
        console.log('📧 OTP send request:', { email: req.body.email, purpose: req.body.purpose });

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, purpose = 'verification' } = req.body;

        // Find user by email
        const user = await User.findOne({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check rate limiting - prevent spam
        if (user.otp_expires_at && new Date() < user.otp_expires_at) {
            const timeRemaining = Math.ceil((user.otp_expires_at - new Date()) / 1000);
            if (timeRemaining > 540) { // If more than 9 minutes remaining, don't send new OTP
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${Math.ceil(timeRemaining / 60)} minutes before requesting a new OTP`
                });
            }
        }

        // Generate and save OTP
        const otp = await user.generateOTP(purpose);

        // Send OTP email
        await emailService.sendOTP(user.email, otp, purpose);

        console.log(`✅ OTP sent successfully to ${email}`);

        res.json({
            success: true,
            message: 'OTP sent successfully to your email',
            data: {
                email: user.email,
                expires_in: 600 // 10 minutes in seconds
            }
        });

    } catch (error) {
        console.error('❌ Send OTP error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   POST /api/otp/verify
// @desc    Verify OTP
// @access  Public
router.post('/verify', otpValidation, async (req, res) => {
    try {
        console.log('🔍 OTP verification request:', { email: req.body.email });

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, otp } = req.body;

        // Find user by email with OTP data
        const user = await User.unscoped().findOne({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify OTP
        const verificationResult = user.verifyOTP(otp);

        if (!verificationResult.success) {
            // Increment failed attempts
            await user.incrementOTPAttempts();
            
            return res.status(400).json({
                success: false,
                message: verificationResult.message,
                attemptsRemaining: Math.max(0, 5 - user.otp_attempts)
            });
        }

        // OTP verified successfully
        const otpPurpose = user.otp_purpose;

        // Clear OTP data
        await user.clearOTP();

        // Handle different purposes
        if (otpPurpose === 'registration' && !user.is_email_verified) {
            // Mark email as verified for registration
            user.is_email_verified = true;
            await user.save({ fields: ['is_email_verified'] });
            
            // Send welcome email
            try {
                await emailService.sendWelcomeEmail(user.email, user.name);
            } catch (emailError) {
                console.log('⚠️ Welcome email failed, but proceeding with verification');
            }
        }

        console.log(`✅ OTP verified successfully for ${email}`);

        res.json({
            success: true,
            message: 'OTP verified successfully',
            data: {
                email: user.email,
                purpose: otpPurpose,
                email_verified: user.is_email_verified
            }
        });

    } catch (error) {
        console.error('❌ Verify OTP error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to verify OTP',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   POST /api/otp/resend
// @desc    Resend OTP (same as send but with different messaging)
// @access  Public
router.post('/resend', emailValidation, async (req, res) => {
    try {
        console.log('🔄 OTP resend request:', { email: req.body.email });

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, purpose = 'verification' } = req.body;

        // Find user by email
        const user = await User.findOne({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate and save new OTP
        const otp = await user.generateOTP(purpose);

        // Send OTP email
        await emailService.sendOTP(user.email, otp, purpose);

        console.log(`✅ OTP resent successfully to ${email}`);

        res.json({
            success: true,
            message: 'New OTP sent successfully to your email',
            data: {
                email: user.email,
                expires_in: 600 // 10 minutes in seconds
            }
        });

    } catch (error) {
        console.error('❌ Resend OTP error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to resend OTP',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   POST /api/otp/send-password-reset
// @desc    Send password reset OTP
// @access  Public
router.post('/send-password-reset', emailValidation, async (req, res) => {
    try {
        console.log('🔒 Password reset OTP request:', { email: req.body.email });

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            // For security reasons, don't reveal if user exists or not
            return res.json({
                success: true,
                message: 'If an account with this email exists, a password reset OTP has been sent'
            });
        }

        // Generate OTP for password reset
        const otp = await user.generateOTP('password-reset');

        // Send password reset OTP
        await emailService.sendOTP(user.email, otp, 'password-reset');

        console.log(`✅ Password reset OTP sent to ${email}`);

        res.json({
            success: true,
            message: 'Password reset OTP sent to your email',
            data: {
                expires_in: 600 // 10 minutes in seconds
            }
        });

    } catch (error) {
        console.error('❌ Send password reset OTP error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to send password reset OTP',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   POST /api/otp/reset-password
// @desc    Reset password with OTP
// @access  Public
router.post('/reset-password', [
    ...otpValidation,
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('New password must be at least 6 characters long')
], async (req, res) => {
    try {
        console.log('🔑 Password reset with OTP:', { email: req.body.email });

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, otp, newPassword } = req.body;

        // Find user by email
        const user = await User.unscoped().findOne({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify OTP and check if it's for password reset
        const verificationResult = user.verifyOTP(otp);

        if (!verificationResult.success) {
            await user.incrementOTPAttempts();
            return res.status(400).json({
                success: false,
                message: verificationResult.message,
                attemptsRemaining: Math.max(0, 5 - user.otp_attempts)
            });
        }

        if (user.otp_purpose !== 'password-reset') {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP purpose for password reset'
            });
        }

        // Reset password
        await user.setPassword(newPassword);
        
        // Clear OTP
        await user.clearOTP();
        
        // Clear any password reset tokens
        await user.clearPasswordResetToken();

        console.log(`✅ Password reset successfully for ${email}`);

        res.json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error('❌ Reset password error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to reset password',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// @route   GET /api/otp/status
// @desc    Get OTP status for user (requires authentication)
// @access  Private
router.get('/status', requireAuthenticated, async (req, res) => {
    try {
        const user = await User.unscoped().findByPk(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const hasActiveOTP = user.otp_code && user.otp_expires_at && new Date() < user.otp_expires_at;
        const timeRemaining = hasActiveOTP ? Math.ceil((user.otp_expires_at - new Date()) / 1000) : 0;

        res.json({
            success: true,
            data: {
                has_active_otp: hasActiveOTP,
                time_remaining: timeRemaining,
                attempts_remaining: hasActiveOTP ? Math.max(0, 5 - user.otp_attempts) : 5,
                email_verified: user.is_email_verified,
                purpose: user.otp_purpose
            }
        });

    } catch (error) {
        console.error('❌ Get OTP status error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to get OTP status',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router;