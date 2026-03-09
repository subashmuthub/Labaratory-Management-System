'use strict';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function run() {
    const { sequelize } = require('./config/database');
    const migration = require('./migrations/finalize-primary-key');

    console.log('\n🚀 FINALIZE PRIMARY KEY MIGRATION');
    console.log('═'.repeat(55));
    console.log('  Adds: googleId, resetPasswordToken, resetPasswordExpires');
    console.log('  Fixes: userId becomes the actual PRIMARY KEY');
    console.log('═'.repeat(55));

    try {
        await sequelize.authenticate();
        console.log('✅ Database connected\n');

        await migration.up(sequelize.getQueryInterface());

        console.log('\n✅ Migration completed successfully!');
        console.log('👉 Restart your backend: npm start\n');
    } catch (error) {
        console.error('\n❌ Migration FAILED:', error.message);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

run();
