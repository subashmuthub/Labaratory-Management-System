const { sequelize } = require('../config/database');
const { DataTypes, Op } = require('sequelize');

// Define RecentlyAccessed model
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
        }
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
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'recently_accessed',
    timestamps: true,
    indexes: [
        { fields: ['user_id', 'item_type', 'item_id'], unique: true },
        { fields: ['user_id', 'last_accessed'] },
        { fields: ['item_type'] }
    ]
});

class RecentlyAccessedService {
    async trackAccess(userId, itemType, itemId, itemName, itemDescription = '') {
        try {
            const [record, created] = await RecentlyAccessed.findOrCreate({
                where: {
                    user_id: userId,
                    item_type: itemType,
                    item_id: itemId
                },
                defaults: {
                    item_name: itemName,
                    item_description: itemDescription,
                    access_count: 1,
                    last_accessed: new Date()
                }
            });

            if (!created) {
                record.access_count += 1;
                record.last_accessed = new Date();
                record.item_name = itemName;
                record.item_description = itemDescription;
                await record.save();
            }

            return record;
        } catch (error) {
            console.error('Error tracking access:', error);
            throw error;
        }
    }

    async getRecentlyAccessed(userId, limit = 10) {
        return await RecentlyAccessed.findAll({
            where: { user_id: userId },
            order: [['last_accessed', 'DESC']],
            limit: parseInt(limit)
        });
    }

    async getByType(userId, itemType, limit = 10) {
        return await RecentlyAccessed.findAll({
            where: {
                user_id: userId,
                item_type: itemType
            },
            order: [['last_accessed', 'DESC']],
            limit: parseInt(limit)
        });
    }

    async getMostAccessed(userId, limit = 5) {
        return await RecentlyAccessed.findAll({
            where: { user_id: userId },
            order: [['access_count', 'DESC']],
            limit: parseInt(limit)
        });
    }

    async clearOldRecords(userId, days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const deleted = await RecentlyAccessed.destroy({
            where: {
                user_id: userId,
                last_accessed: {
                    [Op.lt]: cutoffDate
                }
            }
        });

        return deleted;
    }

    async clearAll(userId) {
        return await RecentlyAccessed.destroy({
            where: { user_id: userId }
        });
    }

    async getItemDetailsForTracking(itemType, itemId) {
        try {
            const { Equipment, Lab, User, Booking, Maintenance } = require('../models');
            let item;
            let itemName = `${itemType} #${itemId}`;
            let itemDescription = '';
            
            switch (itemType) {
                case 'equipment':
                    item = await Equipment.findByPk(itemId);
                    if (item) {
                        itemName = item.name;
                        itemDescription = item.description || `${item.category} equipment`;
                    }
                    break;
                case 'lab':
                    item = await Lab.findByPk(itemId);
                    if (item) {
                        itemName = item.name;
                        itemDescription = item.description || `${item.lab_type} lab`;
                    }
                    break;
                case 'user':
                    item = await User.findByPk(itemId);
                    if (item) {
                        itemName = item.name;
                        itemDescription = `${item.role} - ${item.email}`;
                    }
                    break;
                case 'booking':
                    item = await Booking.findByPk(itemId);
                    if (item) {
                        itemName = `Booking #${itemId}`;
                        itemDescription = `Booking for ${item.booking_type}`;
                    }
                    break;
                case 'maintenance':
                    item = await Maintenance.findByPk(itemId);
                    if (item) {
                        itemName = `Maintenance #${itemId}`;
                        itemDescription = item.type || 'Maintenance record';
                    }
                    break;
            }

            return { itemName, itemDescription };
        } catch (error) {
            console.error('Error getting item details:', error);
            return {
                itemName: `${itemType} #${itemId}`,
                itemDescription: ''
            };
        }
    }
}

module.exports = new RecentlyAccessedService();
