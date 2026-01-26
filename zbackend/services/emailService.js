const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        // Determine which email configuration to use
        const emailUser = process.env.NEW_GMAIL_USER || process.env.GMAIL_USER;
        const emailPass = process.env.NEW_GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD;
        
        console.log(`📧 Initializing email service with: ${emailUser}`);
        
        // Initialize the transporter with Gmail configuration
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: emailUser,
                pass: emailPass
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        
        this.fromEmail = emailUser;
    }

    // Generate a random 6-digit OTP
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Send OTP email
    async sendOTP(email, otp, purpose = 'verification') {
        try {
            const mailOptions = {
                from: this.fromEmail,
                to: email,
                subject: `${this.getSubjectByPurpose(purpose)} - Laboratory Management System`,
                html: this.getOTPEmailTemplate(otp, purpose)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ OTP email sent successfully from ${this.fromEmail} to ${email}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('❌ Error sending OTP email:', error);
            throw new Error('Failed to send OTP email');
        }
    }

    // Send welcome email after registration
    async sendWelcomeEmail(email, name) {
        try {
            const mailOptions = {
                from: this.fromEmail,
                to: email,
                subject: 'Welcome to Laboratory Management System',
                html: this.getWelcomeEmailTemplate(name)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Welcome email sent successfully to ${email}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('❌ Error sending welcome email:', error);
            // Don't throw error for welcome email failure
            return { success: false, error: error.message };
        }
    }

    // Send password reset email
    async sendPasswordResetEmail(email, resetToken, name) {
        try {
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
            
            const mailOptions = {
                from: process.env.GMAIL_USER,
                to: email,
                subject: 'Password Reset - Laboratory Management System',
                html: this.getPasswordResetEmailTemplate(name, resetUrl)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Password reset email sent successfully to ${email}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error('❌ Error sending password reset email:', error);
            throw new Error('Failed to send password reset email');
        }
    }

    // Get subject by purpose
    getSubjectByPurpose(purpose) {
        switch (purpose) {
            case 'registration':
                return 'Email Verification Code';
            case 'login':
                return 'Login Verification Code';
            case 'password-reset':
                return 'Password Reset Code';
            default:
                return 'Verification Code';
        }
    }

    // OTP email template
    getOTPEmailTemplate(otp, purpose) {
        const purposeText = this.getPurposeText(purpose);
        
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OTP Verification</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; margin-top: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #3b82f6;">
                    <h1 style="color: #3b82f6; margin: 0; font-size: 24px;">🧪 Laboratory Management System</h1>
                </div>
                
                <!-- Content -->
                <div style="padding: 30px 0; text-align: center;">
                    <h2 style="color: #1f2937; margin-bottom: 20px;">Verification Code</h2>
                    <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                        ${purposeText}
                    </p>
                    
                    <!-- OTP Code -->
                    <div style="background-color: #f8fafc; border: 2px dashed #3b82f6; border-radius: 10px; padding: 20px; margin: 20px 0;">
                        <div style="font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 5px; font-family: monospace;">
                            ${otp}
                        </div>
                    </div>
                    
                    <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">
                        ⚠️ This code will expire in 10 minutes
                    </p>
                </div>
                
                <!-- Security Note -->
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                    <p style="color: #92400e; margin: 0; font-size: 14px;">
                        <strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask for this code.
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                    <p>This is an automated message from Laboratory Management System</p>
                    <p>If you didn't request this verification, please ignore this email.</p>
                </div>
                
            </div>
        </body>
        </html>
        `;
    }

    // Welcome email template
    getWelcomeEmailTemplate(name) {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; margin-top: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #10b981;">
                    <h1 style="color: #10b981; margin: 0; font-size: 24px;">🧪 Laboratory Management System</h1>
                </div>
                
                <!-- Content -->
                <div style="padding: 30px 0; text-align: center;">
                    <h2 style="color: #1f2937; margin-bottom: 20px;">Welcome, ${name}! 🎉</h2>
                    <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                        Thank you for joining the Laboratory Management System. Your account has been successfully created and verified.
                    </p>
                    
                    <!-- Features -->
                    <div style="text-align: left; margin: 20px 0;">
                        <h3 style="color: #1f2937; margin-bottom: 15px;">What you can do:</h3>
                        <ul style="color: #6b7280; line-height: 1.8;">
                            <li>📋 Manage laboratory equipment and bookings</li>
                            <li>📊 View reports and analytics</li>
                            <li>👥 Collaborate with team members</li>
                            <li>📱 Access from any device</li>
                        </ul>
                    </div>
                    
                    <div style="margin-top: 30px;">
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                            Get Started
                        </a>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                    <p>Welcome to the Laboratory Management System!</p>
                    <p>If you have any questions, feel free to contact our support team.</p>
                </div>
                
            </div>
        </body>
        </html>
        `;
    }

    // Password reset email template
    getPasswordResetEmailTemplate(name, resetUrl) {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; margin-top: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #ef4444;">
                    <h1 style="color: #ef4444; margin: 0; font-size: 24px;">🧪 Laboratory Management System</h1>
                </div>
                
                <!-- Content -->
                <div style="padding: 30px 0; text-align: center;">
                    <h2 style="color: #1f2937; margin-bottom: 20px;">Password Reset Request</h2>
                    <p style="color: #6b7280; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                        Hello ${name}, <br><br>
                        We received a request to reset your password. Click the button below to create a new password.
                    </p>
                    
                    <div style="margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                            Reset Password
                        </a>
                    </div>
                    
                    <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">
                        ⚠️ This link will expire in 1 hour
                    </p>
                </div>
                
                <!-- Security Note -->
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                    <p style="color: #92400e; margin: 0; font-size: 14px;">
                        <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email.
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                    <p>This is an automated message from Laboratory Management System</p>
                </div>
                
            </div>
        </body>
        </html>
        `;
    }

    // Get purpose text for OTP emails
    getPurposeText(purpose) {
        switch (purpose) {
            case 'registration':
                return 'Please use the following code to verify your email address and complete your registration:';
            case 'login':
                return 'Please use the following code to securely log in to your account:';
            case 'password-reset':
                return 'Please use the following code to reset your password:';
            default:
                return 'Please use the following verification code:';
        }
    }

    // Test email configuration
    async testConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Email service is ready');
            return true;
        } catch (error) {
            console.error('❌ Email service configuration error:', error);
            return false;
        }
    }
}

module.exports = new EmailService();