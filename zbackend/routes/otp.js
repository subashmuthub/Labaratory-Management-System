const express = require('express');
const { body, validationResult } = require('express-validator');
const otpService = require('../services/otpService');

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
        const result = await otpService.sendOtp(email, purpose);

        console.log(`✅ OTP sent successfully to ${email}`);
        res.json({
            success: true,
            message: 'OTP sent successfully to your email',
            data: result
        });
    } catch (error) {
        console.error('💥 OTP send error:', error.message);

        if (error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message.includes('wait')) {
            return res.status(429).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to send OTP',
            error: error.message
        });
    }
});

// @route   POST /api/otp/verify
// @desc    Verify OTP
// @access  Public
router.post('/verify', otpValidation, async (req, res) => {
    try {
        console.log('🔐 OTP verification request:', { email: req.body.email });

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, otp } = req.body;
        const result = await otpService.verifyOtp(email, otp);

        console.log(`✅ OTP verified successfully for ${email}`);
        res.json({
            success: true,
            message: 'OTP verified successfully',
            data: result
        });
    } catch (error) {
        console.error('💥 OTP verification error:', error.message);

        if (error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message.includes('expired') || error.message.includes('Invalid OTP') || error.message.includes('No OTP found')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to verify OTP',
            error: error.message
        });
    }
});

// @route   POST /api/otp/resend
// @desc    Resend OTP
// @access  Public
router.post('/resend', emailValidation, async (req, res) => {
    try {
        console.log('📧 OTP resend request:', { email: req.body.email });

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, purpose = 'verification' } = req.body;
        const result = await otpService.resendOtp(email, purpose);

        console.log(`✅ OTP resent successfully to ${email}`);
        res.json({
            success: true,
            message: 'OTP resent successfully',
            data: result
        });
    } catch (error) {
        console.error('💥 OTP resend error:', error.message);

        if (error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message.includes('wait')) {
            return res.status(429).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to resend OTP',
            error: error.message
        });
    }
});

// @route   POST /api/otp/verify-and-activate
// @desc    Verify OTP and activate account
// @access  Public
router.post('/verify-and-activate', otpValidation, async (req, res) => {
    try {
        console.log('🔐 OTP verify and activate request:', { email: req.body.email });

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, otp } = req.body;
        const result = await otpService.verifyAndActivateAccount(email, otp);

        console.log(`✅ Account verified and activated for ${email}`);
        res.json({
            success: true,
            message: 'Account verified and activated successfully',
            data: result
        });
    } catch (error) {
        console.error('💥 OTP verify and activate error:', error.message);

        if (error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message.includes('expired') || error.message.includes('Invalid OTP') || error.message.includes('No OTP found')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to verify and activate account',
            error: error.message
        });
    }
});

// @route   GET /api/otp/status
// @desc    Check OTP status
// @access  Public
router.get('/status', async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const status = await otpService.checkOtpStatus(email);

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Error checking OTP status:', error);

        if (error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to check OTP status',
            error: error.message
        });
    }
});

module.exports = router;
