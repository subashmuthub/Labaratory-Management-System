const express = require('express');
const router = express.Router();
const { Equipment, Lab, User } = require('../models');
const { Op } = require('sequelize');
const { authenticateToken } = require('../middleware/auth');
const { createNotification } = require('../utils/notificationService');

router.use(authenticateToken);

// GET equipment statistics
router.get('/stats', async (req, res) => {
    try {
        const totalEquipment = await Equipment.count({ where: { is_active: true } });
        const availableEquipment = await Equipment.count({ 
            where: { is_active: true, status: 'available' } 
        });
        const inUseEquipment = await Equipment.count({ 
            where: { is_active: true, status: 'in_use' } 
        });
        const maintenanceEquipment = await Equipment.count({ 
            where: { is_active: true, status: 'maintenance' } 
        });

        res.json({
            success: true,
            data: {
                total: totalEquipment,
                available: availableEquipment,
                inUse: inUseEquipment,
                maintenance: maintenanceEquipment
            }
        });
    } catch (error) {
        console.error('Error fetching equipment stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch equipment statistics',
            error: error.message
        });
    }
});

// GET equipment status summary
router.get('/status-summary', async (req, res) => {
    try {
        const equipment = await Equipment.findAll({
            where: { is_active: true, status: { [Op.in]: ['in_use', 'maintenance'] } },
            include: [
                {
                    model: Lab,
                    as: 'lab',
                    attributes: ['id', 'name', 'location']
                }
            ],
            limit: 10,
            order: [['updated_at', 'DESC']]
        });

        res.json({
            success: true,
            data: equipment
        });
    } catch (error) {
        console.error('Error fetching equipment status summary:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch equipment status summary',
            error: error.message
        });
    }
});

