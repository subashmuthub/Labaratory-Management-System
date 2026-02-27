const express = require('express');
const { requireAdmin, requireTeacherOrAdmin, authenticateToken } = require('../middleware/auth');
const userService = require('../services/userService');

const router = express.Router();

// GET all users - Teachers and Admins can view all users
router.get('/', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
    try {
        console.log('👥 Fetching users for:', req.user.email, 'Role:', req.user.role);
        
        const users = await userService.getAllUsers();
        
        console.log(`✅ Found ${users.length} users`);
        console.log('Sample user:', users[0]);
        res.json(users);
    } catch (error) {
        console.error('💥 Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET user statistics - Teachers and Admins can view stats
router.get('/stats', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
    try {
        console.log('📊 Fetching user stats for:', req.user.email);
        
        const stats = await userService.getStats();
        console.log('✅ User stats calculated');
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('💥 Error fetching user stats:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// GET search users - Teachers and Admins can search
router.get('/search', authenticateToken, requireTeacherOrAdmin, async (req, res) => {
    try {
        const { q, term } = req.query;
        const searchTerm = q || term;
        
        if (!searchTerm) {
            return res.status(400).json({ 
                success: false,
                error: 'Search term is required' 
            });
        }
        
        const users = await userService.searchUsers(searchTerm);
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// GET single user by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        // Users can view their own profile, teachers and admins can view all
        if (req.user.userId !== parseInt(req.params.id) && 
            req.user.role !== 'admin' && req.user.role !== 'teacher') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this user'
            });
        }
        
        const user = await userService.getUserById(req.params.id);
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        if (error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: error.message
        });
    }
});

// POST create new user - Only Admins can create users
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log('👤 Creating new user by admin:', req.user.email);
        
        const user = await userService.createUser(req.body);
        console.log('✅ User created successfully:', user.email);
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: user
        });
    } catch (error) {
        console.error('💥 Error creating user:', error);
        
        if (error.message === 'Email already exists') {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create user',
            error: error.message
        });
    }
});

// PUT update user - Users can update themselves, Admins can update anyone
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        
        // Check permissions
        if (req.user.userId !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this user'
            });
        }
        
        console.log('👤 Updating user:', userId, 'by:', req.user.email);
        
        const user = await userService.updateUser(userId, req.body);
        console.log('✅ User updated successfully');
        
        res.json({
            success: true,
            message: 'User updated successfully',
            data: user
        });
    } catch (error) {
        console.error('💥 Error updating user:', error);
        
        if (error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message === 'Email already in use') {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
});

// DELETE user - Only Admins can delete users
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        console.log('🗑️ DELETE REQUEST - User ID:', userId, 'Requested by:', req.user.email, '(Role:', req.user.role + ')');
        
        const result = await userService.deleteUser(userId);
        console.log('✅ User PERMANENTLY deleted from database:', userId);
        
        res.json({
            success: true,
            message: 'User deleted permanently',
            data: result
        });
    } catch (error) {
        console.error('💥 DELETE ERROR:', error.message);
        console.error('💥 Full error:', error);
        
        if (error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        // Return the actual error message from the service
        res.status(400).json({
            success: false,
            message: error.message, // This will contain the detailed "Cannot delete user..." message
            error: error.message
        });
    }
});

// PUT activate user - Only Admins can activate users
router.put('/:id/activate', authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log('✅ Activating user:', req.params.id, 'by admin:', req.user.email);
        
        const user = await userService.activateUser(req.params.id);
        console.log('✅ User activated successfully');
        
        res.json({
            success: true,
            message: 'User activated successfully',
            data: user
        });
    } catch (error) {
        console.error('💥 Error activating user:', error);
        
        if (error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to activate user',
            error: error.message
        });
    }
});

module.exports = router;
