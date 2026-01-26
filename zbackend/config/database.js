const { Sequelize } = require('sequelize');
require('dotenv').config();

// Log the connection configuration
console.log('═══════════════════════════════════════════════════════');
console.log('🗄️  DATABASE CONNECTION CONFIGURATION');
console.log('═══════════════════════════════════════════════════════');
console.log(`🌍 Mode: ${process.env.NODE_ENV || 'development'}`);
console.log(`📍 Host: ${process.env.DB_HOST_LOCAL || 'localhost'}`);
console.log(`🔌 Port: ${process.env.DB_PORT_LOCAL || '3306'}`);
console.log(`📦 Database: ${process.env.DB_NAME || 'lab_management'}`);
console.log(`👤 User: ${process.env.DB_USER || 'root'}`);
console.log('═══════════════════════════════════════════════════════\n');

// Database configuration
const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST_LOCAL || 'localhost',
    port: process.env.DB_PORT_LOCAL || 3306,
    database: process.env.DB_NAME || 'lab_management',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',

    // Connection pool settings
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },

    // Dialect options
    dialectOptions: {
        connectTimeout: 60000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
    },

    // Logging
    logging: process.env.NODE_ENV === 'production' ? false : console.log,

    // Other options
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
    }
});

// Test the connection
const testConnection = async () => {
    try {
        console.log(`\n🔗 Testing database connection...`);
        console.log(`   Connecting to: ${sequelize.config.host}:${sequelize.config.port}\n`);
        
        await sequelize.authenticate();
        
        console.log('✅ SUCCESS! Database connection established.');
        console.log(`   Connected to: ${sequelize.config.database}`);
        console.log(`   Using host: ${sequelize.config.host}\n`);
        
        return true;
    } catch (error) {
        console.error('\n❌ FAILED! Unable to connect to the database.');
        console.error(`   Error: ${error.message}`);
        console.error(`   Host attempted: ${sequelize.config.host}:${sequelize.config.port}`);
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Make sure MySQL is running locally');
        console.error('   2. Verify database credentials in .env file');
        console.error('   3. Check if the database exists\n');
        return false;
    }
};

// Sync database (create tables)
const syncDatabase = async (force = false) => {
    try {
        if (force) {
            console.log('🔄 Force syncing database (this will drop existing tables)...');
        } else {
            console.log('🔄 Syncing database...');
        }

        await sequelize.sync({ force });
        console.log('✅ Database synced successfully.');
        return true;
    } catch (error) {
        console.error('❌ Error syncing database:', error.message);
        return false;
    }
};

module.exports = {
    sequelize,
    testConnection,
    syncDatabase
};