// GET all equipment
router.get('/', async (req, res) => {
    try {
        const {
            lab_id,
            status,
            category,
            search,
            page = 1,
            limit = 1000  // Increased default limit to handle all equipment items
        } = req.query;

        const whereClause = { is_active: true };

        if (lab_id) whereClause.lab_id = lab_id;
        if (status) whereClause.status = status;
        if (category) whereClause.category = category;

        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { model: { [Op.like]: `%${search}%` } },
                { serial_number: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
                { manufacturer: { [Op.like]: `%${search}%` } }
            ];
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const equipment = await Equipment.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Lab,
                    as: 'lab',
                    attributes: ['id', 'name', 'location', 'lab_type'],
                    required: false
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'name', 'email'],
                    required: false
                }
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        res.json({
            success: true,
            data: {
                equipment: equipment.rows,
                pagination: {
                    total: equipment.count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(equipment.count / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Error fetching equipment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch equipment',
            error: error.message
        });
    }
});

// POST create new equipment
router.post('/', async (req, res) => {
    try {
        console.log('📝 Creating new equipment by user:', req.user.email);
        console.log('📝 Request body:', req.body);

        const {
            name,
            description,
            serial_number,
            model,
            manufacturer,
            category,
            lab_id,
            location_details,
            status = 'available',
            condition_status = 'good',
            purchase_price,
            current_value,
            purchase_date,
            warranty_expiry,
            // Category-specific fields
            processor,
            ram,
            storage,
            graphics_card,
            operating_system,
            resolution,
            brightness,
            contrast_ratio,
            lamp_hours,
            print_type,
            print_speed,
            paper_size,
            connectivity,
            magnification,
            objective_lenses,
            illumination,
            capacity,
            power_rating,
            temperature_range,
            accuracy,
            ports,
            speed,
            protocol
        } = req.body;

        // Validation
        if (!name || !serial_number || !category || !lab_id) {
            return res.status(400).json({
                success: false,
                message: 'Name, serial number, category, and lab assignment are required'
            });
        }

        // Check if lab exists
        const lab = await Lab.findByPk(lab_id);
        if (!lab || !lab.is_active) {
            return res.status(400).json({
                success: false,
                message: 'Invalid lab ID or lab is not active'
            });
        }

        // Check for duplicate serial number
        const existingEquipment = await Equipment.findOne({
            where: { serial_number, is_active: true }
        });
        if (existingEquipment) {
            return res.status(400).json({
                success: false,
                message: 'Equipment with this serial number already exists'
            });
        }

        const equipmentData = {
            name: name.trim(),
            description: description?.trim() || null,
            serial_number: serial_number.trim(),
            model: model?.trim() || null,
            manufacturer: manufacturer?.trim() || null,
            category,
            lab_id: parseInt(lab_id),
            location_details: location_details?.trim() || null,
            status,
            condition_status,
            purchase_price: purchase_price ? parseFloat(purchase_price) : 0.00,
            current_value: current_value ? parseFloat(current_value) : 0.00,
            purchase_date: purchase_date || new Date().toISOString().split('T')[0],
            warranty_expiry: warranty_expiry || null,
            is_active: true,
            created_by: req.user.userId,
            // Category-specific fields
            processor: processor || null,
            ram: ram || null,
            storage: storage || null,
            graphics_card: graphics_card || null,
            operating_system: operating_system || null,
            resolution: resolution || null,
            brightness: brightness || null,
            contrast_ratio: contrast_ratio || null,
            lamp_hours: lamp_hours ? parseInt(lamp_hours) : null,
            print_type: print_type || null,
            print_speed: print_speed || null,
            paper_size: paper_size || null,
            connectivity: connectivity || null,
            magnification: magnification || null,
            objective_lenses: objective_lenses || null,
            illumination: illumination || null,
            capacity: capacity || null,
            power_rating: power_rating || null,
            temperature_range: temperature_range || null,
            accuracy: accuracy || null,
            ports: ports || null,
            speed: speed || null,
            protocol: protocol || null
        };

        const equipment = await Equipment.create(equipmentData);

        // Fetch with associations
        const equipmentWithAssociations = await Equipment.findByPk(equipment.id, {
            include: [
                {
                    model: Lab,
                    as: 'lab',
                    attributes: ['id', 'name', 'location', 'lab_type'],
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

        // Create notification for equipment creation
        try {
            await createNotification({
                user_id: req.user.userId,
                type: 'equipment',
                title: 'Equipment Added',
                message: `New equipment "${name}" has been added to ${equipmentWithAssociations?.lab?.name || 'the lab'}.`,
                metadata: {
                    equipment_id: equipment.id,
                    equipment_name: name,
                    serial_number: serial_number,
                    category: category,
                    lab_id: lab_id,
                    lab_name: equipmentWithAssociations?.lab?.name || null
                }
            });
            console.log('📧 Equipment creation notification created for:', name);
        } catch (notifError) {
            console.error('⚠️ Failed to create equipment notification:', notifError.message);
        }

        res.status(201).json({
            success: true,
            data: { equipment: equipmentWithAssociations },
            message: 'Equipment created successfully'
        });

    } catch (error) {
        console.error('Error creating equipment:', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors.map(e => e.message)
            });
        }

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'Serial number already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create equipment',
            error: error.message
        });
    }
});

// GET equipment by ID
router.get('/:id', async (req, res) => {
    try {
        const equipment = await Equipment.findByPk(req.params.id, {
            include: [
                {
                    model: Lab,
                    as: 'lab',
                    attributes: ['id', 'name', 'location', 'lab_type'],
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

        if (!equipment || !equipment.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found'
            });
        }

        res.json({
            success: true,
            data: { equipment }
        });
    } catch (error) {
        console.error('Error fetching equipment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch equipment',
            error: error.message
        });
    }
});

// PUT update equipment
router.put('/:id', async (req, res) => {
    try {
        const equipment = await Equipment.findByPk(req.params.id);

        if (!equipment || !equipment.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found'
            });
        }

        // Check permissions
        if (req.user.role !== 'admin' && equipment.created_by !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to edit this equipment'
            });
        }

        const updateData = { ...req.body };

        if (updateData.purchase_price !== undefined) {
            updateData.purchase_price = updateData.purchase_price ? parseFloat(updateData.purchase_price) : 0.00;
        }

        if (updateData.current_value !== undefined) {
            updateData.current_value = updateData.current_value ? parseFloat(updateData.current_value) : 0.00;
        }

        await equipment.update(updateData);

        // Create notification if status changed
        if (updateData.status && updateData.status !== equipment.status) {
            try {
                await createNotification({
                    user_id: req.user.userId,
                    type: 'equipment',
                    title: 'Equipment Status Updated',
                    message: `Equipment "${equipment.name}" status has been changed from ${equipment.status} to ${updateData.status}.`,
                    metadata: {
                        equipment_id: equipment.id,
                        equipment_name: equipment.name,
                        old_status: equipment.status,
                        new_status: updateData.status,
                        lab_id: equipment.lab_id
                    }
                });
                console.log('📧 Equipment status notification created for:', equipment.name);
            } catch (notifError) {
                console.error('⚠️ Failed to create equipment status notification:', notifError.message);
            }
        }

        const updatedEquipment = await Equipment.findByPk(req.params.id, {
            include: [
                {
                    model: Lab,
                    as: 'lab',
                    attributes: ['id', 'name', 'location', 'lab_type'],
                    required: false
                }
            ]
        });

        res.json({
            success: true,
            data: { equipment: updatedEquipment },
            message: 'Equipment updated successfully'
        });
    } catch (error) {
        console.error('Error updating equipment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update equipment',
            error: error.message
        });
    }
});

