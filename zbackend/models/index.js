// models/index.js - Model Associations (Compatible with current database schema)
const { sequelize } = require('../config/database');

// Import all models
const Lab = require('./Lab');
const Equipment = require('./Equipment');
const User = require('./User');
const Booking = require('./Booking');
const Notification = require('./Notification');
const NotificationSettings = require('./NotificationSettings');
const Maintenance = require('./Maintenance');
const Report = require('./Report');
const ReportSchedule = require('./ReportSchedule');
const Order = require('./Order');
const Incident = require('./Incident');
const Training = require('./Training');
const TrainingCertification = require('./TrainingCertification');
const RecentlyAccessed = require('./RecentlyAccessed');

const Role = require('./Role');
const Department = require('./Department');

// ============= ASSOCIATIONS =============

// ============= USER ASSOCIATIONS =============

// User - Notification associations
User.hasMany(Notification, {
    foreignKey: 'user_id',
    as: 'receivedNotifications'
});
Notification.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'recipient'
});

// User - Notification (creator) associations
User.hasMany(Notification, {
    foreignKey: 'created_by',
    as: 'createdNotifications'
});
Notification.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'creator'
});

// User - NotificationSettings associations
User.hasOne(NotificationSettings, {
    foreignKey: 'user_id',
    as: 'notificationSettings'
});
NotificationSettings.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

// User - Lab associations (creator)
User.hasMany(Lab, {
    foreignKey: 'created_by',
    as: 'createdLabs'
});
Lab.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'labCreator'  // ✅ Matches routes/labs.js
});

// User - Equipment associations (creator)
User.hasMany(Equipment, {
    foreignKey: 'created_by',
    as: 'createdEquipment'
});
Equipment.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'creator'  // ✅ FIXED - Matches routes/equipment.js
});

// User - Booking associations
User.hasMany(Booking, {
    foreignKey: 'user_id',
    as: 'bookings'
});
Booking.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'  // ✅ FIXED - Matches routes/bookings.js
});

// User - Maintenance associations (technician)
User.hasMany(Maintenance, {
    foreignKey: 'technician_id',
    as: 'assignedMaintenances'
});
Maintenance.belongsTo(User, {
    foreignKey: 'technician_id',
    as: 'technician'
});

// User - Maintenance associations (creator)
User.hasMany(Maintenance, {
    foreignKey: 'created_by',
    as: 'createdMaintenances'
});
Maintenance.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'creator'
});

// User - Maintenance associations (approver)
User.hasMany(Maintenance, {
    foreignKey: 'approved_by',
    as: 'approvedMaintenances'
});
Maintenance.belongsTo(User, {
    foreignKey: 'approved_by',
    as: 'approver'
});

// User - Report associations
User.hasMany(Report, {
    foreignKey: 'generated_by',
    as: 'generatedReports'
});
Report.belongsTo(User, {
    foreignKey: 'generated_by',
    as: 'generator'
});

// User - ReportSchedule associations
User.hasMany(ReportSchedule, {
    foreignKey: 'created_by',
    as: 'createdSchedules'
});
ReportSchedule.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'creator'
});

// User - Order associations
User.hasMany(Order, {
    foreignKey: 'created_by',
    as: 'createdOrders'
});
Order.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'creator'
});

// User - Incident associations (reporter)
User.hasMany(Incident, {
    foreignKey: 'reported_by',
    as: 'reportedIncidents'
});
Incident.belongsTo(User, {
    foreignKey: 'reported_by',
    as: 'incidentReporter'  // ✅ FIXED - Matches routes/incidents.js
});

// User - Incident associations (assignee)
User.hasMany(Incident, {
    foreignKey: 'assigned_to',
    as: 'assignedIncidents'
});
Incident.belongsTo(User, {
    foreignKey: 'assigned_to',
    as: 'incidentAssignee'  // ✅ FIXED - Matches routes/incidents.js
});

// User - Incident associations (resolver)
User.hasMany(Incident, {
    foreignKey: 'resolved_by',
    as: 'resolvedIncidents'
});
Incident.belongsTo(User, {
    foreignKey: 'resolved_by',
    as: 'incidentResolver'  // ✅ FIXED - Matches routes/incidents.js
});

