import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

const Department = sequelize.define(
  'Department',
  {
    departmentId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    departmentName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Full name of the department',
    },
    departmentAcr: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: 'Short code / abbreviation',
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Archived'),
      allowNull: false,
      defaultValue: 'Active',
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // Remove references
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      // Remove references
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
    tableName: 'departments',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['companyId', 'departmentName'],
        name: 'unique_company_department_name',
      },
      {
        unique: true,
        fields: ['companyId', 'departmentAcr'],
        name: 'unique_company_department_acr',
      },
      {
        fields: ['companyId', 'status'],
        name: 'idx_company_department_status',
      },
    ],
  }
);

Department.associate = (models) => {
  Department.belongsTo(models.User, {
    foreignKey: 'createdBy',
    as: 'creator',
    constraints: false, // No DB-level constraint
  });

  Department.belongsTo(models.User, {
    foreignKey: 'updatedBy',
    as: 'updater',
    constraints: false, // No DB-level constraint
  });

  Department.hasMany(models.User, {
    foreignKey: 'departmentId',
    as: 'users',
  });
};

export default Department;
