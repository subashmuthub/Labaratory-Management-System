// Training Service - Business Logic Layer
const { Training, TrainingCertification, User, Equipment } = require('../models');
const { Op } = require('sequelize');

class TrainingService {
    /**
     * Get training statistics
     */
    async getStats() {
        const totalTrainings = await Training.count({ where: { is_active: true } });
        const totalCertifications = await TrainingCertification.count();
        const activeCertifications = await TrainingCertification.count({ 
            where: { status: 'active' } 
        });
        const expiredCertifications = await TrainingCertification.count({ 
            where: { status: 'expired' } 
        });

        return {
            totalTrainings,
            totalCertifications,
            activeCertifications,
            expiredCertifications
        };
    }

    /**
     * Get all training programs with filters
     */
    async getAllTrainings(filters = {}) {
        const {
            equipment_id,
            required_only,
            active_only = 'true',
            page = 1,
            limit = 100
        } = filters;

        const whereClause = {};
        
        if (active_only === 'true') {
            whereClause.is_active = true;
        }
        
        if (equipment_id) {
            whereClause.equipment_id = equipment_id;
        }
        
        if (required_only === 'true') {
            whereClause.required_for_equipment = true;
        }

        const offset = (page - 1) * limit;

        const { rows: trainings, count: total } = await Training.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Equipment,
                    as: 'equipment',
                    attributes: ['id', 'name', 'category'],
                    required: false
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['created_at', 'DESC']]
        });

        return {
            trainings,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get training by ID
     */
    async getTrainingById(id) {
        const training = await Training.findByPk(id, {
            include: [
                {
                    model: Equipment,
                    as: 'equipment',
                    attributes: ['id', 'name', 'category'],
                    required: false
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ]
        });

        if (!training) {
            throw new Error('Training program not found');
        }

        return training;
    }

    /**
     * Create training program
     */
    async createTraining(trainingData, userId) {
        const cleanedData = this.cleanTrainingData(trainingData);

        const {
            title,
            description,
            duration_hours,
            validity_months,
            max_participants,
            equipment_id,
            instructor,
            materials,
            required_for_equipment = false
        } = cleanedData;

        // Validate required fields
        if (!title || !description || !duration_hours || !validity_months || !max_participants) {
            throw new Error('Title, description, duration, validity, and max participants are required');
        }

        // Verify equipment if provided
        if (equipment_id) {
            const equipment = await Equipment.findByPk(equipment_id);
            if (!equipment) {
                throw new Error('Equipment not found');
            }
        }

        const training = await Training.create({
            title: title.trim(),
            description: description.trim(),
            duration_hours: parseFloat(duration_hours),
            validity_months: parseInt(validity_months),
            max_participants: parseInt(max_participants),
            equipment_id: equipment_id ? parseInt(equipment_id) : null,
            instructor: instructor?.trim() || null,
            materials: materials?.trim() || null,
            required_for_equipment,
            is_active: true,
            created_by: userId
        });

        return await this.getTrainingById(training.id);
    }

    /**
     * Update training program
     */
    async updateTraining(id, updateData) {
        const training = await Training.findByPk(id);

        if (!training) {
            throw new Error('Training program not found');
        }

        const cleanedData = this.cleanTrainingData(updateData);
        await training.update(cleanedData);

        return await this.getTrainingById(id);
    }

    /**
     * Delete training program
     */
    async deleteTraining(id) {
        const training = await Training.findByPk(id);

        if (!training) {
            throw new Error('Training program not found');
        }

        await training.update({ is_active: false });
        return { message: 'Training program deleted successfully' };
    }

    /**
     * Get all certifications with filters
     */
    async getAllCertifications(filters = {}) {
        const { training_id, user_id, status, page = 1, limit = 100 } = filters;

        const whereClause = {};
        
        if (training_id) whereClause.training_id = training_id;
        if (user_id) whereClause.user_id = user_id;
        if (status && status !== 'all') whereClause.status = status;

        const offset = (page - 1) * limit;

        const { rows: certifications, count: total } = await TrainingCertification.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Training,
                    as: 'training',
                    attributes: ['id', 'title', 'validity_months'],
                    required: false
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['issued_date', 'DESC']]
        });

        return {
            certifications,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Create certification
     */
    async createCertification(certificationData) {
        const { training_id, user_id, issued_date, score } = certificationData;

        // Validate required fields
        if (!training_id || !user_id) {
            throw new Error('Training ID and User ID are required');
        }

        // Verify training exists
        const training = await Training.findByPk(training_id);
        if (!training) {
            throw new Error('Training program not found');
        }

        // Verify user exists
        const user = await User.findByPk(user_id);
        if (!user) {
            throw new Error('User not found');
        }

        // Calculate expiry date
        const issuedDate = issued_date ? new Date(issued_date) : new Date();
        const expiryDate = new Date(issuedDate);
        expiryDate.setMonth(expiryDate.getMonth() + training.validity_months);

        const certification = await TrainingCertification.create({
            training_id: parseInt(training_id),
            user_id: parseInt(user_id),
            issued_date: issuedDate,
            expiry_date: expiryDate,
            score: score ? parseFloat(score) : null,
            status: 'active'
        });

        return certification;
    }

    /**
     * Update certification
     */
    async updateCertification(id, updateData) {
        const certification = await TrainingCertification.findByPk(id);

        if (!certification) {
            throw new Error('Certification not found');
        }

        await certification.update(updateData);
        return certification;
    }

    /**
     * Delete certification
     */
    async deleteCertification(id) {
        const certification = await TrainingCertification.findByPk(id);

        if (!certification) {
            throw new Error('Certification not found');
        }

        await certification.destroy();
        return { message: 'Certification deleted successfully' };
    }

    /**
     * Get expiring certifications
     */
    async getExpiringCertifications(days = 30) {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        const certifications = await TrainingCertification.findAll({
            where: {
                status: 'active',
                expiry_date: {
                    [Op.between]: [now, futureDate]
                }
            },
            include: [
                {
                    model: Training,
                    as: 'training',
                    attributes: ['id', 'title'],
                    required: false
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ],
            order: [['expiry_date', 'ASC']]
        });

        return certifications;
    }

    /**
     * Helper: Clean training data
     */
    cleanTrainingData(data) {
        const cleanedData = { ...data };
        
        if (cleanedData.equipment_id === '' || cleanedData.equipment_id === undefined) {
            cleanedData.equipment_id = null;
        }
        
        if (cleanedData.instructor === '' || cleanedData.instructor === undefined) {
            cleanedData.instructor = null;
        }
        
        if (cleanedData.materials === '' || cleanedData.materials === undefined) {
            cleanedData.materials = null;
        }
        
        return cleanedData;
    }
}

module.exports = new TrainingService();