// User - Training associations (creator)
User.hasMany(Training, {
    foreignKey: 'created_by',
    as: 'createdTrainings'
});
Training.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'creator'
});

// User - TrainingCertification associations
User.hasMany(TrainingCertification, {
    foreignKey: 'user_id',
    as: 'certifications'
});
TrainingCertification.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

// User - TrainingCertification associations (issuer)
User.hasMany(TrainingCertification, {
    foreignKey: 'issued_by',
    as: 'issuedCertifications'
});
TrainingCertification.belongsTo(User, {
    foreignKey: 'issued_by',
    as: 'issuer'
});

// User - RecentlyAccessed associations
User.hasMany(RecentlyAccessed, {
    foreignKey: 'user_id',
    as: 'recentlyAccessed'
});
RecentlyAccessed.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

// ============= LAB ASSOCIATIONS =============

// Lab - Equipment associations
Lab.hasMany(Equipment, {
    foreignKey: 'lab_id',
    as: 'equipment'
});
Equipment.belongsTo(Lab, {
    foreignKey: 'lab_id',
    as: 'lab'  // ✅ FIXED - Matches routes/equipment.js
});

// Lab - Booking associations
Lab.hasMany(Booking, {
    foreignKey: 'lab_id',
    as: 'bookings'
});
Booking.belongsTo(Lab, {
    foreignKey: 'lab_id',
    as: 'lab'  // ✅ FIXED - Matches routes/bookings.js
});

// ============= EQUIPMENT ASSOCIATIONS =============

// Equipment - Booking associations
Equipment.hasMany(Booking, {
    foreignKey: 'equipment_id',
    as: 'bookings'
});
Booking.belongsTo(Equipment, {
    foreignKey: 'equipment_id',
    as: 'equipment'  // ✅ FIXED - Matches routes/bookings.js
});

// Equipment - Maintenance associations
Equipment.hasMany(Maintenance, {
    foreignKey: 'equipment_id',
    as: 'maintenances'
});
Maintenance.belongsTo(Equipment, {
    foreignKey: 'equipment_id',
    as: 'equipment'
});

// Equipment - Incident associations
Equipment.hasMany(Incident, {
    foreignKey: 'equipment_id',
    as: 'incidents'
});
Incident.belongsTo(Equipment, {
    foreignKey: 'equipment_id',
    as: 'relatedEquipment'  // ✅ FIXED - Matches routes/incidents.js
});

// Equipment - Training associations
Equipment.hasMany(Training, {
    foreignKey: 'equipment_id',
    as: 'trainings'
});
Training.belongsTo(Equipment, {
    foreignKey: 'equipment_id',
    as: 'equipment'
});

// ============= TRAINING ASSOCIATIONS =============

// Training - TrainingCertification associations
Training.hasMany(TrainingCertification, {
    foreignKey: 'training_id',
    as: 'certifications'
});
TrainingCertification.belongsTo(Training, {
    foreignKey: 'training_id',
    as: 'training'
});

// ============= REPORT ASSOCIATIONS =============

// ReportSchedule - Report associations
ReportSchedule.hasMany(Report, {
    foreignKey: 'schedule_id',
    as: 'reports'
});
Report.belongsTo(ReportSchedule, {
    foreignKey: 'schedule_id',
    as: 'schedule'
});

// ============= RBAC ASSOCIATIONS =============
User.belongsTo(Role,       { foreignKey: 'roleId',       as: 'role_info',       constraints: false });
Role.hasMany(User,         { foreignKey: 'roleId',       as: 'users',           constraints: false });
User.belongsTo(Department, { foreignKey: 'departmentId', as: 'department_info', constraints: false });
Department.hasMany(User,   { foreignKey: 'departmentId', as: 'dept_users',      constraints: false });

console.log('✅ Model associations defined successfully');

// ============= EXPORT ALL MODELS =============
module.exports = {
    sequelize,
    User,
    Lab,
    Equipment,
    Booking,
    Notification,
    NotificationSettings,
    Maintenance,
    Report,
    ReportSchedule,
    Order,
    Incident,
    Training,
    TrainingCertification,
    RecentlyAccessed,
    Role,
    Department,
};