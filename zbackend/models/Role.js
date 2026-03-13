import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

const Role = sequelize.define(
  'Role',
  {
    roleId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    roleName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Role name (e.g., "Staff", "Admin", "Department Admin")',
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      allowNull: false,
      defaultValue: 'Active',
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
    tableName: 'roles',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['roleName'],
        name: 'unique_role_name',
      },
      {
        fields: ['status'],
        name: 'idx_role_status',
      },
    ],
  }
);

// Define associations (keep these for Sequelize queries)
Role.associate = (models) => {
  Role.belongsTo(models.User, {
    as: 'creator',
    foreignKey: 'createdBy',
    constraints: false, // Important: no DB-level constraint
  });

  Role.belongsTo(models.User, {
    as: 'updater',
    foreignKey: 'updatedBy',
    constraints: false, // Important: no DB-level constraint
  });

  Role.hasMany(models.User, {
    as: 'users',
    foreignKey: 'roleId',
  });
};

export default Role;
