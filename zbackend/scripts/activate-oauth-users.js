// Script to activate OAuth users that might have been created without is_active flag
const { User } = require('../models');

async function activateOAuthUsers() {
    try {
        console.log('🔍 Finding inactive OAuth users...');
        
        // Find users with OAuth IDs but inactive status
        const result = await User.update(
            { is_active: true },
            {
                where: {
                    is_active: false,
                    // Has either Google or GitHub OAuth ID
                    [require('sequelize').Op.or]: [
                        { google_id: { [require('sequelize').Op.ne]: null } },
                        { github_id: { [require('sequelize').Op.ne]: null } }
                    ]
                }
            }
        );
        
        console.log(`✅ Activated ${result[0]} OAuth user(s)`);
        
        // Also show all OAuth users
        const oauthUsers = await User.findAll({
            where: {
                [require('sequelize').Op.or]: [
                    { google_id: { [require('sequelize').Op.ne]: null } },
                    { github_id: { [require('sequelize').Op.ne]: null } }
                ]
            },
            attributes: ['id', 'name', 'email', 'is_active', 'google_id', 'github_id']
        });
        
        console.log('\n📋 All OAuth users:');
        oauthUsers.forEach(user => {
            console.log(`  - ${user.email} (ID: ${user.id}) - Active: ${user.is_active}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

activateOAuthUsers();