// DELETE equipment
router.delete('/:id', async (req, res) => {
    try {
        const equipment = await Equipment.findByPk(req.params.id);

        if (!equipment || !equipment.is_active) {
            return res.status(404).json({
                success: false,
                message: 'Equipment not found'
            });
        }

        if (req.user.role !== 'admin' && equipment.created_by !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this equipment'
            });
        }

        await equipment.update({ is_active: false });

        res.json({
            success: true,
            message: 'Equipment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting equipment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete equipment',
            error: error.message
        });
    }
});

// DELETE bulk delete equipment by lab
router.delete('/lab/:labId/bulk', async (req, res) => {
    try {
        const { labId } = req.params;

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can perform bulk delete operations'
            });
        }

        // Check if lab exists
        const lab = await Lab.findByPk(labId);
        if (!lab) {
            return res.status(404).json({
                success: false,
                message: 'Lab not found'
            });
        }

        // Count equipment in this lab
        const equipmentCount = await Equipment.count({
            where: {
                lab_id: labId,
                is_active: true
            }
        });

        if (equipmentCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'No equipment found in this lab'
            });
        }

        // Soft delete all equipment in this lab
        const result = await Equipment.update(
            { is_active: false },
            {
                where: {
                    lab_id: labId,
                    is_active: true
                }
            }
        );

        res.json({
            success: true,
            message: `Successfully deleted ${equipmentCount} equipment items from ${lab.name}`,
            data: {
                deletedCount: equipmentCount,
                labName: lab.name
            }
        });
    } catch (error) {
        console.error('Error bulk deleting equipment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete equipment',
            error: error.message
        });
    }
});



