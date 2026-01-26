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
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 100]
        }
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            notEmpty: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: true, // Allow null for OAuth users
        validate: {
            // Custom validator to require password for non-OAuth users
            passwordRequired(value) {
                // If user has OAuth IDs, password can be null
                if (this.google_id || this.github_id || this.facebook_id) {
                    return;
                }
                // For regular users, password is required
                if (!value || value.length < 6) {
                    throw new Error('Password is required and must be at least 6 characters long');
                }
            }
        }
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
    // OAuth provider fields
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
    // OTP fields
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
    // Password reset token for additional security
    reset_password_token: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    reset_password_expires: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',

    indexes: [
        { unique: true, fields: ['email'] },
        { 
            unique: true, 
            fields: ['student_id'],
            where: { student_id: { [Op.ne]: null } }
        },
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

// No password hashing - return plain text
User.hashPassword = async function (plainPassword) {
    return plainPassword;
};

// Instance methods - using plain text password comparison
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

// OTP-related methods
User.prototype.generateOTP = async function (purpose = 'verification') {
    const emailService = require('../services/emailService');
    const otp = emailService.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

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
    console.log('🔍 OTP verification:', {
        hasCode: !!this.otp_code,
        hasExpiry: !!this.otp_expires_at,
        attempts: this.otp_attempts,
        expired: this.otp_expires_at ? new Date() > this.otp_expires_at : 'no expiry',
        codeMatch: this.otp_code === enteredOTP.toString()
    });

    // Check if OTP exists and hasn't expired
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
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

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

    return { success: true, message: 'Reset token verified.' };
};

User.prototype.clearPasswordResetToken = async function () {
    this.reset_password_token = null;
    this.reset_password_expires = null;

    await this.save({ 
        fields: ['reset_password_token', 'reset_password_expires'] 
    });
};

// Static methods
User.findByEmailWithPassword = async function (email) {
    return await this.unscoped().findOne({
        where: {
            email: email.toLowerCase(),
            is_active: true
        }
    });
};

User.getStats = async function () {
    const totalUsers = await this.count();
    const activeUsers = await this.count({ where: { is_active: true } });
    const usersByRole = await this.findAll({
        attributes: ['role', [sequelize.fn('COUNT', sequelize.col('role')), 'count']],
        group: ['role']
    });

    return {
        total: totalUsers,
        active: activeUsers,
        byRole: usersByRole.reduce((acc, user) => {
            acc[user.role] = parseInt(user.dataValues.count);
            return acc;
        }, {})
    };
};

// No password hashing - using plain text for simplicity
module.exports = User;