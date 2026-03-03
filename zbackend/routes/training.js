const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const trainingService = require('../services/trainingService');

const router = express.Router();

// Validation middleware
const validateTraining = [
    body('title').notEmpty().trim().isLength({ max: 200 }).withMessage('Title is required and must be less than 200 characters'),
    body('description').notEmpty().trim().isLength({ max: 2000 }).withMessage('Description is required and must be less than 2000 characters'),
    body('duration_hours').isFloat({ min: 0.5, max: 40 }).withMessage('Duration must be between 0.5 and 40 hours'),
    body('validity_months').isInt({ min: 1, max: 60 }).withMessage('Validity must be between 1 and 60 months'),
    body('max_participants').isInt({ min: 1, max: 100 }).withMessage('Max participants must be between 1 and 100'),
    body('equipment_id')
        .optional({ nullable: true, checkFalsy: true })
        .custom((value) => {
            if (value === '' || value === null || value === undefined) {
                return true;
            }
            if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
                throw new Error('Equipment ID must be a valid positive integer');
            }
            return true;
        }),
    body('instructor').optional({ checkFalsy: true }).trim().isLength({ max: 200 }).withMessage('Instructor name must be less than 200 characters'),
    body('required_for_equipment').optional().isBoolean().withMessage('Required for equipment must be boolean')
];

// Test route (public)
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Training routes are working!',
        timestamp: new Date().toISOString()
    });
});

// Apply authentication to all routes below
router.use(authenticateToken);

// GET training statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await trainingService.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching training stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch training statistics',
            error: error.message
        });
    }
});

// GET all trainings
router.get('/', async (req, res) => {
    try {
        const result = await trainingService.getAllTrainings(req.query);
        res.json({
            success: true,
            data: result.trainings,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error fetching trainings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch trainings',
            error: error.message
        });
    }
});

// GET training by ID
router.get('/:id', async (req, res) => {
    try {
        const training = await trainingService.getTrainingById(req.params.id);
        res.json({
            success: true,
            data: training
        });
    } catch (error) {
        console.error('Error fetching training:', error);
        if (error.message === 'Training not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to fetch training',
            error: error.message
        });
    }
});

// POST create new training
router.post('/', validateTraining, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const training = await trainingService.createTraining(req.body, req.user.userId);
        res.status(201).json({
            success: true,
            message: 'Training created successfully',
            data: training
        });
    } catch (error) {
        console.error('Error creating training:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create training',
            error: error.message
        });
    }
});

// PUT update training
router.put('/:id', validateTraining, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const training = await trainingService.updateTraining(req.params.id, req.body, req.user.userId);
        res.json({
            success: true,
            message: 'Training updated successfully',
            data: training
        });
    } catch (error) {
        console.error('Error updating training:', error);
        if (error.message === 'Training not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update training',
            error: error.message
        });
    }
});

// DELETE training
router.delete('/:id', async (req, res) => {
    try {
        await trainingService.deleteTraining(req.params.id);
        res.json({
            success: true,
            message: 'Training deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting training:', error);
        if (error.message === 'Training not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to delete training',
            error: error.message
        });
    }
});

// POST enroll user in training
router.post('/:id/enroll', async (req, res) => {
    try {
        const trainingId = req.params.id;
        const userId = req.user.userId;
        
        const certification = await trainingService.enrollUserInTraining(trainingId, userId);
        res.status(201).json({
            success: true,
            message: 'Successfully enrolled in training',
            data: certification
        });
    } catch (error) {
        console.error('Error enrolling in training:', error);
        if (error.message === 'User is already enrolled in this training' || error.message === 'Training not found') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to enroll in training',
            error: error.message
        });
    }
});

// ===== CERTIFICATION ENDPOINTS =====

// GET all certifications
router.get('/certifications/all', async (req, res) => {
    try {
        const result = await trainingService.getAllCertifications(req.query);
        res.json({
            success: true,
            data: result.certifications,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error fetching certifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch certifications',
            error: error.message
        });
    }
});

// GET expiring certifications
router.get('/certifications/expiring', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const certifications = await trainingService.getExpiringCertifications(days);
        res.json({
            success: true,
            data: certifications
        });
    } catch (error) {
        console.error('Error fetching expiring certifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expiring certifications',
            error: error.message
        });
    }
});

// GET user certifications
router.get('/certifications/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const certifications = await trainingService.getUserCertifications(userId);
        res.json({
            success: true,
            data: certifications
        });
    } catch (error) {
        console.error('Error fetching user certifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user certifications',
            error: error.message
        });
    }
});

// PATCH complete certification
router.patch('/certifications/:id/complete', async (req, res) => {
    try {
        const certificationId = req.params.id;
        const userId = req.user.userId;
        
        const certification = await trainingService.completeCertification(certificationId, userId);
        res.json({
            success: true,
            message: 'Certification marked as complete',
            data: certification
        });
    } catch (error) {
        console.error('Error completing certification:', error);
        if (error.message === 'Certification not found or access denied') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to complete certification',
            error: error.message
        });
    }
});

// POST create certification
router.post('/certifications', async (req, res) => {
    try {
        const certification = await trainingService.createCertification(req.body);
        res.status(201).json({
            success: true,
            message: 'Certification created successfully',
            data: certification
        });
    } catch (error) {
        console.error('Error creating certification:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create certification',
            error: error.message
        });
    }
});

// PATCH complete certification
router.patch('/certifications/:id/complete', async (req, res) => {
    try {
        const certificationId = req.params.id;
        const userId = req.user.userId;
        
        const certification = await trainingService.completeCertification(certificationId, userId);
        res.json({
            success: true,
            message: 'Certification marked as complete',
            data: certification
        });
    } catch (error) {
        console.error('Error completing certification:', error);
        if (error.message === 'Certification not found or access denied') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to complete certification',
            error: error.message
        });
    }
});

// PUT update certification
router.put('/certifications/:id', async (req, res) => {
    try {
        const certification = await trainingService.updateCertification(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Certification updated successfully',
            data: certification
        });
    } catch (error) {
        console.error('Error updating certification:', error);
        if (error.message === 'Certification not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update certification',
            error: error.message
        });
    }
});

module.exports = router;