// POST bulk import equipment
router.post('/bulk-import', async (req, res) => {
    try {
        const { equipmentData } = req.body;

        if (!Array.isArray(equipmentData) || equipmentData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Equipment data array is required'
            });
        }

        if (equipmentData.length > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Cannot import more than 1000 items at once'
            });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        // Validate and import each equipment item
        for (let i = 0; i < equipmentData.length; i++) {
            const data = equipmentData[i];
            const rowNumber = i + 1;

            try {
                // Validate required fields
                if (!data.name || !data.serial_number || !data.category || !data.lab_id) {
                    results.failed++;
                    results.errors.push(`Row ${rowNumber}: Missing required fields (name, serial_number, category, lab_id)`);
                    continue;
                }

                // Check if lab exists
                const lab = await Lab.findByPk(data.lab_id);
                if (!lab) {
                    results.failed++;
                    results.errors.push(`Row ${rowNumber}: Lab with ID ${data.lab_id} not found`);
                    continue;
                }

                // Handle multiple equipment items if quantity > 1
                const quantity = parseInt(data.quantity) || 1;
                
                for (let q = 0; q < quantity; q++) {
                    try {
                        // Generate unique serial number for each item if quantity > 1
                        let serialNumber = data.serial_number.trim();
                        if (quantity > 1) {
                            serialNumber = `${data.serial_number.trim()}-${(q + 1).toString().padStart(2, '0')}`;
                        }

                        // Check for existing serial numbers and generate unique ones if needed
                        let attempts = 0;
                        while (attempts < 10) {
                            const existing = await Equipment.findOne({ 
                                where: { serial_number: serialNumber, is_active: true } 
                            });
                            if (!existing) break;
                            
                            attempts++;
                            const timestamp = new Date().getTime().toString().slice(-4);
                            serialNumber = `${data.serial_number.trim()}-${(q + 1).toString().padStart(2, '0')}-${timestamp}`;
                        }
                        
                        if (attempts >= 10) {
                            results.failed++;
                            results.errors.push(`Row ${rowNumber}: Could not generate unique serial number after 10 attempts`);
                            continue;
                        }

                        // Prepare equipment data
                        const equipmentDataItem = {
                            name: data.name.trim(),
                            description: data.description?.trim() || null,
                            serial_number: serialNumber,
                            model: data.model?.trim() || null,
                            manufacturer: data.manufacturer?.trim() || null,
                            category: data.category.trim(),
                            lab_id: parseInt(data.lab_id),
                            location_details: data.location_details?.trim() || null,
                            status: data.status || 'available',
                            condition_status: data.condition_status || 'good',
                            purchase_price: data.purchase_price ? parseFloat(data.purchase_price) : null,
                            current_value: data.current_value ? parseFloat(data.current_value) : null,
                            purchase_date: data.purchase_date && !isNaN(new Date(data.purchase_date)) ? new Date(data.purchase_date) : new Date(),
                            warranty_expiry: data.warranty_expiry ? new Date(data.warranty_expiry) : null,
                            processor: data.processor?.trim() || null,
                            ram: data.ram?.trim() || null,
                            storage: data.storage?.trim() || null,
                            graphics_card: data.graphics_card?.trim() || null,
                            operating_system: data.operating_system?.trim() || null,
                            // Additional fields for your format
                            stock_register_page: data.stock_register_page ? String(data.stock_register_page) : null,
                            is_active: true,
                            created_by: req.user.userId
                        };

                        // Validate status values
                        const validStatuses = ['available', 'in_use', 'maintenance', 'broken', 'retired'];
                        if (!validStatuses.includes(equipmentDataItem.status)) {
                            results.failed++;
                            results.errors.push(`Row ${rowNumber}: Invalid status '${equipmentDataItem.status}'. Must be one of: ${validStatuses.join(', ')}`);
                            continue;
                        }

                        // Validate condition status
                        const validConditions = ['excellent', 'good', 'fair', 'poor'];
                        if (!validConditions.includes(equipmentDataItem.condition_status)) {
                            results.failed++;
                            results.errors.push(`Row ${rowNumber}: Invalid condition '${equipmentDataItem.condition_status}'. Must be one of: ${validConditions.join(', ')}`);
                            continue;
                        }

                        // Validate category
                        const validCategories = [
                            'computer', 'printer', 'projector', 'scanner', 'microscope',
                            'centrifuge', 'spectrophotometer', 'ph_meter', 'balance',
                            'incubator', 'autoclave', 'pipette', 'thermometer',
                            'glassware', 'safety_equipment', 'lab_equipment', 'network', 'network_equipment', 'other'
                        ];
                        if (!validCategories.includes(equipmentDataItem.category)) {
                            results.failed++;
                            results.errors.push(`Row ${rowNumber}: Invalid category '${equipmentDataItem.category}'. Must be one of: ${validCategories.join(', ')}`);
                            continue;
                        }

                        // Create equipment
                        console.log(`📝 Creating equipment row ${rowNumber} (${q + 1}/${quantity}):`, {
                            name: equipmentDataItem.name,
                            serial_number: equipmentDataItem.serial_number,
                            category: equipmentDataItem.category,
                            lab_id: equipmentDataItem.lab_id
                        });
                        await Equipment.create(equipmentDataItem);
                        console.log(`✅ Successfully created equipment: ${equipmentDataItem.name} (${equipmentDataItem.serial_number})`);
                        results.success++;

                    } catch (itemError) {
                        console.error(`❌ Error importing equipment row ${rowNumber} item ${q + 1}:`, itemError);
                        results.failed++;
                        results.errors.push(`Row ${rowNumber} item ${q + 1}: ${itemError.message}`);
                    }
                }

            } catch (error) {
                console.error(`❌ Error processing equipment row ${rowNumber}:`, error);
                results.failed++;
                results.errors.push(`Row ${rowNumber}: ${error.message}`);
            }
        }

        res.status(200).json({
            success: true,
            message: `Import completed. ${results.success} items imported successfully, ${results.failed} failed.`,
            data: results
        });

    } catch (error) {
        console.error('Error in bulk import:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process bulk import',
            error: error.message
        });
    }
});

module.exports = router;