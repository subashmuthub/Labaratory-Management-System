'use strict';

/**
 * Migration: Finalize Primary Key + Add camelCase columns
 *
 * Changes:
 *  1. Add googleId, resetPasswordToken, resetPasswordExpires columns
 *  2. Populate them from existing snake_case columns
 *  3. Switch PRIMARY KEY from `id` → `userId` (same integer values, just renaming the PK)
 *
 * Safe to re-run — all steps check before executing.
 */

const migration = {
    async up(queryInterface) {
        const db = queryInterface.sequelize;
        const q = (sql) => db.query(sql);

        // ── Step 1: Add camelCase columns ─────────────────────────────────────
        console.log('\n📋 Step 1: Adding camelCase columns...');

        const [cols] = await db.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`
        );
        const existing = new Set(cols.map(c => c.COLUMN_NAME));

        if (!existing.has('googleId')) {
            await q(`ALTER TABLE users ADD COLUMN googleId VARCHAR(255)`);
            await q(`ALTER TABLE users ADD UNIQUE INDEX idx_googleId (googleId)`);
            await q(`UPDATE users SET googleId = google_id WHERE google_id IS NOT NULL`);
            console.log('  ✓ Added googleId');
        } else {
            console.log('  ⏭  googleId already exists');
        }

        if (!existing.has('resetPasswordToken')) {
            await q(`ALTER TABLE users ADD COLUMN resetPasswordToken VARCHAR(500)`);
            await q(`UPDATE users SET resetPasswordToken = reset_password_token WHERE reset_password_token IS NOT NULL`);
            console.log('  ✓ Added resetPasswordToken');
        } else {
            console.log('  ⏭  resetPasswordToken already exists');
        }

        if (!existing.has('resetPasswordExpires')) {
            await q(`ALTER TABLE users ADD COLUMN resetPasswordExpires DATETIME`);
            await q(`UPDATE users SET resetPasswordExpires = reset_password_expires WHERE reset_password_expires IS NOT NULL`);
            console.log('  ✓ Added resetPasswordExpires');
        } else {
            console.log('  ⏭  resetPasswordExpires already exists');
        }

        // ── Step 2: Check current PRIMARY KEY ────────────────────────────────
        console.log('\n📋 Step 2: Checking current PRIMARY KEY...');

        const [pkRows] = await db.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
              AND CONSTRAINT_NAME = 'PRIMARY'
        `);
        const currentPK = pkRows[0]?.COLUMN_NAME;
        console.log(`  Current PK: ${currentPK}`);

        if (currentPK === 'userId') {
            console.log('  ⏭  userId is already the PRIMARY KEY — done!');
            return;
        }

        // ── Step 3: Switch PRIMARY KEY from id → userId ───────────────────────
        console.log('\n📋 Step 3: Switching PRIMARY KEY from id → userId...');

        try {
            await q('SET FOREIGN_KEY_CHECKS = 0');

            // Find and drop all FK constraints in OTHER tables referencing users.id
            const [fkRows] = await db.query(`
                SELECT kcu.TABLE_NAME, kcu.CONSTRAINT_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
                INNER JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
                    ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
                    AND kcu.TABLE_SCHEMA = rc.CONSTRAINT_SCHEMA
                WHERE kcu.REFERENCED_TABLE_NAME = 'users'
                  AND kcu.REFERENCED_COLUMN_NAME = 'id'
                  AND kcu.TABLE_SCHEMA = DATABASE()
            `);

            for (const fk of fkRows) {
                await db.query(`ALTER TABLE \`${fk.TABLE_NAME}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
                console.log(`  ✓ Dropped FK: ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME}`);
            }

            // Drop PK first, then remove AUTO_INCREMENT from id
            await q(`ALTER TABLE users MODIFY id INTEGER NOT NULL`);
            await q(`ALTER TABLE users DROP PRIMARY KEY`);
            console.log('  ✓ Dropped PRIMARY KEY from id');
            await q(`ALTER TABLE users MODIFY id INTEGER NULL`);

            // Drop any non-PRIMARY index on userId that would conflict
            const [uidxRows] = await db.query(
                `SHOW INDEX FROM users WHERE Column_name = 'userId' AND Key_name != 'PRIMARY'`
            );
            for (const idx of uidxRows) {
                await db.query(`ALTER TABLE users DROP INDEX \`${idx.Key_name}\``);
                console.log(`  ✓ Dropped index ${idx.Key_name} on userId`);
            }

            // Ensure no nulls before making PK
            await q(`UPDATE users SET userId = id WHERE userId IS NULL OR userId = 0`);

            // Make userId the new PRIMARY KEY with AUTO_INCREMENT
            await q(`ALTER TABLE users MODIFY userId INTEGER NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (userId)`);
            console.log('  ✓ Made userId the PRIMARY KEY with AUTO_INCREMENT');

        } finally {
            await q('SET FOREIGN_KEY_CHECKS = 1');
            console.log('  ✓ FK checks re-enabled');
        }
    }
};

module.exports = migration;
