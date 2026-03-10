// One-time migration: add missing createdBy/updatedBy columns and fix userNumber constraint
const { sequelize } = require('./config/database');

async function run() {
    try {
        // 1. Add missing createdBy and updatedBy columns (check first to avoid error)
        const [cols] = await sequelize.query("DESCRIBE users");
        const existingFields = cols.map(c => c.Field);

        if (!existingFields.includes('createdBy')) {
            await sequelize.query("ALTER TABLE users ADD COLUMN createdBy INT NULL");
            console.log('✅ createdBy column added');
        } else {
            console.log('ℹ️  createdBy already exists');
        }
        if (!existingFields.includes('updatedBy')) {
            await sequelize.query("ALTER TABLE users ADD COLUMN updatedBy INT NULL");
            console.log('✅ updatedBy column added');
        } else {
            console.log('ℹ️  updatedBy already exists');
        }

        // 2. Make userNumber nullable with a default so OAuth users can be created
        //    (existing rows already have values, new OAuth rows will get null)
        await sequelize.query("ALTER TABLE users MODIFY COLUMN userNumber VARCHAR(50) NULL DEFAULT NULL");
        console.log('✅ userNumber made nullable');

        // 3. Verify final column list
        const [finalCols] = await sequelize.query("DESCRIBE users");
        const needed = ['createdBy', 'updatedBy', 'userNumber', 'googleId', 'userId'];
        needed.forEach(n => {
            const col = finalCols.find(c => c.Field === n);
            if (col) console.log(`✅ ${n}: ${col.Type}, Null=${col.Null}, Key=${col.Key}`);
            else       console.log(`❌ ${n}: MISSING`);
        });

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await sequelize.close();
    }
}

run();
