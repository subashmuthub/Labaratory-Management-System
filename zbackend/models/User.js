import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

const User = sequelize.define(
  'User',
  {
    userId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'departmentId',
      },
      onDelete: 'SET NULL',
    },
    userNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Unique identifier like employee ID, student ID',
    },
    userName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    userMail: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: 'Must be a valid email address',
        },
      },
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'roleId',
      },
      onDelete: 'RESTRICT',
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active',
    },
    profileImage: {
      type: DataTypes.STRING(500),
      defaultValue: '/uploads/default.jpg',
    },
    googleId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      comment: 'Google account ID for OAuth authentication',
    },
    authProvider: {
      type: DataTypes.ENUM('local', 'google'),
      defaultValue: 'local',
      comment: 'Authentication provider used by the user',
    },
    resetPasswordToken: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resetOTP: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'OTP code for password reset',
    },
    resetOTPExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'OTP expiration timestamp',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // Remove references - just store the ID
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // Remove references - just store the ID
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    tableName: 'users',
    freezeTableName: true,
    indexes: [
      {
        unique: true,
        fields: ['userMail'],
      },
      {
        unique: true,
        fields: ['userNumber'],
      },
      {
        fields: ['roleId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['departmentId'],
      },
      {
        fields: ['companyId'],
      },
    ],
  }
);

User.associate = (models) => {
  User.belongsTo(models.Role, {
    foreignKey: 'roleId',
    as: 'role',
  });

  User.belongsTo(models.Department, {
    foreignKey: 'departmentId',
    as: 'department',
  });

  User.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator',
    constraints: false, // No DB-level constraint
  });

  User.belongsTo(models.User, {
    foreignKey: 'updatedBy',
    as: 'updater',
    constraints: false, // No DB-level constraint
  });
};

export default User;
