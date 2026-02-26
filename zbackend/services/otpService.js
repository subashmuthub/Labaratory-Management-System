const User = require('../models/User');
const emailService = require('./emailService');

class OtpService {
    async sendOtp(email, purpose = 'verification') {
        // Find user by email
        const user = await User.findOne({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Check rate limiting - prevent spam
        if (user.otp_expires_at && new Date() < user.otp_expires_at) {
            const timeRemaining = Math.ceil((user.otp_expires_at - new Date()) / 1000);
            if (timeRemaining > 540) { // If more than 9 minutes remaining, don't send new OTP
                throw new Error(`Please wait ${Math.ceil(timeRemaining / 60)} minutes before requesting a new OTP`);
            }
        }

        // Generate and save OTP
        const otp = await user.generateOTP(purpose);

        // Send OTP email
        await emailService.sendOTP(user.email, otp, purpose);

        return {
            email: user.email,
            expiresIn: 600 // 10 minutes in seconds
        };
    }

    async verifyOtp(email, otp) {
        const user = await User.findOne({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Check if OTP exists and is not expired
        if (!user.otp || !user.otp_expires_at) {
            throw new Error('No OTP found. Please request a new one');
        }

        if (new Date() > user.otp_expires_at) {
            throw new Error('OTP has expired. Please request a new one');
        }

        // Verify OTP
        const isValid = await user.verifyOTP(otp);

        if (!isValid) {
            throw new Error('Invalid OTP');
        }

        // Clear OTP after successful verification
        user.otp = null;
        user.otp_expires_at = null;
        user.otp_verified = true;
        await user.save();

        return {
            verified: true,
            email: user.email,
            userId: user.id
        };
    }

    async resendOtp(email, purpose = 'verification') {
        // Simply call sendOtp - it already handles rate limiting
        return await this.sendOtp(email, purpose);
    }

    async verifyAndActivateAccount(email, otp) {
        // Verify OTP first
        const verification = await this.verifyOtp(email, otp);

        // Activate user account if not already active
        const user = await User.findByPk(verification.userId);
        
        if (!user.is_active) {
            user.is_active = true;
            await user.save();
        }

        return {
            verified: true,
            activated: true,
            email: user.email
        };
    }

    async checkOtpStatus(email) {
        const user = await User.findOne({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            throw new Error('User not found');
        }

        const hasOtp = !!user.otp;
        const isExpired = user.otp_expires_at ? new Date() > user.otp_expires_at : true;
        const timeRemaining = user.otp_expires_at && !isExpired 
            ? Math.ceil((user.otp_expires_at - new Date()) / 1000) 
            : 0;

        return {
            hasOtp,
            isExpired,
            timeRemaining,
            canRequestNew: !hasOtp || isExpired || timeRemaining < 540
        };
    }
}

module.exports = new OtpService();
