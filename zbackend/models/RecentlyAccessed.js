const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RecentlyAccessed = sequelize.define('RecentlyAccessed', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    item_type: {
        type: DataTypes.ENUM('equipment', 'lab', 'booking', 'maintenance', 'report', 'user'),
        allowNull: false
    },
    item_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    item_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    item_description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    access_count: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    last_accessed: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'recently_accessed',
    timestamps: true, // This will create created_at and updated_at
    indexes: [
        {
            fields: ['user_id', 'last_accessed'],
            name: 'idx_user_accessed'
        },
        {
            fields: ['user_id', 'item_type', 'item_id'],
            unique: true,
            name: 'unique_user_item'
        },
        {
            fields: ['item_type'],
            name: 'idx_item_type'
        }
    ]
});

module.exports = RecentlyAccessed;