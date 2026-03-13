const { sequelize } = require('./config/database');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Making old columns nullable...\n');
        
        await sequelize.query(`
            ALTER TABLE users 
            MODIFY COLUMN name varchar(100) NULL,
            MODIFY COLUMN email varchar(255) NULL,
            MODIFY COLUMN role enum('student','faculty','teacher','lab_assistant','lab_technician','admin') NULL,
            MODIFY COLUMN is_active tinyint(1) NULL DEFAULT 1
        `);
        
        console.log('✅ Old columns are now nullable. Registration should work now.');
    } catch(e) {
        console.error('❌ Error:', e.message);
    } finally {
        process.exit(0);
    }
})();
