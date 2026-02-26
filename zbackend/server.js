const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sequelize } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CRITICAL: Load models and associations BEFORE routes
console.log('📦 Loading models and associations...');
require('./models'); // This executes models/index.js and sets up all associations
console.log('✅ Models and associations loaded');

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', process.env.CLIENT_URL].filter(Boolean),
    credentials: true,
    optionsSuccessStatus: 200
}));
// Increase payload limits for image uploads (10MB limit)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser middleware
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.path} - Body:`, JSON.stringify(req.body, null, 2));
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'LabMS Backend is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'LabMS Backend API is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'connected' // You can add actual DB check here if needed
    });
});

// ✅ NEW: Test associations endpoint
app.get('/api/test/associations', (req, res) => {
    try {
        const { Equipment, Booking, Lab, User } = require('./models');
        
        res.json({
            success: true,
            message: 'Model associations are loaded',
            associations: {
                Equipment: Object.keys(Equipment.associations),
                Booking: Object.keys(Booking.associations),
                Lab: Object.keys(Lab.associations),
                User: Object.keys(User.associations)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error loading associations',
            error: error.message
        });
    }
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        message: 'API is working!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root endpoint with API documentation
app.get('/', (req, res) => {
    res.json({
        message: 'Lab Management System API',
        version: '1.0.0',
        status: 'Active',
        note: 'This application uses service layer architecture',
        endpoints: {
            health: '/health',
            apiHealth: '/api/health',
            test: '/api/test',
            testAssociations: '/api/test/associations'
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server
const server = app.listen(PORT, async () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📚 API Documentation available at http://localhost:${PORT}/`);

    // Test database connection
    try {
        await sequelize.authenticate();
        console.log('✅ Database connected');
        
        // ✅ Optional: Sync models (use cautiously in production)
        // await sequelize.sync({ alter: false });
        // console.log('✅ Database models synchronized');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Process terminated');
        process.exit(0);
    });
});

module.exports = app;