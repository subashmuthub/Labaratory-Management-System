const { DataTypes, Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: true // Allow null for OAuth users
    },
    role: {
        type: DataTypes.ENUM('student', 'faculty', 'teacher', 'lab_assistant', 'lab_technician', 'admin'),
        allowNull: false,
        defaultValue: 'student'
    },
    student_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true
    },
    department: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    position: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    is_email_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    last_login: {
        type: DataTypes.DATE,
        allowNull: true
    },
    google_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
    },
    facebook_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
    },
    github_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true
    },
    avatar_url: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    otp_code: {
        type: DataTypes.STRING(6),
        allowNull: true
    },
    otp_expires_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    otp_purpose: {
        type: DataTypes.ENUM('registration', 'login', 'password-reset', 'verification'),
        allowNull: true
    },
    otp_attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    reset_password_token: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    reset_password_expires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    companyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    departmentId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    userNumber: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    userName: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    userMail: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    roleId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('Active', 'Inactive'),
        allowNull: true,
        defaultValue: 'Active'
    },
    profileImage: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: '/uploads/default.jpg'
    },
    authProvider: {
        type: DataTypes.ENUM('local', 'google'),
        allowNull: true,
        defaultValue: 'local'
    },
    resetOTP: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    resetOTPExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    updatedBy: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    indexes: [
        { unique: true, fields: ['email'] },
        {unique: true, fields: ['student_id'], where: { student_id: { [Op.ne]: null } } },
        { unique: true, fields: ['google_id'], where: { google_id: { [Op.ne]: null } } },
        { unique: true, fields: ['facebook_id'], where: { facebook_id: { [Op.ne]: null } } },
        { unique: true, fields: ['github_id'], where: { github_id: { [Op.ne]: null } } },
        { fields: ['role'] },
        { fields: ['is_active'] },
        { fields: ['department'] }
    ],

    defaultScope: {
        attributes: {
            exclude: ['password']
        }
    },

    scopes: {
        withPassword: {
            attributes: {}
        }
    }
});

// Plain text password (no hashing)
User.hashPassword = async function (plainPassword) {
    return plainPassword;
};

// Instance methods
User.prototype.comparePassword = async function (candidatePassword) {
    try {
        const userWithPassword = await User.unscoped().findByPk(this.id);
        return candidatePassword === userWithPassword.password;
    } catch (error) {
        console.error('Password comparison error:', error);
        return false;
    }
};

User.prototype.updateLastLogin = async function () {
    this.last_login = new Date();
    return await this.save({ fields: ['last_login'] });
};

User.prototype.setPassword = async function (newPassword) {
    this.password = newPassword;
    return await this.save({ fields: ['password'] });
};

// OTP methods
User.prototype.generateOTP = async function (purpose = 'verification') {
    const emailService = require('../services/emailService');
    const otp = emailService.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    this.otp_code = otp;
    this.otp_expires_at = expiresAt;
    this.otp_purpose = purpose;
    this.otp_attempts = 0;

    await this.save({ 
        fields: ['otp_code', 'otp_expires_at', 'otp_purpose', 'otp_attempts'] 
    });

    return otp;
};

User.prototype.verifyOTP = function (enteredOTP) {
    if (!this.otp_code || !this.otp_expires_at) {
        return { success: false, message: 'No OTP found. Please request a new one.' };
    }

    if (new Date() > this.otp_expires_at) {
        return { success: false, message: 'OTP has expired. Please request a new one.' };
    }

    if (this.otp_attempts >= 5) {
        return { success: false, message: 'Too many failed attempts. Please request a new OTP.' };
    }

    if (this.otp_code !== enteredOTP.toString()) {
        return { success: false, message: 'Invalid OTP. Please try again.' };
    }

    return { success: true, message: 'OTP verified successfully.' };
};

User.prototype.incrementOTPAttempts = async function () {
    this.otp_attempts = this.otp_attempts + 1;
    await this.save({ fields: ['otp_attempts'] });
    return this.otp_attempts;
};

User.prototype.clearOTP = async function () {
    this.otp_code = null;
    this.otp_expires_at = null;
    this.otp_purpose = null;
    this.otp_attempts = 0;

    await this.save({ 
        fields: ['otp_code', 'otp_expires_at', 'otp_purpose', 'otp_attempts'] 
    });
};

User.prototype.generatePasswordResetToken = async function () {
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    this.reset_password_token = resetToken;
    this.reset_password_expires = expiresAt;

    await this.save({ 
        fields: ['reset_password_token', 'reset_password_expires'] 
    });

    return resetToken;
};

User.prototype.verifyPasswordResetToken = function (token) {
    if (!this.reset_password_token || !this.reset_password_expires) {
        return { success: false, message: 'No reset token found.' };
    }

    if (new Date() > this.reset_password_expires) {
        return { success: false, message: 'Reset token has expired.' };
    }

    if (this.reset_password_token !== token) {
        return { success: false, message: 'Invalid reset token.' };
    }

    return { success: true, message: 'Reset token is valid.' };
};

User.prototype.clearPasswordResetToken = async function () {
    this.reset_password_token = null;
    this.reset_password_expires = null;

    await this.save({ 
        fields: ['reset_password_token', 'reset_password_expires'] 
    });
};

// Static method to find user by email with password included
User.findByEmailWithPassword = async function (email) {
    try {
        return await User.scope('withPassword').findOne({
            where: {
                email: email.toLowerCase()
            }
        });
    } catch (error) {
        console.error('Error finding user by email:', error);
        throw error;
    }
};

module.exports = User;
