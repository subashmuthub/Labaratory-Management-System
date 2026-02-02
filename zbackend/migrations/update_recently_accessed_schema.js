// Migration to update recently_accessed table schema
const { sequelize } = require('../config/database');
const { QueryInterface } = require('sequelize');

async function updateRecentlyAccessedSchema() {
    const queryInterface = sequelize.getQueryInterface();
    
    console.log('🔄 Updating recently_accessed table schema...');

    try {
        // Check if table exists
        const tableExists = await queryInterface.showAllTables()
            .then(tables => tables.includes('recently_accessed'));

        if (!tableExists) {
            console.log('⚠️ Table recently_accessed does not exist. Creating...');
            await queryInterface.createTable('recently_accessed', {
                id: {
                    type: sequelize.Sequelize.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                user_id: {
                    type: sequelize.Sequelize.INTEGER,
                    allowNull: false,
                    references: {
                        model: 'users',
                        key: 'id'
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'CASCADE'
                },
                item_type: {
                    type: sequelize.Sequelize.ENUM('equipment', 'lab', 'booking', 'maintenance', 'report', 'user'),
                    allowNull: false
                },
                item_id: {
                    type: sequelize.Sequelize.INTEGER,
                    allowNull: false
                },
                item_name: {
                    type: sequelize.Sequelize.STRING(255),
                    allowNull: false
                },
                item_description: {
                    type: sequelize.Sequelize.TEXT,
                    allowNull: true
                },
                access_count: {
                    type: sequelize.Sequelize.INTEGER,
                    defaultValue: 1
                },
                last_accessed: {
                    type: sequelize.Sequelize.DATE,
                    allowNull: false,
                    defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
                },
                created_at: {
                    type: sequelize.Sequelize.DATE,
                    allowNull: false,
                    defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
                },
                updated_at: {
                    type: sequelize.Sequelize.DATE,
                    allowNull: false,
                    defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
                }
            });

            // Create indexes
            await queryInterface.addIndex('recently_accessed', ['user_id', 'last_accessed'], {
                name: 'idx_user_accessed'
            });

            await queryInterface.addIndex('recently_accessed', ['user_id', 'item_type', 'item_id'], {
                name: 'unique_user_item',
                unique: true
            });

            await queryInterface.addIndex('recently_accessed', ['item_type'], {
                name: 'idx_item_type'
            });

            console.log('✅ Table created successfully!');
            return;
        }

        // Get table description
        const tableDescription = await queryInterface.describeTable('recently_accessed');
        console.log('📊 Current table structure:', Object.keys(tableDescription));

        // Check if we need to rename accessed_at to last_accessed
        if (tableDescription.accessed_at && !tableDescription.last_accessed) {
            console.log('🔄 Renaming accessed_at to last_accessed...');
            await queryInterface.renameColumn('recently_accessed', 'accessed_at', 'last_accessed');
            console.log('✅ Column renamed successfully!');
        }

        // Check if we need to add access_count column
        if (!tableDescription.access_count) {
            console.log('➕ Adding access_count column...');
            await queryInterface.addColumn('recently_accessed', 'access_count', {
                type: sequelize.Sequelize.INTEGER,
                defaultValue: 1,
                allowNull: false
            });
            console.log('✅ Column added successfully!');
        }

        // Check if we need to add item_description column
        if (!tableDescription.item_description) {
            console.log('➕ Adding item_description column...');
            await queryInterface.addColumn('recently_accessed', 'item_description', {
                type: sequelize.Sequelize.TEXT,
                allowNull: true
            });
            console.log('✅ Column added successfully!');
        }

        // Update the ENUM to include all item types
        console.log('🔄 Updating item_type ENUM...');
        try {
            // For MySQL, we need to modify the ENUM
            await sequelize.query(`
                ALTER TABLE recently_accessed 
                MODIFY COLUMN item_type ENUM('equipment', 'lab', 'booking', 'maintenance', 'report', 'user') NOT NULL
            `);
            console.log('✅ ENUM updated successfully!');
        } catch (error) {
            console.log('⚠️ Could not update ENUM:', error.message);
        }

        // Ensure indexes exist
        try {
            const indexes = await queryInterface.showIndex('recently_accessed');
            const indexNames = indexes.map(idx => idx.name);

            if (!indexNames.includes('idx_item_type')) {
                console.log('➕ Adding idx_item_type index...');
                await queryInterface.addIndex('recently_accessed', ['item_type'], {
                    name: 'idx_item_type'
                });
                console.log('✅ Index added successfully!');
            }
        } catch (error) {
            console.log('⚠️ Could not add index:', error.message);
        }

        console.log('✅ Recently accessed schema updated successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run migration if called directly
if (require.main === module) {
    updateRecentlyAccessedSchema()
        .then(() => {
            console.log('✅ Migration completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = updateRecentlyAccessedSchema;
