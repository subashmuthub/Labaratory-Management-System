const { sequelize } = require('./config/database');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Checking users table structure...\n');
        
        const [results] = await sequelize.query('DESCRIBE users');
        
        console.log('Field Name                  | Type              | Null | Key | Default');
        console.log('-------------------------------------------------------------------');
        results.forEach(col => {
            const field = col.Field.padEnd(25);
            const type = col.Type.padEnd(18);
            const isNull = col.Null.padEnd(5);
            const key = col.Key.padEnd(4);
            const def = col.Default || '';
            console.log(`${field} | ${type} | ${isNull} | ${key} | ${def}`);
        });
        
        console.log('\n');
    } catch(e) {
        console.error('Error:', e.message);
    } finally {
        process.exit(0);
    }
})();
